import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input as ChakraInput,
} from '@chakra-ui/react';

/**
 * Campo de formulario reutilizable de AutoCare.
 * Usa FormControl, FormLabel e Input de Chakra UI y conserva la misma API.
 */
function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder = '',
  error = '',
  required = false,
  disabled = false,
}) {
  return (
    <FormControl mb={4} isRequired={required} isInvalid={Boolean(error)} isDisabled={disabled}>
      {label && <FormLabel htmlFor={name}>{label}</FormLabel>}

      <ChakraInput
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        bg="white"
        focusBorderColor="brand.500"
      />

      {error && <FormErrorMessage>{error}</FormErrorMessage>}
    </FormControl>
  );
}

export default Input;
