/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				// Luxury Watch Brand Colors
				'luxury': {
					'dark': '#0f0f0f',      // Very dark black
					'darker': '#1a1a1a',    // Card background
					'border': '#3d3d2d',    // Gold brown border
					'gold': '#d4af37',      // Premium gold
					'gold-light': '#e8c547', // Light gold (hover)
					'text-light': '#e8e8e8', // Light text
					'text-muted': '#8b8b8b', // Muted gray
					'accent': '#2e5f4a',    // Emerald accent
				}
			},
			fontFamily: {
				'luxury': ['Playfair Display', 'Georgia', 'serif'],
				'sans': ['Poppins', 'Segoe UI', 'sans-serif'],
			},
			fontSize: {
				'display': ['3rem', { lineHeight: '1.1', fontWeight: '700', letterSpacing: '-0.025em' }],
				'display-sm': ['2.25rem', { lineHeight: '1.15', fontWeight: '700' }],
				'heading': ['1.875rem', { lineHeight: '1.2', fontWeight: '600' }],
				'subheading': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
			},
			letterSpacing: {
				'luxury': '0.15em',
				'wider-luxury': '0.2em',
			},
			spacing: {
				'section': '5rem',
			},
			backdropBlur: {
				'xs': '2px',
			}
		},
	},
	plugins: [],
};
