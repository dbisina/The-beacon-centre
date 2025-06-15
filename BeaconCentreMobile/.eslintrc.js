module.exports = {
    extends: ['expo', '@react-native-community'],
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react-native/no-inline-styles': 'warn',
    },
    overrides: [
      {
        files: ['**/__tests__/**/*', '**/*.test.*'],
        env: {
          jest: true,
        },
      },
    ],
  };