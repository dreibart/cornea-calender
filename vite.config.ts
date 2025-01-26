import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import { vitePluginTrpcWebSocket } from 'trpc-sveltekit/websocket';

export default defineConfig({
	plugins: [sveltekit(),vitePluginTrpcWebSocket]
});
