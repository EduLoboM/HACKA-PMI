import { defineConfig, presetIcons, presetTypography, presetUno } from 'unocss';
import extractorSvelte from '@unocss/extractor-svelte';

export default defineConfig({
	extractors: [extractorSvelte()],
	presets: [
		presetUno(),
		presetIcons({
			scale: 1.2,
			extraProperties: {
				display: 'inline-block',
				'vertical-align': 'middle'
			}
		}),
		presetTypography()
	],
	theme: {
		fontFamily: {
			sans: "'Plus Jakarta Sans', 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif",
			mono: "'JetBrains Mono', 'Consolas', monospace"
		},
		colors: {
			eco: {
				50: '#f0fdf4',
				100: '#dcfce7',
				200: '#bbf7d0',
				300: '#86efac',
				400: '#4ade80',
				500: '#10b981',
				600: '#059669',
				700: '#047857',
				800: '#065f46',
				900: '#064e3b',
				lime: '#84cc16'
			},
			aero: {
				50: '#f0f9ff',
				100: '#e0f2fe',
				200: '#bae6fd',
				300: '#7dd3fc',
				400: '#38bdf8',
				500: '#0ea5e9',
				600: '#0284c7',
				700: '#0369a1'
			}
		}
	},
	shortcuts: {
		'neo-glass':
			'bg-white/85 backdrop-blur-xl border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.03),inset_0_1px_0_0_rgba(255,255,255,0.95)]',
		'neo-glass-card':
			'bg-white/80 backdrop-blur-md border border-slate-200/70 shadow-[0_4px_16px_rgb(15,23,42,0.03),inset_0_1px_0_0_rgba(255,255,255,0.9)]',
		'neo-glass-subtle':
			'bg-slate-50/60 backdrop-blur-sm border border-slate-200/50'
	}
});

