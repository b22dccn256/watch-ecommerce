import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
	persist(
		(set) => ({
			theme: window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light",
			toggleTheme: () =>
				set((state) => ({
					theme: state.theme === "dark" ? "light" : "dark",
				})),
			setTheme: (theme) => set({ theme }),
		}),
		{
			name: "theme-storage",
		}
	)
);

// Sync across tabs
window.addEventListener("storage", (event) => {
	if (event.key === "theme-storage") {
		const newTheme = JSON.parse(event.newValue).state.theme;
		useThemeStore.getState().setTheme(newTheme);
	}
});
