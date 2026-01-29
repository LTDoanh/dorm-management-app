import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import macrosPlugin from "vite-plugin-babel-macros";
import replace from '@rollup/plugin-replace';

import path from "path";
import fs from 'fs';

// Custom plugin để bỏ type="module" khỏi script tags và di chuyển script xuống cuối body
// (don't remove it before bundling, to allow Vite to detect and bundle the entry)
const removeModuleFromDist = () => {
    let outDirResolved = 'www';
    return {
        name: 'remove-module-type-in-dist',
        apply: 'build',
        configResolved(config) {
            outDirResolved = config.build.outDir || outDirResolved;
        },
        writeBundle() {
            // This runs after the build has written files to disk.
            // We edit the generated index.html in the outDir to:
            // 1. Remove type="module" and crossorigin attributes
            // 2. Move script tag from head to end of body (before </body>)
            // 3. Add defer attribute to ensure DOM is ready
            const indexPath = path.resolve(process.cwd(), outDirResolved, 'index.html');
            try {
                if (fs.existsSync(indexPath)) {
                    let html = fs.readFileSync(indexPath, 'utf8');
                    
                    // Remove type="module" and crossorigin
                    html = html.replace(/type=\"module\"\s*/g, '').replace(/crossorigin\s*/g, '');
                    
                    // Extract script tag from head and move to end of body
                    const scriptMatch = html.match(/<script\s+src="([^"]+)"[^>]*><\/script>/);
                    if (scriptMatch) {
                        const scriptSrc = scriptMatch[1];
                        // Remove script from head
                        html = html.replace(scriptMatch[0], '');
                        // Add script with defer at end of body
                        html = html.replace('</body>', `  <script defer src="${scriptSrc}"></script>\n</body>`);
                    }
                    
                    fs.writeFileSync(indexPath, html, 'utf8');
                }
            } catch (e) {
                // Non-fatal: log so developer can see why post-processing failed
                // Vite will still produce the bundle even if this step fails
                // eslint-disable-next-line no-console
                console.error('remove-module-type-in-dist failed:', e && e.message ? e.message : e);
            }
        }
    };
};

// https://vitejs.dev/config/
// Fix cho lỗi import.meta trên Zalo Mini App
export default () => {
    return defineConfig({
        // Vite sẽ tìm index.html ở project root thay vì trong src
        root: ".",
        base: "./",
        plugins: [
            react(),
            macrosPlugin(),
            replace({
                preventAssignment: true,
                'import.meta.url': '""'
            }),
            removeModuleFromDist() // Plugin strips type="module" only in final output
        ],
        build: {
            target: "es2015",
            // Xuất thẳng ra thư mục www để deploy lên Zalo Mini App
            outDir: "www",
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
