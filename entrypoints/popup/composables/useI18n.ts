import { createI18n } from '@wxt-dev/i18n'
import en from '../../../locales/en.json'

export const i18n = createI18n()

const fallbackMessages: Record<string, string> = {}
for (const [key, value] of Object.entries(en)) {
  if (typeof value === 'object' && value !== null && 'message' in value) {
    fallbackMessages[key] = (value as { message: string }).message
  }
}

export const useI18n = () => {
  const t = (key: string, ...args: (number | string[] | undefined)[]) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const message = (i18n.t as any)(key, ...args)
    if (message) return message
    return fallbackMessages[key] || key
  }
  return {
    t,
    // Common shortcuts
    appName: () => t('appName'),
    extractingChannels: () => t('extractingChannels'),
    noChannelsFound: () => t('noChannelsFound'),
    extractData: () => t('extractData'),
    retry: () => t('retry'),
    fetchRSSData: () => t('fetchRSSData'),
    downloadOPML: () => t('downloadOPML'),
    copyAll: () => t('copyAll'),
    downloadAll: () => t('downloadAll'),
    refresh: () => t('refresh'),
    copy: () => t('copy'),
    copyRSS: () => t('copyRSS'),
  }
}
