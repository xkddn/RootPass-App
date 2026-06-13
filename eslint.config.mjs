import eslint from '@electron-toolkit/eslint-config'
import eslintConfigPrettier from '@electron-toolkit/eslint-config-prettier'
import eslintPluginReact from 'eslint-plugin-react'
import eslintPluginReactHooks from 'eslint-plugin-react-hooks'
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['**/node_modules', '**/dist', '**/out'] },
  eslint,
  eslintPluginReact.configs.flat.recommended,
  eslintPluginReact.configs.flat['jsx-runtime'],
  {
    settings: {
      react: {
        version: 'detect'
      }
    }
  },
  {
    files: ['**/*.{js,jsx}'],
    plugins: {
      'react-hooks': eslintPluginReactHooks,
      'react-refresh': eslintPluginReactRefresh
    },
    rules: {
      ...eslintPluginReactHooks.configs.recommended.rules,
      ...eslintPluginReactRefresh.configs.vite.rules
    }
  },
  {
    files: ['extension/**/*.js'],
    languageOptions: {
      globals: {
        chrome: 'readonly',
        browser: 'readonly',
        window: 'readonly',
        document: 'readonly',
        crypto: 'readonly',
        navigator: 'readonly',
        WebSocket: 'readonly',
        TextEncoder: 'readonly',
        MutationObserver: 'readonly',
        getComputedStyle: 'readonly',
        location: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Event: 'readonly',
        KeyboardEvent: 'readonly',
        Node: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        URL: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        t: 'readonly',
        rpSetLocale: 'readonly',
        rpInitI18n: 'readonly'
      }
    }
  },
  eslintConfigPrettier
]
