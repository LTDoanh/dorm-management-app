// vite.config.mjs
import { defineConfig } from "file:///D:/Zalo%20Mini%20App/dorm-management-app/node_modules/vite/dist/node/index.js";
import zmpVitePlugin from "file:///D:/Zalo%20Mini%20App/dorm-management-app/node_modules/zmp-vite-plugin/dist/index.mjs";
import react from "file:///D:/Zalo%20Mini%20App/dorm-management-app/node_modules/@vitejs/plugin-react/dist/index.js";
import macrosPlugin from "file:///D:/Zalo%20Mini%20App/dorm-management-app/node_modules/vite-plugin-babel-macros/dist/plugin.js";
import path from "path";
var __vite_injected_original_dirname = "D:\\Zalo Mini App\\dorm-management-app";
var vite_config_default = () => {
  return defineConfig({
    root: ".",
    plugins: [
      react(),
      macrosPlugin(),
      zmpVitePlugin()
    ],
    resolve: {
      alias: {
        "@assets": path.resolve(__vite_injected_original_dirname, "src/assets"),
        "@components": path.resolve(__vite_injected_original_dirname, "src/components"),
        "@common": path.resolve(__vite_injected_original_dirname, "src/common"),
        "@constants": path.resolve(__vite_injected_original_dirname, "src/constants"),
        "@routes": path.resolve(__vite_injected_original_dirname, "src/routes"),
        "@shared": path.resolve(__vite_injected_original_dirname, "src/shared"),
        "@utils": path.resolve(__vite_injected_original_dirname, "src/utils"),
        "@pages": path.resolve(__vite_injected_original_dirname, "src/pages"),
        "@dts": path.resolve(__vite_injected_original_dirname, "src/types"),
        "@state": path.resolve(__vite_injected_original_dirname, "src/state"),
        "@service": path.resolve(__vite_injected_original_dirname, "src/service"),
        "@store": path.resolve(__vite_injected_original_dirname, "src/store"),
        "@mock": path.resolve(__vite_injected_original_dirname, "src/mock")
      }
    }
  });
};
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiRDpcXFxcWmFsbyBNaW5pIEFwcFxcXFxkb3JtLW1hbmFnZW1lbnQtYXBwXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCJEOlxcXFxaYWxvIE1pbmkgQXBwXFxcXGRvcm0tbWFuYWdlbWVudC1hcHBcXFxcdml0ZS5jb25maWcubWpzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9EOi9aYWxvJTIwTWluaSUyMEFwcC9kb3JtLW1hbmFnZW1lbnQtYXBwL3ZpdGUuY29uZmlnLm1qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gXCJ2aXRlXCI7XHJcbmltcG9ydCB6bXBWaXRlUGx1Z2luIGZyb20gXCJ6bXAtdml0ZS1wbHVnaW5cIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdFwiO1xyXG5pbXBvcnQgbWFjcm9zUGx1Z2luIGZyb20gXCJ2aXRlLXBsdWdpbi1iYWJlbC1tYWNyb3NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcInBhdGhcIjtcclxuXHJcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXHJcbmV4cG9ydCBkZWZhdWx0ICgpID0+IHtcclxuICAgIHJldHVybiBkZWZpbmVDb25maWcoe1xyXG4gICAgICAgIHJvb3Q6IFwiLlwiLFxyXG4gICAgICAgIHBsdWdpbnM6IFtcclxuICAgICAgICAgICAgcmVhY3QoKSxcclxuICAgICAgICAgICAgbWFjcm9zUGx1Z2luKCksXHJcbiAgICAgICAgICAgIHptcFZpdGVQbHVnaW4oKSxcclxuICAgICAgICBdLFxyXG4gICAgICAgIHJlc29sdmU6IHtcclxuICAgICAgICAgICAgYWxpYXM6IHtcclxuICAgICAgICAgICAgICAgIFwiQGFzc2V0c1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9hc3NldHNcIiksXHJcbiAgICAgICAgICAgICAgICBcIkBjb21wb25lbnRzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL2NvbXBvbmVudHNcIiksXHJcbiAgICAgICAgICAgICAgICBcIkBjb21tb25cIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvY29tbW9uXCIpLFxyXG4gICAgICAgICAgICAgICAgXCJAY29uc3RhbnRzXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL2NvbnN0YW50c1wiKSxcclxuICAgICAgICAgICAgICAgIFwiQHJvdXRlc1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9yb3V0ZXNcIiksXHJcbiAgICAgICAgICAgICAgICBcIkBzaGFyZWRcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvc2hhcmVkXCIpLFxyXG4gICAgICAgICAgICAgICAgXCJAdXRpbHNcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvdXRpbHNcIiksXHJcbiAgICAgICAgICAgICAgICBcIkBwYWdlc1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9wYWdlc1wiKSxcclxuICAgICAgICAgICAgICAgIFwiQGR0c1wiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy90eXBlc1wiKSxcclxuICAgICAgICAgICAgICAgIFwiQHN0YXRlXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL3N0YXRlXCIpLFxyXG4gICAgICAgICAgICAgICAgXCJAc2VydmljZVwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcInNyYy9zZXJ2aWNlXCIpLFxyXG4gICAgICAgICAgICAgICAgXCJAc3RvcmVcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCJzcmMvc3RvcmVcIiksXHJcbiAgICAgICAgICAgICAgICBcIkBtb2NrXCI6IHBhdGgucmVzb2x2ZShfX2Rpcm5hbWUsIFwic3JjL21vY2tcIiksXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgfSxcclxuICAgIH0pO1xyXG59O1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTBTLFNBQVMsb0JBQW9CO0FBQ3ZVLE9BQU8sbUJBQW1CO0FBQzFCLE9BQU8sV0FBVztBQUNsQixPQUFPLGtCQUFrQjtBQUN6QixPQUFPLFVBQVU7QUFKakIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxNQUFNO0FBQ2pCLFNBQU8sYUFBYTtBQUFBLElBQ2hCLE1BQU07QUFBQSxJQUNOLFNBQVM7QUFBQSxNQUNMLE1BQU07QUFBQSxNQUNOLGFBQWE7QUFBQSxNQUNiLGNBQWM7QUFBQSxJQUNsQjtBQUFBLElBQ0EsU0FBUztBQUFBLE1BQ0wsT0FBTztBQUFBLFFBQ0gsV0FBVyxLQUFLLFFBQVEsa0NBQVcsWUFBWTtBQUFBLFFBQy9DLGVBQWUsS0FBSyxRQUFRLGtDQUFXLGdCQUFnQjtBQUFBLFFBQ3ZELFdBQVcsS0FBSyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUMvQyxjQUFjLEtBQUssUUFBUSxrQ0FBVyxlQUFlO0FBQUEsUUFDckQsV0FBVyxLQUFLLFFBQVEsa0NBQVcsWUFBWTtBQUFBLFFBQy9DLFdBQVcsS0FBSyxRQUFRLGtDQUFXLFlBQVk7QUFBQSxRQUMvQyxVQUFVLEtBQUssUUFBUSxrQ0FBVyxXQUFXO0FBQUEsUUFDN0MsVUFBVSxLQUFLLFFBQVEsa0NBQVcsV0FBVztBQUFBLFFBQzdDLFFBQVEsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxRQUMzQyxVQUFVLEtBQUssUUFBUSxrQ0FBVyxXQUFXO0FBQUEsUUFDN0MsWUFBWSxLQUFLLFFBQVEsa0NBQVcsYUFBYTtBQUFBLFFBQ2pELFVBQVUsS0FBSyxRQUFRLGtDQUFXLFdBQVc7QUFBQSxRQUM3QyxTQUFTLEtBQUssUUFBUSxrQ0FBVyxVQUFVO0FBQUEsTUFDL0M7QUFBQSxJQUNKO0FBQUEsRUFDSixDQUFDO0FBQ0w7IiwKICAibmFtZXMiOiBbXQp9Cg==
