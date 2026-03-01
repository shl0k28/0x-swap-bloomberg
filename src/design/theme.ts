import { extendTheme } from '@chakra-ui/react';

/**
 * Bloomberg-inspired design tokens for the terminal UI.
 */
export const terminalTheme = extendTheme({
  config: {
    initialColorMode: 'dark',
    useSystemColorMode: false,
  },
  colors: {
    bgVoid: '#08080d',
    bgBase: '#0d0d14',
    bgSurface: '#12121a',
    bgRaised: '#1a1a26',
    border: '#252535',
    borderBright: '#38384f',
    amber: '#f5a623',
    amberDim: '#7a5010',
    green: '#00c076',
    greenDim: '#004d30',
    red: '#ff3b57',
    cyan: '#00b8d9',
    textPrimary: '#ddddf0',
    textSecondary: '#7777aa',
    textDim: '#404060',
  },
  fonts: {
    heading: "'Iosevka Aile', 'Iosevka', sans-serif",
    body: "'Iosevka Aile', 'Iosevka', sans-serif",
    mono: '"Iosevka Fixed", "Iosevka", monospace',
    hero: "'Iosevka Etoile', serif",
  },
  textStyles: {
    meta: {
      fontSize: '10px',
      fontFamily: 'mono',
      color: 'textDim',
      letterSpacing: '0.08em',
    },
    value: {
      fontSize: '12px',
      fontFamily: 'mono',
      color: 'textPrimary',
    },
    sectionLabel: {
      fontSize: '11px',
      fontFamily: 'mono',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
      color: 'textSecondary',
    },
    tabLabel: {
      fontSize: '11px',
      fontFamily: 'mono',
      textTransform: 'uppercase',
      letterSpacing: '0.12em',
    },
    heroTitle: {
      fontSize: '18px',
      fontFamily: 'hero',
      lineHeight: '1',
      color: 'textPrimary',
    },
  },
  components: {
    Button: {
      baseStyle: {
        borderRadius: '2px',
        boxShadow: 'none',
        maxW: '480px',
        _focusVisible: {
          boxShadow: 'none',
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          fontFamily: 'mono',
          fontFeatureSettings: '"ss08" 1',
          maxW: '480px',
          _focus: {
            borderColor: 'amber',
            boxShadow: 'none',
          },
          _focusVisible: {
            borderColor: 'amber',
            boxShadow: 'none',
          },
        },
      },
      defaultProps: {
        focusBorderColor: 'borderBright',
      },
    },
    Textarea: {
      baseStyle: {
        fontFamily: 'mono',
        fontFeatureSettings: '"ss08" 1',
      },
      defaultProps: {
        focusBorderColor: 'borderBright',
      },
    },
    Divider: {
      baseStyle: {
        borderColor: 'border',
      },
    },
  },
  styles: {
    global: {
      ':root': {
        '--bg-void': '#08080d',
        '--bg-base': '#0d0d14',
        '--bg-surface': '#12121a',
        '--bg-raised': '#1a1a26',
        '--border': '#252535',
        '--border-bright': '#38384f',
        '--amber': '#f5a623',
        '--amber-dim': '#7a5010',
        '--green': '#00c076',
        '--green-dim': '#004d30',
        '--red': '#ff3b57',
        '--cyan': '#00b8d9',
        '--text-primary': '#ddddf0',
        '--text-secondary': '#7777aa',
        '--text-dim': '#404060',
      },
      'html, body, #root': {
        height: '100%',
        minHeight: '100vh',
        margin: 0,
        padding: 0,
        overflow: 'hidden',
      },
      body: {
        background: 'bgVoid',
        color: 'textPrimary',
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      },
      '*': {
        borderColor: 'border',
        scrollbarWidth: 'none',
      },
      '*:focus, *:focus-visible': {
        outline: 'none !important',
        boxShadow: 'none !important',
      },
      '::-webkit-scrollbar': {
        display: 'none',
      },
    },
  },
});
