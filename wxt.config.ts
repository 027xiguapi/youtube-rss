import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue', '@wxt-dev/auto-icons'],
  autoIcons: {
    baseIconPath: 'public/icon.svg',
    sizes: [16, 32, 48, 128],
  },
  manifest: {
    permissions: ['tabs', 'scripting'],
    host_permissions: [
      'https://www.youtube.com/@*',
      'https://www.youtube.com/c/*',
      'https://www.youtube.com/channel/*',
      'https://www.youtube.com/feed/channels*',
    ],
  },
});
