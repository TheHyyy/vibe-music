// vite.config.ts
import { defineConfig } from "file:///Users/houyu/Desktop/my_project/echo-music/web/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/houyu/Desktop/my_project/echo-music/web/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import path from "path";
import Inspector from "file:///Users/houyu/Desktop/my_project/echo-music/web/node_modules/unplugin-vue-dev-locator/dist/vite.mjs";
import traeBadgePlugin from "file:///Users/houyu/Desktop/my_project/echo-music/web/node_modules/vite-plugin-trae-solo-badge/dist/vite-plugin.esm.js";
var __vite_injected_original_dirname = "/Users/houyu/Desktop/my_project/echo-music/web";
var vite_config_default = defineConfig({
  build: {
    sourcemap: "hidden",
    outDir: "../server/client_dist",
    emptyOutDir: true
  },
  plugins: [
    vue(),
    Inspector(),
    traeBadgePlugin({
      variant: "dark",
      position: "bottom-right",
      prodOnly: true,
      clickable: true,
      clickUrl: "https://www.trae.ai/solo?showJoin=1",
      autoTheme: true,
      autoThemeTarget: "#app"
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
      // ✅ 定义 @ = src
    }
  },
  server: {
    // 配上ip
    host: "0.0.0.0",
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      },
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvVXNlcnMvaG91eXUvRGVza3RvcC9teV9wcm9qZWN0L2VjaG8tbXVzaWMvd2ViXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMvaG91eXUvRGVza3RvcC9teV9wcm9qZWN0L2VjaG8tbXVzaWMvd2ViL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy9ob3V5dS9EZXNrdG9wL215X3Byb2plY3QvZWNoby1tdXNpYy93ZWIvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHZ1ZSBmcm9tIFwiQHZpdGVqcy9wbHVnaW4tdnVlXCI7XG5pbXBvcnQgcGF0aCBmcm9tIFwicGF0aFwiO1xuaW1wb3J0IEluc3BlY3RvciBmcm9tIFwidW5wbHVnaW4tdnVlLWRldi1sb2NhdG9yL3ZpdGVcIjtcbmltcG9ydCB0cmFlQmFkZ2VQbHVnaW4gZnJvbSBcInZpdGUtcGx1Z2luLXRyYWUtc29sby1iYWRnZVwiO1xuXG4vLyBodHRwczovL3ZpdGUuZGV2L2NvbmZpZy9cbmV4cG9ydCBkZWZhdWx0IGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgc291cmNlbWFwOiBcImhpZGRlblwiLFxuICAgIG91dERpcjogXCIuLi9zZXJ2ZXIvY2xpZW50X2Rpc3RcIixcbiAgICBlbXB0eU91dERpcjogdHJ1ZSxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHZ1ZSgpLFxuICAgIEluc3BlY3RvcigpLFxuICAgIHRyYWVCYWRnZVBsdWdpbih7XG4gICAgICB2YXJpYW50OiBcImRhcmtcIixcbiAgICAgIHBvc2l0aW9uOiBcImJvdHRvbS1yaWdodFwiLFxuICAgICAgcHJvZE9ubHk6IHRydWUsXG4gICAgICBjbGlja2FibGU6IHRydWUsXG4gICAgICBjbGlja1VybDogXCJodHRwczovL3d3dy50cmFlLmFpL3NvbG8/c2hvd0pvaW49MVwiLFxuICAgICAgYXV0b1RoZW1lOiB0cnVlLFxuICAgICAgYXV0b1RoZW1lVGFyZ2V0OiBcIiNhcHBcIixcbiAgICB9KSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIGFsaWFzOiB7XG4gICAgICBcIkBcIjogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgXCIuL3NyY1wiKSwgLy8gXHUyNzA1IFx1NUI5QVx1NEU0OSBAID0gc3JjXG4gICAgfSxcbiAgfSxcbiAgc2VydmVyOiB7XG4gICAgLy8gXHU5MTREXHU0RTBBaXBcbiAgICBob3N0OiBcIjAuMC4wLjBcIixcbiAgICBwcm94eToge1xuICAgICAgXCIvYXBpXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMVwiLFxuICAgICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICB9LFxuICAgICAgXCIvc29ja2V0LmlvXCI6IHtcbiAgICAgICAgdGFyZ2V0OiBcImh0dHA6Ly9sb2NhbGhvc3Q6MzAwMVwiLFxuICAgICAgICB3czogdHJ1ZSxcbiAgICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTRULFNBQVMsb0JBQW9CO0FBQ3pWLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsT0FBTyxlQUFlO0FBQ3RCLE9BQU8scUJBQXFCO0FBSjVCLElBQU0sbUNBQW1DO0FBT3pDLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLE9BQU87QUFBQSxJQUNMLFdBQVc7QUFBQSxJQUNYLFFBQVE7QUFBQSxJQUNSLGFBQWE7QUFBQSxFQUNmO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxJQUFJO0FBQUEsSUFDSixVQUFVO0FBQUEsSUFDVixnQkFBZ0I7QUFBQSxNQUNkLFNBQVM7QUFBQSxNQUNULFVBQVU7QUFBQSxNQUNWLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLFVBQVU7QUFBQSxNQUNWLFdBQVc7QUFBQSxNQUNYLGlCQUFpQjtBQUFBLElBQ25CLENBQUM7QUFBQSxFQUNIO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxPQUFPO0FBQUEsTUFDTCxLQUFLLEtBQUssUUFBUSxrQ0FBVyxPQUFPO0FBQUE7QUFBQSxJQUN0QztBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQTtBQUFBLElBRU4sTUFBTTtBQUFBLElBQ04sT0FBTztBQUFBLE1BQ0wsUUFBUTtBQUFBLFFBQ04sUUFBUTtBQUFBLFFBQ1IsY0FBYztBQUFBLE1BQ2hCO0FBQUEsTUFDQSxjQUFjO0FBQUEsUUFDWixRQUFRO0FBQUEsUUFDUixJQUFJO0FBQUEsUUFDSixjQUFjO0FBQUEsTUFDaEI7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
