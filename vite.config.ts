import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'
import { libInjectCss } from 'vite-plugin-lib-inject-css'

export default defineConfig({
    plugins: [
        vue(),
        libInjectCss(),
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
                }
            }
        },
        cssCodeSplit: false
    }
})