import { createI18n } from '@wxt-dev/i18n'

export const i18n = createI18n()

export const useI18n = () => {
  return {
    t: (key: string) => i18n.t(key),
    // Common shortcuts
    appName: () => i18n.t('appName'),
    extractingChannels: () => i18n.t('extractingChannels'),
    noChannelsFound: () => i18n.t('noChannelsFound'),
    extractData: () => i18n.t('extractData'),
    retry: () => i18n.t('retry'),
    fetchRSSData: () => i18n.t('fetchRSSData'),
    downloadOPML: () => i18n.t('downloadOPML'),
    copyAll: () => i18n.t('copyAll'),
    downloadAll: () => i18n.t('downloadAll'),
    refresh: () => i18n.t('refresh'),
    copy: () => i18n.t('copy'),
    copyRSS: () => i18n.t('copyRSS'),
  }
}

