import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  root: 'site',
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'site/index.html'),
        '404': resolve(__dirname, 'site/404.html'),
        'balance-brewing': resolve(__dirname, 'site/work/balance-brewing.html'),
        'battle-of-britain': resolve(__dirname, 'site/work/battle-of-britain.html'),
        'byodoin-phoenix-hall': resolve(__dirname, 'site/work/byodoin-phoenix-hall.html'),
        'corvette-midnight-run': resolve(__dirname, 'site/work/corvette-midnight-run.html'),
        'medieval-wagon': resolve(__dirname, 'site/work/medieval-wagon.html'),
        'nora': resolve(__dirname, 'site/work/nora.html'),
      }
    }
  }
})
