import { Button as ChakraButton } from '@chakra-ui/react';

/**
 * Boton reutilizable de AutoCare.
 * Se apoya en el Button de Chakra UI y conserva la misma API que ya usaban
 * las paginas. Cualquier prop adicional de Chakra (por ejemplo width) se
 * reenvia con ...rest.
 * variant: 'primary' | 'secondary' | 'outline' (definidas en el tema)
 */
function Button({
  children,
  type = 'button',
  variant = 'primary',
  onClick,
  disabled = false,
  className = '',
  ...rest
}) {
  return (
    <ChakraButton
      type={type}
      variant={variant}
      onClick={onClick}
      isDisabled={disabled}
      className={className}
      {...rest}
    >
      {children}
    </ChakraButton>
  );
}

export default Button;
