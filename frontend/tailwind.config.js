/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	darkMode: 'class',
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
				}
			},
			fontFamily: {
				'luxury': ['var(--font-sans)'],
				'sans': ['var(--font-sans)'],
			},
			fontSize: {
				'xs': ['0.8125rem', { lineHeight: '1.35rem' }], // 13px (was 12px)
				'sm': ['0.9375rem', { lineHeight: '1.5rem' }], // 15px (was 14px)
				'base': ['1.0625rem', { lineHeight: '1.65rem' }], // 17px (was 16px)
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
				'section': '3.5rem',
			},
			backdropBlur: {
				'xs': '2px',
			}
		},
	},
	plugins: [],
};
