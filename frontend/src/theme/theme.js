import { extendTheme } from '@chakra-ui/react';

// Identidad visual de AutoCare para Chakra UI.
// La paleta parte del logo: azul como color principal, gris y blanco de apoyo.
const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },

  // Paleta de colores. Cada color es una escala 50-900 para poder usarse
  // como colorScheme en los componentes de Chakra.
  colors: {
    // Azul principal del logo
    brand: {
      50: '#eff5ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#172554',
    },
    primary: {
      50: '#eff5ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#1d4ed8',
      700: '#1e40af',
      800: '#1e3a8a',
      900: '#172554',
    },
    // Gris de apoyo
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
    },
  },

  // Tipografia
  fonts: {
    heading: `'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`,
    body: `'Segoe UI', system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif`,
  },

  // Bordes redondeados
  radii: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '20px',
  },

  // Sombras
  shadows: {
    sm: '0 1px 2px rgba(15, 23, 42, 0.08)',
    md: '0 4px 12px rgba(15, 23, 42, 0.08)',
    lg: '0 12px 28px rgba(15, 23, 42, 0.12)',
    outline: '0 0 0 3px rgba(59, 130, 246, 0.35)',
  },

  // Espaciados adicionales (se suman a la escala por defecto de Chakra)
  space: {
    section: '4rem',
    18: '4.5rem',
  },

  // Estilos globales
  styles: {
    global: {
      'html, body': {
        backgroundColor: 'secondary.50',
        color: 'secondary.900',
      },
    },
  },

  // Personalizacion de componentes
  components: {
    Button: {
      baseStyle: {
        fontWeight: 'semibold',
        borderRadius: 'md',
      },
      variants: {
        // Variantes propias de AutoCare, con los mismos nombres que ya
        // usaban las paginas: primary, secondary y outline.
        primary: {
          bg: 'brand.600',
          color: 'white',
          _hover: { bg: 'brand.700', _disabled: { bg: 'brand.600' } },
          _active: { bg: 'brand.800' },
        },
        secondary: {
          bg: 'secondary.100',
          color: 'secondary.900',
          _hover: { bg: 'secondary.200' },
          _active: { bg: 'secondary.300' },
        },
        outline: {
          bg: 'transparent',
          color: 'brand.600',
          border: '2px solid',
          borderColor: 'brand.600',
          _hover: { bg: 'brand.50' },
        },
      },
      defaultProps: {
        variant: 'primary',
      },
    },
  },
});

export default theme;
