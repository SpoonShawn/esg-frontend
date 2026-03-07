// Corevo Color Palette
export const colors = {
  // Primary brand colors
  mossGreen: '#798A37',      // Primary accent color
  teaGreen: '#D1E2C3',       // Secondary/background color
  platinum: '#EBEBE9',       // Light background
  blackOlive: '#2F332C',     // Primary text/dark color

  // HSL equivalents for CSS variables
  mossGreenHSL: '120 30% 40%',
  teaGreenHSL: '120 20% 85%',
  platinumHSL: '60 9% 93%',
  blackOliveHSL: '120 8% 18%',

  // Semantic color mappings
  primary: {
    DEFAULT: '#2F332C',
    foreground: '#EBEBE9',
    hsl: '120 8% 18%',
    hslForeground: '60 9% 93%',
  },
  secondary: {
    DEFAULT: '#D1E2C3',
    foreground: '#2F332C',
    hsl: '120 20% 85%',
    hslForeground: '120 8% 18%',
  },
  accent: {
    DEFAULT: '#798A37',
    foreground: '#EBEBE9',
    hsl: '120 30% 40%',
    hslForeground: '60 9% 93%',
  },
  background: {
    DEFAULT: '#EBEBE9',
    hsl: '60 9% 93%',
  },
  foreground: {
    DEFAULT: '#2F332C',
    hsl: '120 8% 18%',
  },
  muted: {
    DEFAULT: '#D1E2C3',
    foreground: '#2F332C',
    hsl: '120 20% 85%',
    hslForeground: '120 8% 18%',
  },
  border: {
    DEFAULT: '#D1E2C3',
    hsl: '120 20% 85%',
  },
  input: {
    DEFAULT: '#D1E2C3',
    hsl: '120 20% 85%',
  },
  ring: {
    DEFAULT: '#798A37',
    hsl: '120 30% 40%',
  },
  card: {
    DEFAULT: '#FFFFFF',
    foreground: '#2F332C',
    hsl: '0 0% 100%',
    hslForeground: '120 8% 18%',
  },
  popover: {
    DEFAULT: '#FFFFFF',
    foreground: '#2F332C',
    hsl: '0 0% 100%',
    hslForeground: '120 8% 18%',
  },
  destructive: {
    DEFAULT: '#EF4444',
    foreground: '#EBEBE9',
    hsl: '0 84% 60%',
    hslForeground: '60 9% 93%',
  },
  success: {
    DEFAULT: '#22C55E',
    foreground: '#EBEBE9',
    hsl: '142 70% 45%',
    hslForeground: '60 9% 93%',
  },
  warning: {
    DEFAULT: '#F59E0B',
    foreground: '#EBEBE9',
    hsl: '38 92% 50%',
    hslForeground: '60 9% 93%',
  },
  sidebar: {
    background: '#EBEBE9',
    foreground: '#2F332C',
    primary: '#2F332C',
    primaryForeground: '#EBEBE9',
    accent: '#D1E2C3',
    accentForeground: '#2F332C',
    border: '#D1E2C3',
    ring: '#798A37',
    hsl: {
      background: '60 9% 93%',
      foreground: '120 8% 18%',
      primary: '120 8% 18%',
      primaryForeground: '60 9% 93%',
      accent: '120 20% 85%',
      accentForeground: '120 8% 18%',
      border: '120 20% 85%',
      ring: '120 30% 40%',
    },
  },
} as const;

// CSS Variables for use in stylesheets
export const cssVariables = {
  '--background': colors.background.hsl,
  '--foreground': colors.foreground.hsl,
  '--card': colors.card.hsl,
  '--card-foreground': colors.card.hslForeground,
  '--popover': colors.popover.hsl,
  '--popover-foreground': colors.popover.hslForeground,
  '--primary': colors.primary.hsl,
  '--primary-foreground': colors.primary.hslForeground,
  '--secondary': colors.secondary.hsl,
  '--secondary-foreground': colors.secondary.hslForeground,
  '--muted': colors.muted.hsl,
  '--muted-foreground': colors.muted.hslForeground,
  '--accent': colors.accent.hsl,
  '--accent-foreground': colors.accent.hslForeground,
  '--destructive': colors.destructive.hsl,
  '--destructive-foreground': colors.destructive.hslForeground,
  '--border': colors.border.hsl,
  '--input': colors.input.hsl,
  '--ring': colors.ring.hsl,
  '--success': colors.success.hsl,
  '--success-foreground': colors.success.hslForeground,
  '--warning': colors.warning.hsl,
  '--warning-foreground': colors.warning.hslForeground,
  '--sidebar-background': colors.sidebar.hsl.background,
  '--sidebar-foreground': colors.sidebar.hsl.foreground,
  '--sidebar-primary': colors.sidebar.hsl.primary,
  '--sidebar-primary-foreground': colors.sidebar.hsl.primaryForeground,
  '--sidebar-accent': colors.sidebar.hsl.accent,
  '--sidebar-accent-foreground': colors.sidebar.hsl.accentForeground,
  '--sidebar-border': colors.sidebar.hsl.border,
  '--sidebar-ring': colors.sidebar.hsl.ring,
} as const;

// Utility function to get CSS variables as a string
export const getCSSVariables = () => {
  return Object.entries(cssVariables)
    .map(([key, value]) => `${key}: ${value};`)
    .join('\n  ');
};

// Type exports for use in components
export type ColorScheme = typeof colors;
export type CSSVariables = typeof cssVariables; 