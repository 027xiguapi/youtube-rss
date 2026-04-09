import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue'],
  manifest: {
    permissions: ['tabs', 'scripting'],
    host_permissions: [
      'https://www.youtube.com/@*',
      'https://www.youtube.com/c/*',
      'https://www.youtube.com/channel/*',
    ],
  },
});
