import { defineConfig } from "vite";
import glsl from 'vite-plugin-glsl'

export default defineConfig({
    root: './src',
    server: {
        host: true,
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
    },
    build: {
        outDir: '../dist',
    },
    plugins: [glsl()]
});