import { resolve } from 'path'
import { readFileSync } from 'fs'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'

// Version lue depuis package.json pour l'afficher dans l'UI (footer copyright).
const { version } = JSON.parse(readFileSync(resolve('package.json'), 'utf-8'))

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    define: {
      __APP_VERSION__: JSON.stringify(version)
    },
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react()]
  }
})
