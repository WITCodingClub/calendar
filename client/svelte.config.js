import adapter from '@cattn/adapter-extension';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		appDir: 'scripts',
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'extension',
			assets: 'extension',
			fallback: 'index.html',
			precompress: false,
			strict: false
		}),
		output: {
			bundleStrategy: 'single'
		}
	},
};

export default config;
