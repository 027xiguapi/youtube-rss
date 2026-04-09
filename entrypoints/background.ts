import { onMessage } from '~/utils/messaging';

export default defineBackground(() => {
  console.log('YouTube RSS Extractor background script loaded')

  // Message handlers can be registered here if needed
  // The content script will handle extractChannelData directly
})
