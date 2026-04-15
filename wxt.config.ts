import { defineConfig } from 'wxt';

// See https://wxt.dev/api/config.html
export default defineConfig({
  modules: ['@wxt-dev/module-vue', '@wxt-dev/auto-icons', '@wxt-dev/i18n/module'],
  autoIcons: {
    baseIconPath: 'public/icon.svg',
    sizes: [16, 32, 48, 128],
  },
  i18n: {
    localesDir: './locales',
  },
  manifest: {
    name: '__MSG_extName__',
    description: '__MSG_extDescription__',
    default_locale: 'en',
    permissions: ['tabs', 'scripting', 'storage', 'cookies', 'https://aitubestats.com/*'],
    host_permissions: [
      'https://www.youtube.com/@*',
      'https://www.youtube.com/c/*',
      'https://www.youtube.com/channel/*',
      'https://www.youtube.com/feed/channels*',
      'https://aitubestats.com/*',
    ],
  },
});

