import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import macrosPlugin from "vite-plugin-babel-macros";

import path from "path";

// Custom plugin để bỏ type="module" khỏi script tags trong HTML output
const removeModulePlugin = () => {
    return {
        name: 'remove-module-type',
        transformIndexHtml(html) {
            // Bỏ type="module" và crossorigin attributes
            return html
                .replace(/type="module"\s*/g, '')
                .replace(/crossorigin\s*/g, '');
        }
    };
};

// https://vitejs.dev/config/
// Fix cho lỗi import.meta trên Zalo Mini App
export default () => {
    return defineConfig({
        root: "./src",
        base: "./",
        plugins: [
            react(),
            macrosPlugin(),
            removeModulePlugin() // Plugin để bỏ type="module"
        ],
        build: {
            target: "es2015",
            outDir: "../dist",
            modulePreload: false, // Tắt module preload
            rollupOptions: {
                output: {
                    format: "iife", // IIFE format thay vì ESM hoặc CJS
                    inlineDynamicImports: true,
                    entryFileNames: 'assets/[name]-[hash].js',
                },
            },
            assetsInlineLimit: 100000,
        },
        resolve: {
            alias: {
                "@assets": path.resolve(__dirname, "src/assets"),
                "@components": path.resolve(__dirname, "src/components"),
                "@common": path.resolve(__dirname, "src/common"),
                "@constants": path.resolve(__dirname, "src/constants"),
                "@routes": path.resolve(__dirname, "src/routes"),
                "@shared": path.resolve(__dirname, "src/shared"),
                "@utils": path.resolve(__dirname, "src/utils"),
                "@pages": path.resolve(__dirname, "src/pages"),
                "@dts": path.resolve(__dirname, "src/types"),
                "@state": path.resolve(__dirname, "src/state"),
                "@service": path.resolve(__dirname, "src/service"),
                "@store": path.resolve(__dirname, "src/store"),
                "@mock": path.resolve(__dirname, "src/mock"),
            },
        },
    });
};
