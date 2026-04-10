<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { storage } from '@wxt-dev/storage'
import ChannelsList from './components/ChannelsList.vue'
import { copyToClipboard, downloadJSON } from './composables/useUtils'
import type { ChannelData } from './composables/types'

const loading = ref(false)
const channelsData = ref<ChannelData[]>([])
const error = ref('')
const isFeedPage = ref(false)

const CACHE_KEY = 'local:channelsData'

const loadCachedData = async () => {
  try {
    const cached = await storage.getItem(CACHE_KEY) as ChannelData[] | null
    if (cached) {
      channelsData.value = cached
      return true
    }
  } catch (e) {
    console.error('Error loading cached data:', e)
  }
  return false
}

const saveCachedData = async () => {
  try {
    await storage.setItem(CACHE_KEY, channelsData.value)
  } catch (e) {
    console.error('Error saving cached data:', e)
  }
}

const extractData = async () => {
  loading.value = true
  error.value = ''

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab found')

    const isFeed = tab.url?.includes('youtube.com/feed/channels') || false
    isFeedPage.value = isFeed || false

    // Try to load from cache first (only for feed page)
    if (isFeed) {
      const hasCached = await loadCachedData()
      if (hasCached) {
        loading.value = false
        return
      }
    }

    // If no cache, fetch fresh data
    if (isFeed) {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelsRss' })
      if (response && response.channels) {
        channelsData.value = response.channels || []
      }
      if (channelsData.value.length === 0) {
        error.value = 'No channels found on this page'
      } else {
        await saveCachedData()
      }
    } else {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelData' })
      if (response) {
        channelsData.value = [response]
      }
      console.log('Extracted channel data from content script:', response, channelsData.value)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to extract data'
    console.error('Error:', e)
  } finally {
    loading.value = false
  }
}

const handleCopyAll = () => copyToClipboard(channelsData.value)
const handleDownloadAll = () => downloadJSON(channelsData.value, 'channels.json')

const escapeXML = (str: string) => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

const downloadOPML = () => {
  if (channelsData.value.length === 0) {
    error.value = 'No channels data to export'
    return
  }

  const opmlText = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
\t<head>
\t\t<title>YouTube Subscriptions as RSS</title>
\t\t<dateCreated>${new Date().toISOString()}</dateCreated>
\t</head>
\t<body>
\t\t<outline text="YouTube Subscriptions">${channelsData.value
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
  await clearCache()
}

const clearCache = async () => {
  try {
    await storage.removeItem(CACHE_KEY)
    channelsData.value = []
    error.value = ''
    await extractData()
  } catch (e) {
    console.error('Error clearing cache:', e)
  }
}

onMounted(async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) return

    const response = await browser.tabs.sendMessage(tab.id, { action: 'getChannelId' })
    if (response?.externalId) {
      const cachedChannels = (await storage.getItem(CACHE_KEY)) as ChannelData[] | null
      if (cachedChannels) {
        const found = cachedChannels.filter((ch) => ch.externalId === response.externalId)
        channelsData.value = found
      }
    }
  } catch (e) {
    console.error('Error in onMounted:', e)
  }
})
</script>

<template>
  <div class="container">
    <h1>YouTube RSS Extractor</h1>

    <div v-if="loading" class="status">
      <p>Extracting channels data...</p>
    </div>

    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <button @click="extractData">Retry</button>
    </div>

    <ChannelsList
      v-else-if="channelsData.length > 0"
      :channels="channelsData"
      @refresh="extractData"
      @copy="handleCopyAll"
      @download="handleDownloadAll"
    />

    <div v-if="channelsData.length > 0" class="button-group">
      <button @click="fetchRSSData" class="btn-primary">Fetch RSS Data</button>
      <button @click="downloadOPML" class="btn-primary">Download OPML</button>
    </div>

    <div v-else class="status">
      <p>No channels data extracted yet</p>
      <button @click="extractData">Extract Data</button>
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
