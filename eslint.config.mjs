import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import importPlugin from 'eslint-plugin-import';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },

    // extra plugin (React ones come via `extends`)
    plugins: {
      import: importPlugin,
    },

    extends: [
      js.configs.recommended,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
    ],

    rules: {
      // React 17+ – no need for `import React from 'react';`
      'react/react-in-jsx-scope': 'off',

      // --- Airbnb-ish style ---
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      'eol-last': ['error', 'always'],
      'no-trailing-spaces': 'error',
      indent: ['error', 2, { SwitchCase: 1 }],
      'react/jsx-indent': ['error', 2],
      'react/jsx-indent-props': ['error', 2],
      'comma-dangle': ['error', 'always-multiline'],
      'object-curly-spacing': ['error', 'always'],
      'object-curly-newline': ['error', {
        ObjectExpression: { multiline: true, minProperties: 4 },
        ObjectPattern: { multiline: true, minProperties: 4 },
        ImportDeclaration: { multiline: true, minProperties: 4 },
        ExportDeclaration: { multiline: true, minProperties: 4 },
      }],

      // Ignore React components / StrictMode / ALL_CAPS as “unused”
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],

      // --- Import rules (Airbnb-style) ---
      // catch `./components/Chartzzz`
      'import/no-unresolved': ['error', { caseSensitive: true }],
      // no .js/.jsx extensions in imports, but don’t touch css/svg/etc.
      'import/extensions': ['error', 'ignorePackages', {
        js: 'never',
        jsx: 'never',
      }],
      // sorted & grouped imports with a blank line between groups
      'import/order': ['error', {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/newline-after-import': ['error', { count: 1 }],
      'react/jsx-tag-spacing': ['error', {
        closingSlash: 'never',
        beforeSelfClosing: 'always',
        afterOpening: 'never',
        beforeClosing: 'never',
      }],
      'max-len': ['error', {
        code: 100,
        tabWidth: 2,
        ignoreUrls: true,
        // ignoreStrings: true,
        ignoreTemplateLiterals: true,
        ignoreComments: false,
      }],
      'array-bracket-spacing': ['error', 'never'],
      'react/jsx-curly-spacing': ['error', 'never', { allowMultiline: true }],
      'space-in-parens': ['error', 'never'],
      'arrow-parens': ['error', 'always'],
       'react/prop-types': 'off',
    },

    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
  },
]);
