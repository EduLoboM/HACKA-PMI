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
	]
});

