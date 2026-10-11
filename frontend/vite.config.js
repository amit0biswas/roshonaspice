import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig(function (_a) {
    var _b;
    var mode = _a.mode;
    var env = loadEnv(mode, process.cwd(), "VITE_");
    if (mode === "production") {
        var apiUrl = (_b = env.VITE_API_URL) === null || _b === void 0 ? void 0 : _b.trim();
        if (!apiUrl) {
            throw new Error("VITE_API_URL must be set to the deployed HTTPS API origin before building for production.");
        }
        var parsedApiUrl = void 0;
        try {
            parsedApiUrl = new URL(apiUrl);
        }
        catch (_c) {
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
