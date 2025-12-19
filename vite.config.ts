import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
    plugins: [
        vue(),
        dts({
            insertTypesEntry: true,
            include: ['src/**/*.ts', 'src/**/*.vue'],
            exclude: ['src/**/*.test.ts']
        })
    ],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'VueNudge',
            fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`
        },
        rollupOptions: {
            external: ['vue'],
            output: {
                globals: {
                    environment: 'jsdom',
                    vue: 'Vue'
                },
                assetFileNames: 'vue-nudge.css'
            }
        }
    }
})