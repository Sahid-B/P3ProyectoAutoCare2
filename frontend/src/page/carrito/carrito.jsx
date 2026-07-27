import { useEffect, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  Divider,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Image,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Radio,
  RadioGroup,
  SimpleGrid,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { FaTrash, FaCartShopping, FaGear, FaStore, FaLock, FaWifi } from 'react-icons/fa6';
import Layout from '../../components/layout/index.jsx';
import DialogoConfirmar from '../../components/dialogo-confirmar/index.jsx';
import { useCarrito } from '../../context/carrito-context.jsx';
import {
  obtenerMetodosPago,
  crearPedido,
  iniciarPago,
  confirmarPago,
} from '../../services/repuestos-service.js';
import { moneda } from '../../utils/formato.js';

function Carrito() {
  const { items, total, cambiarCantidad, eliminarProducto, vaciarCarrito } = useCarrito();
  const navigate = useNavigate();
  const toast = useToast();

  const [metodosPago, setMetodosPago] = useState([]);
  const [metodoSeleccionado, setMetodoSeleccionado] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');
  const [itemAEliminar, setItemAEliminar] = useState(null);
  const [enLinea, setEnLinea] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  // La compra requiere conexion: se vigila el estado de red en todo momento.
  useEffect(() => {
    const alConectar = () => setEnLinea(true);
    const alDesconectar = () => setEnLinea(false);

    window.addEventListener('online', alConectar);
    window.addEventListener('offline', alDesconectar);

    return () => {
      window.removeEventListener('online', alConectar);
      window.removeEventListener('offline', alDesconectar);
    };
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerMetodosPago()
      .then((respuesta) => {
        if (!activo) return;
        const metodos = respuesta.metodos || [];
        setMetodosPago(metodos);
        if (metodos.length > 0) setMetodoSeleccionado(metodos[0].id);
      })
      .catch(() => {
        // Sin conexion no se pueden consultar los metodos de pago disponibles.
      });

    return () => {
      activo = false;
    };
  }, []);

  const confirmarEliminacion = () => {
    eliminarProducto(itemAEliminar.producto_id);
    setItemAEliminar(null);
  };

  /**
   * Crea el pedido y ejecuta el cobro. La compra solo queda pagada si el
   * backend confirma la captura con el proveedor.
   */
  const [paypalCargado, setPaypalCargado] = useState(false);

  useEffect(() => {
    if (metodoSeleccionado === 'paypal') {
      const metodoPaypal = metodosPago.find(m => m.id === 'paypal');
      if (metodoPaypal && metodoPaypal.clientId) {
        if (window.paypal) {
          setPaypalCargado(true);
          return;
        }

        // Add script tag to load PayPal JS SDK
        const script = document.createElement('script');
        script.id = 'paypal-sdk-script';
        script.src = `https://www.paypal.com/sdk/js?client-id=${metodoPaypal.clientId}&currency=USD`;
        script.async = true;
        script.onload = () => setPaypalCargado(true);
        script.onerror = () => setError('No se pudo cargar la pasarela de PayPal.');
        document.body.appendChild(script);
      }
    }
  }, [metodoSeleccionado, metodosPago]);

  useEffect(() => {
    if (metodoSeleccionado === 'paypal' && paypalCargado && window.paypal) {
      const container = document.getElementById('paypal-button-container');
      if (container) {
        container.innerHTML = '';
        window.paypal.Buttons({
          createOrder: async () => {
            setError('');
            setProcesando(true);
            try {
              const respuestaPedido = await crearPedido(
                items.map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad })),
              );
              const compras = respuestaPedido.compras || [];
              if (compras.length === 0) {
                throw new Error('No se pudo crear el pedido.');
              }

              // Guardamos compras para capturar en onApprove
              window.comprasPendientesPaypal = compras;

              const primeraCompra = compras[0];
              const respuestaOrden = await iniciarPago(primeraCompra.id, 'paypal');
              if (!respuestaOrden?.orden?.ordenId) {
                throw new Error('No se pudo iniciar el pago en PayPal.');
              }

              return respuestaOrden.orden.ordenId;
            } catch (err) {
              setError(err.message || 'Error al iniciar el pago con PayPal.');
              setProcesando(false);
              throw err;
            }
          },
          onApprove: async (data, actions) => {
            try {
              const compras = window.comprasPendientesPaypal || [];
              for (const compra of compras) {
                await confirmarPago(compra.id, data.orderID);
              }

              vaciarCarrito();
              toast({
                title: 'Compra realizada',
                description: 'Tu pedido y pago con PayPal fueron procesados con éxito.',
                status: 'success',
                duration: 5000,
                isClosable: true,
              });
              navigate('/mis-pedidos');
            } catch (err) {
              setError(err.message || 'Error al confirmar la transacción de PayPal.');
            } finally {
              setProcesando(false);
            }
          },
          onCancel: () => {
            setError('Pago cancelado por el usuario.');
            setProcesando(false);
          },
          onError: (err) => {
            setError('Ocurrió un error con el botón de PayPal.');
            setProcesando(false);
          }
        }).render('#paypal-button-container');
      }
    }
  }, [metodoSeleccionado, paypalCargado, items, navigate, toast, vaciarCarrito]);

  const realizarCompra = async () => {
    setError('');

    if (!enLinea) {
      setError('Necesitas conexion a Internet para confirmar una compra.');
      return;
    }

    if (!metodoSeleccionado) {
      setError('Selecciona un metodo de pago.');
      return;
    }

    try {
      setProcesando(true);

      const respuestaPedido = await crearPedido(
        items.map((item) => ({ producto_id: item.producto_id, cantidad: item.cantidad })),
      );

      const compras = respuestaPedido.compras || [];
      const pagadas = [];

      for (const compra of compras) {
        const respuestaOrden = await iniciarPago(compra.id, metodoSeleccionado);
        await confirmarPago(compra.id, respuestaOrden.orden.ordenId);
        pagadas.push(compra.id);
      }

      vaciarCarrito();

      toast({
        title: 'Compra realizada',
        description:
          pagadas.length === 1
            ? `Tu pedido #${pagadas[0]} fue pagado correctamente.`
            : `Se generaron ${pagadas.length} pedidos, uno por cada tienda.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/mis-pedidos');
    } catch (err) {
      setError(err.message || 'No se pudo completar la compra.');
    } finally {
      setProcesando(false);
    }
  };

  if (items.length === 0) {
    return (
      <Layout conSidebar>
        <Heading as="h1" size="lg" color="secondary.900" mb={6}>
          Mi carrito
        </Heading>

        <Flex
          direction="column"
          align="center"
          justify="center"
          textAlign="center"
          py={16}
          bg="white"
          borderWidth="1px"
          borderColor="secondary.200"
          borderRadius="lg"
        >
          <Icon as={FaCartShopping} boxSize={12} color="brand.300" mb={4} />
          <Heading as="h3" size="sm" color="secondary.900" mb={2}>
            Tu carrito esta vacio
          </Heading>
          <Text color="secondary.600" fontSize="sm" mb={6}>
            Explora el catalogo y agrega los repuestos que necesitas.
          </Text>
          <Button as={RouterLink} to="/repuestos" variant="primary">
            Ver repuestos
          </Button>
        </Flex>
      </Layout>
    );
  }

  return (
    <Layout conSidebar>
      <Heading as="h1" size="lg" color="secondary.900" mb={1}>
        Mi carrito
      </Heading>
      <Text color="secondary.600" mb={6}>
        Revisa las cantidades antes de confirmar tu compra.
      </Text>

      {!enLinea && (
        <Alert status="warning" borderRadius="md" mb={5} fontSize="sm">
          <AlertIcon />
          Estas sin conexion. Puedes revisar tu carrito, pero para confirmar el pago y descontar el
          stock necesitas conectarte a Internet.
        </Alert>
      )}

      {error && (
        <Alert status="error" borderRadius="md" mb={5} fontSize="sm">
          <AlertIcon />
          {error}
        </Alert>
      )}

      <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6} alignItems="start">
        {/* Lineas del carrito */}
        <Box gridColumn={{ lg: 'span 2' }}>
          <Stack spacing={4}>
            {items.map((item) => (
              <Card key={item.producto_id} bg="white" borderRadius="lg" shadow="sm">
                <CardBody>
                  <Flex gap={4} align={{ base: 'flex-start', sm: 'center' }} direction={{ base: 'column', sm: 'row' }}>
                    {item.imagen_url ? (
                      <Image
                        src={item.imagen_url}
                        alt={item.nombre}
                        boxSize="80px"
                        objectFit="cover"
                        borderRadius="md"
                        fallback={
                          <Flex boxSize="80px" bg="secondary.100" borderRadius="md" align="center" justify="center">
                            <Icon as={FaGear} color="secondary.400" boxSize={6} />
                          </Flex>
                        }
                      />
                    ) : (
                      <Flex boxSize="80px" bg="secondary.100" borderRadius="md" align="center" justify="center">
                        <Icon as={FaGear} color="secondary.400" boxSize={6} />
                      </Flex>
                    )}

                    <Box flex="1" minW="0">
                      <Text fontWeight="semibold" color="secondary.900" noOfLines={2}>
                        {item.nombre}
                      </Text>
                      {item.nombre_local && (
                        <HStack spacing={1} color="secondary.500" fontSize="xs" mt={1}>
                          <Icon as={FaStore} />
                          <Text noOfLines={1}>{item.nombre_local}</Text>
                        </HStack>
                      )}
                      <Text fontSize="sm" color="brand.700" fontWeight="bold" mt={1}>
                        {moneda(item.precio)} c/u
                      </Text>
                    </Box>

                    <Flex align="center" gap={3}>
                      <NumberInput
                        value={item.cantidad}
                        min={1}
                        max={item.stock}
                        onChange={(_texto, valor) =>
                          cambiarCantidad(item.producto_id, Number.isNaN(valor) ? 1 : valor)
                        }
                        maxW="110px"
                        size="sm"
                        bg="white"
                        focusBorderColor="brand.500"
                      >
                        <NumberInputField />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>

                      <Text fontWeight="bold" color="secondary.900" minW="80px" textAlign="right">
                        {moneda(item.precio * item.cantidad)}
                      </Text>

                      <IconButton
                        aria-label={`Eliminar ${item.nombre} del carrito`}
                        icon={<FaTrash />}
                        size="sm"
                        variant="ghost"
                        colorScheme="red"
                        onClick={() => setItemAEliminar(item)}
                      />
                    </Flex>
                  </Flex>
                </CardBody>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Resumen y pago */}
        <Card bg="white" borderRadius="lg" shadow="sm" position={{ lg: 'sticky' }} top="88px">
          <CardBody>
            <Heading as="h2" size="sm" color="secondary.900" mb={4}>
              Resumen de la compra
            </Heading>

            <Flex justify="space-between" fontSize="sm" color="secondary.600" mb={2}>
              <Text>Subtotal</Text>
              <Text>{moneda(total)}</Text>
            </Flex>
            <Flex justify="space-between" fontSize="sm" color="secondary.600" mb={3}>
              <Text>Envio</Text>
              <Text>Retiro en tienda</Text>
            </Flex>

            <Divider mb={3} />

            <Flex justify="space-between" fontWeight="bold" fontSize="lg" color="secondary.900" mb={5}>
              <Text>Total</Text>
              <Text color="brand.700">{moneda(total)}</Text>
            </Flex>

            <Text fontWeight="semibold" fontSize="sm" color="secondary.800" mb={2}>
              Metodo de pago
            </Text>

            {metodosPago.length === 0 ? (
              <Alert status="warning" borderRadius="md" fontSize="xs" mb={4}>
                <AlertIcon />
                No hay metodos de pago habilitados en el servidor. Revisa la configuracion de PayPal
                o activa el modo simulado de desarrollo.
              </Alert>
            ) : (
              <RadioGroup value={metodoSeleccionado} onChange={setMetodoSeleccionado} mb={4}>
                <Stack spacing={3}>
                  {metodosPago.map((metodo) => (
                    <Box
                      key={metodo.id}
                      borderWidth="1px"
                      borderColor={metodoSeleccionado === metodo.id ? 'brand.400' : 'secondary.200'}
                      borderRadius="md"
                      p={3}
                    >
                      <Radio value={metodo.id} colorScheme="brand">
                        <Text fontSize="sm" fontWeight="medium" color="secondary.900">
                          {metodo.nombre}
                        </Text>
                      </Radio>
                      <Text fontSize="xs" color="secondary.500" mt={1} ml={6}>
                        {metodo.descripcion}
                      </Text>
                    </Box>
                  ))}
                </Stack>
              </RadioGroup>
            )}

            {metodoSeleccionado === 'paypal' ? (
              <Box id="paypal-button-container" my={4} minH="45px" />
            ) : (
              <Button
                variant="primary"
                w="100%"
                leftIcon={enLinea ? <FaLock /> : <FaWifi />}
                onClick={realizarCompra}
                isLoading={procesando}
                isDisabled={!enLinea || metodosPago.length === 0}
              >
                {enLinea ? 'Confirmar compra' : 'Requiere conexion'}
              </Button>
            )}

            <Text fontSize="xs" color="secondary.500" mt={3} textAlign="center">
              El pedido se marca como pagado solo cuando el proveedor de pago confirma la
              transaccion.
            </Text>

            <Button variant="secondary" w="100%" mt={3} size="sm" onClick={vaciarCarrito}>
              Vaciar carrito
            </Button>
          </CardBody>
        </Card>
      </SimpleGrid>

      <DialogoConfirmar
        estaAbierto={Boolean(itemAEliminar)}
        alCerrar={() => setItemAEliminar(null)}
        alConfirmar={confirmarEliminacion}
        titulo="Quitar del carrito"
        mensaje={`Se quitara "${itemAEliminar?.nombre}" de tu carrito.`}
        textoConfirmar="Si, quitar"
      />
    </Layout>
  );
}

export default Carrito;
