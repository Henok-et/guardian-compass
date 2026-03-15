import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger"; // comment if error

export default defineConfig(({ mode }) => ({
	server: {
		host: "localhost",
		port: 5173,
		strictPort: true,
		hmr: {
			overlay: true,
		},
		proxy: {
			// Proxy all requests starting with /api to backend on port 5000
			"/api": {
				target: "http://localhost:5000",
				changeOrigin: true,
				secure: false,
				// rewrite: (path) => path.replace(/^\/api/, '/api') // keep /api if backend expects it
			},
		},
	},

	optimizeDeps: {
		exclude: ['zod'], // Force Vite to bypass pre-bundling for zod to fix instanceof ZodError checks
	},

	plugins: [react(), mode === "development" && componentTagger()].filter(
		Boolean,
	),

	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},

	base: mode === "production" ? "/" : "/",
}));
