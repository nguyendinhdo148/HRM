import { defineConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({ 
  base: "/",
  plugins: [
    tailwindcss(), 
    reactRouter(), // Trả lại em nó về nguyên vẹn 0 tham số
    tsconfigPaths()
  ],
  build: {
    outDir: "build/client",
    sourcemap: false,
    copyPublicDir: true,
  },
});