<script lang="ts" setup>
import { onMounted } from 'vue'
import ChannelsList from './components/ChannelsList.vue'
import { copyToClipboard, downloadJSON } from './composables/useUtils'
import { useChannelStore } from './stores/channelStore'
import { useI18n } from './composables/useI18n'

const store = useChannelStore()
const { t } = useI18n()
const { channelsData, loading, error } = store

const extractData = async () => {
  store.setLoading(true)
  store.clearError()

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab found')

    const isFeed = tab.url?.includes('youtube.com/feed/channels') || false
    const youtubeChannelRegex = /^https?:\/\/(www\.)?youtube\.com\/(@|c\/|channel\/)[a-zA-Z0-9_-]+$/i

    if (isFeed) {
      await extractChannelsRss(tab)
    } else if (tab.url && youtubeChannelRegex.test(tab.url)) {
      await extractChannelData(tab)
    } else {
      await getChannelsRss(tab)
    }
  } catch (e) {
    store.setError(e instanceof Error ? e.message : t('failedToExtractData'))
    console.error('Error:', e)
  } finally {
    store.setLoading(false)
  }
}

const getChannelsRss = async (tab: any) => {
  const response = await browser.tabs.sendMessage(tab.id, { action: 'getChannelsRss' })
  if (response && response.channels) {
    store.setChannelsData(response.channels || [])
  }
  if (channelsData.length === 0) {
    store.setError(t('noChannelsFound'))
  } else {
    await store.saveCachedData()
  }
}

const extractChannelsRss = async (tab: any) => {
  const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelsRss' })
  if (response && response.channels) {
    store.setChannelsData(response.channels || [])
  }
  if (channelsData.length === 0) {
    store.setError(t('noChannelsFound'))
  } else {
    await store.saveCachedData()
  }
}

const extractChannelData = async (tab: any) => {
  const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelData' })
  if (response) {
    store.setChannelsData([response])
  }
}

const handleCopyAll = () => copyToClipboard(channelsData)
const handleDownloadAll = () => downloadJSON(channelsData, 'channels.json')

const escapeXML = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const downloadOPML = () => {
  if (channelsData.length === 0) {
    store.setError(t('noChannelsDataToExport'))
    return
  }

  const opmlText = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
\t<head>
\t\t<title>${t('youtubeSubscriptionsRSS')}</title>
\t\t<dateCreated>${new Date().toISOString()}</dateCreated>
\t</head>
\t<body>
\t\t<outline text="${t('youtubeSubscriptions')}">${channelsData
          .filter((channel) => channel.rssUrl)
          .map(
            (channel) =>
              `\n\t\t\t<outline type="rss" text="${escapeXML(channel.title || '')}" title="${escapeXML(
                channel.title || ''
              )}" xmlUrl="${channel.rssUrl}"/>`
          )
          .join('')}
\t\t</outline>
\t</body>
</opml>`

  const blob = new Blob([opmlText], { type: 'text/xml' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'youtube_subs.opml'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

const fetchRSSData = async () => {
  await store.clearCache()
  await extractData()
}

onMounted(async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    const isFeed = tab.url?.includes('youtube.com/feed/channels') || false

    if (isFeed) {
      await store.loadCachedData()
    } else {
      await extractChannelData(tab)
    }
  } catch (e) {
    console.error('Error in onMounted:', e)
  }
})
</script>

<template>
  <div class="container">
    <h1>{{ t('appName') }}({{ channelsData.length || 0 }})</h1>

    <div v-if="loading" class="status">
      <p>{{ t('extractingChannels') }}</p>
    </div>

    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <button @click="extractData">{{ t('retry') }}</button>
    </div>

    <ChannelsList
      v-else-if="channelsData.length > 0"
      :channels="channelsData"
      @refresh="extractData"
      @copy="handleCopyAll"
      @download="handleDownloadAll"
    />

    <div v-if="channelsData.length > 0" class="button-group">
      <button @click="fetchRSSData" class="btn-primary">{{ t('fetchRSSData') }}</button>
      <button @click="downloadOPML" class="btn-primary">{{ t('downloadOPML') }}</button>
    </div>

    <div v-else class="status">
      <p>{{ t('noChannelsData') }}</p>
      <button @click="extractData">{{ t('extractData') }}</button>
    </div>
  </div>
</template>

<style scoped>
.container {
  width: 500px;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #fff;
}

h1 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: #030303;
}

.status {
  padding: 20px;
  text-align: center;
  color: #666;
}

.error {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 4px;
  color: #c33;
}

.error button {
  margin-top: 12px;
  padding: 8px 16px;
  background: #c33;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.status button {
  margin-top: 12px;
  padding: 8px 16px;
  background: #065fd4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.button-group {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  justify-content: center;
}

.btn-primary {
  padding: 8px 16px;
  background: #065fd4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  flex: 1;
}

.btn-primary:hover {
  background: #0551b8;
}

.btn-primary:active {
  background: #043d8a;
}
</style>
