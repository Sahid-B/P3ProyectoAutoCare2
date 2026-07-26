import { useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Button,
} from '@chakra-ui/react';

/**
 * Dialogo de confirmacion reutilizable para acciones destructivas
 * (eliminar un producto, cancelar un pedido, etc.).
 */
function DialogoConfirmar({
  estaAbierto,
  alCerrar,
  alConfirmar,
  titulo = 'Confirmar accion',
  mensaje = 'Esta accion no se puede deshacer.',
  textoConfirmar = 'Eliminar',
  textoCancelar = 'Cancelar',
  colorConfirmar = 'red',
  cargando = false,
}) {
  const referenciaCancelar = useRef(null);

  return (
    <AlertDialog
      isOpen={estaAbierto}
      leastDestructiveRef={referenciaCancelar}
      onClose={alCerrar}
      isCentered
    >
      <AlertDialogOverlay>
        <AlertDialogContent mx={4}>
          <AlertDialogHeader fontSize="lg" fontWeight="bold" color="secondary.900">
            {titulo}
          </AlertDialogHeader>

          <AlertDialogBody color="secondary.700">{mensaje}</AlertDialogBody>

          <AlertDialogFooter gap={3}>
            <Button ref={referenciaCancelar} onClick={alCerrar} variant="secondary" isDisabled={cargando}>
              {textoCancelar}
            </Button>
            <Button colorScheme={colorConfirmar} variant="solid" onClick={alConfirmar} isLoading={cargando}>
              {textoConfirmar}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
}

export default DialogoConfirmar;
