import { defineExtensionMessaging } from '@webext-core/messaging';

interface ProtocolMap {
  extractChannelData(): Promise<Record<string, any>>;
}

export const { sendMessage, onMessage } = defineExtensionMessaging<ProtocolMap>();
