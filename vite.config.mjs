import { defineConfig } from "vite";

export default defineConfig({
    root: './src',
    server: {
        host: true,
        open: !('SANDBOX_URL' in process.env || 'CODESANDBOX_HOST' in process.env)
    }
});