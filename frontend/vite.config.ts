import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "VITE_");
  if (mode === "production") {
    const apiUrl = env.VITE_API_URL?.trim();
    if (!apiUrl) {
      throw new Error("VITE_API_URL must be set to the deployed HTTPS API origin before building for production.");
    }
    let parsedApiUrl: URL;
    try {
      parsedApiUrl = new URL(apiUrl);
    } catch {
      throw new Error("VITE_API_URL must be a valid HTTPS API origin, such as https://roshona-api.onrender.com.");
    }
    if (parsedApiUrl.protocol !== "https:" || parsedApiUrl.origin !== apiUrl.replace(/\/$/, "")) {
      throw new Error("VITE_API_URL must contain only the HTTPS API origin, with no path, query, or fragment.");
    }
  }

  return {
    plugins: [react()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: { "/api": { target: "http://localhost:4000", changeOrigin: true } }
    },
    build: { sourcemap: false }
  };
});
