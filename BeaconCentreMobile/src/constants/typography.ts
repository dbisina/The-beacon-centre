// src/constants/typography.ts - MODERN SYSTEM
export const typography = {
    fonts: {
      poppins: {
        regular: 'Poppins_400Regular',
        medium: 'Poppins_500Medium',
        semiBold: 'Poppins_600SemiBold',
        bold: 'Poppins_700Bold',
      },
      notoSerif: {
        regular: 'NotoSerif_400Regular',
        bold: 'NotoSerif_700Bold',
      },
    },
    
    sizes: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20,
      '2xl': 24,
      '3xl': 30,
      '4xl': 36,
      '5xl': 48,
    },
    
    lineHeights: {
      tight: 1.25,
      snug: 1.375,
      normal: 1.5,
      relaxed: 1.625,
      loose: 2,
    },
    
    letterSpacing: {
      tighter: -0.5,
      tight: -0.25,
      normal: 0,
      wide: 0.25,
      wider: 0.5,
    },
    
    // Semantic Text Styles
    styles: {
      h1: {
        fontFamily: 'Poppins_700Bold',
        fontSize: 36,
        lineHeight: 45,
        letterSpacing: -0.5,
      },
      h2: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 30,
        lineHeight: 38,
        letterSpacing: -0.25,
      },
      h3: {
        fontFamily: 'Poppins_600SemiBold',
        fontSize: 24,
        lineHeight: 32,
      },
      h4: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 20,
        lineHeight: 28,
      },
      body1: {
        fontFamily: 'NotoSerif_400Regular',
        fontSize: 16,
        lineHeight: 24,
      },
      body2: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 14,
        lineHeight: 20,
      },
      caption: {
        fontFamily: 'Poppins_400Regular',
        fontSize: 12,
        lineHeight: 16,
      },
      button: {
        fontFamily: 'Poppins_500Medium',
        fontSize: 16,
        lineHeight: 20,
        letterSpacing: 0.25,
      },
    },
  };