import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	server: {
		proxy: {
			"/api": {
				target: "http://localhost:5000",
			},
		},
	},
	build: {
		chunkSizeWarningLimit: 1500, // Increase limit to reduce noisy warnings
		rollupOptions: {
			output: {
				manualChunks: {
					// Vendor libraries - React ecosystem
					'vendor-react': ['react', 'react-dom', 'react-router-dom'],
					
					// Vendor libraries - UI & Animation
					'vendor-ui': ['framer-motion', 'lucide-react', 'zustand', 'axios'],
					
					// Stores - separate chunk since imported everywhere
					'stores': [
						'./src/stores/useProductStore.js',
						'./src/stores/useUserStore.js',
						'./src/stores/useCartStore.js',
						'./src/stores/useErrorStore.js',
						'./src/stores/useModalStore.js',
					],
					
					// Common utilities
					'utils': [
						'./src/lib/errorHandler.js',
						'./src/lib/axios.js',
					],
					
					// Hooks - commonly imported utilities
					'hooks': [
						'./src/hooks/useApiFetch.js',
						'./src/hooks/useErrorHandler.js',
						'./src/hooks/useProductsSearch.js',
						'./src/hooks/useProductsBulkSelect.js',
						'./src/hooks/useProductsList.js',
						'./src/hooks/useProductsModal.js',
						'./src/hooks/useUsersData.js',
						'./src/hooks/useAuditLogs.js',
						'./src/hooks/useUsersModal.js',
					],
				},
			},
		},
	},
});
