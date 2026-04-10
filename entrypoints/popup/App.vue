<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { storage } from '@wxt-dev/storage'
import ChannelDetail from './components/ChannelDetail.vue'
import ChannelsList from './components/ChannelsList.vue'
import { copyToClipboard, downloadJSON } from './composables/useUtils'
import type { ChannelData } from './composables/types'

const loading = ref(false)
const channelData = ref<ChannelData | null>(null)
const channelsData = ref<ChannelData[]>([])
const error = ref('')
const isFeedPage = ref(false)

const CACHE_KEYS = {
  channelData: 'local:channelData',
  channelsData: 'local:channelsData',
  installDate: 'local:installDate',
}

const loadCachedData = async (isFeed: boolean) => {
  try {
    const keys = isFeed
      ? [CACHE_KEYS.channelsData, CACHE_KEYS.installDate]
      : [CACHE_KEYS.channelData, CACHE_KEYS.installDate]

    const cached = await storage.getItems(keys)

    if (isFeed && cached[CACHE_KEYS.channelsData]) {
      channelsData.value = cached[CACHE_KEYS.channelsData]
      return true
    } else if (!isFeed && cached[CACHE_KEYS.channelData]) {
      channelData.value = cached[CACHE_KEYS.channelData]
      return true
    }
  } catch (e) {
    console.error('Error loading cached data:', e)
  }
  return false
}

const saveCachedData = async (isFeed: boolean) => {
  try {
    const now = new Date().toISOString()
    const items: Record<string, any> = {
      [CACHE_KEYS.installDate]: now,
    }

    if (isFeed) {
      items[CACHE_KEYS.channelsData] = channelsData.value
    } else {
      items[CACHE_KEYS.channelData] = channelData.value
    }

    await storage.setItems(items)
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

    // Try to load from cache first
    const hasCached = await loadCachedData(isFeed)
    if (hasCached) {
      loading.value = false
      return
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
        await saveCachedData(isFeed)
      }
    } else {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelData' })
      channelData.value = response
      await saveCachedData(isFeed)
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to extract data'
    console.error('Error:', e)
  } finally {
    loading.value = false
  }
}

const handleCopySingle = () => copyToClipboard(channelData.value!)
const handleDownloadSingle = () => downloadJSON(channelData.value!, `channel_${channelData.value!.channelId}.json`)
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
    await storage.removeItems([
      CACHE_KEYS.channelData,
      CACHE_KEYS.channelsData,
      CACHE_KEYS.installDate,
    ])
    channelData.value = null
    channelsData.value = []
    error.value = ''
    await extractData()
  } catch (e) {
    console.error('Error clearing cache:', e)
  }
}

onMounted(() => {
  // extractData()
})
</script>

<template>
  <div class="container">
    <h1>YouTube RSS Extractor</h1>

    <div v-if="loading" class="status">
      <p>Extracting {{ isFeedPage ? 'channels' : 'channel' }} data...</p>
    </div>

    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <button @click="extractData">Retry</button>
    </div>

    <ChannelDetail
      v-else-if="channelData && !isFeedPage"
      :channel="channelData"
      @refresh="extractData"
      @copy="handleCopySingle"
      @download="handleDownloadSingle"
    />

    <ChannelsList
      v-else-if="channelsData.length > 0 && isFeedPage"
      :channels="channelsData"
      @refresh="extractData"
      @copy="handleCopyAll"
      @download="handleDownloadAll"
    />

    <div v-if="channelsData.length > 0 && isFeedPage" class="button-group">
      <button @click="fetchRSSData" class="btn-primary">Fetch RSS Data</button>
      <button @click="downloadOPML" class="btn-primary">Download OPML</button>
    </div>

    <div v-else class="status">
      <p>No {{ isFeedPage ? 'channels' : 'channel' }} data extracted yet</p>
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
