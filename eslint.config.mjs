import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default [
  {
    files: ['**/*.{js,mjs,cjs,ts}'],
    ignores: ['/*', '!/src'],
    rules: {
      semi: 'error',
      '@typescript-eslint/no-unused-vars': ['error', { args: 'all', caughtErrors: 'all', argsIgnorePattern: '^_' }]
    }
  },
  {
    languageOptions: {
      globals: globals.browser
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettier
];
