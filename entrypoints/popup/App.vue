<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import ChannelsList from './components/ChannelsList.vue'
import { copyToClipboard, downloadJSON } from './composables/useUtils'
import { useChannelStore } from './stores/channelStore'

const store = useChannelStore()
const isFeedPage = ref(false)
const { channelsData, loading, error } = store

const extractData = async () => {
  store.setLoading(true)
  store.clearError()

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab found')

    const isFeed = tab.url?.includes('youtube.com/feed/channels') || false
    isFeedPage.value = isFeed

    if (isFeed) {
      await extractChannelsRss(tab)
    } else {
      await extractChannelData(tab)
    }
  } catch (e) {
    store.setError(e instanceof Error ? e.message : 'Failed to extract data')
    console.error('Error:', e)
  } finally {
    store.setLoading(false)
  }
}

const extractChannelsRss = async (tab: any) => {
  const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelsRss' })
  if (response && response.channels) {
    store.setChannelsData(response.channels || [])
  }
  if (channelsData.length === 0) {
    store.setError('No channels found on this page')
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
    store.setError('No channels data to export')
    return
  }

  const opmlText = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
\t<head>
\t\t<title>YouTube Subscriptions as RSS</title>
\t\t<dateCreated>${new Date().toISOString()}</dateCreated>
\t</head>
\t<body>
\t\t<outline text="YouTube Subscriptions">${channelsData
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
    isFeedPage.value = isFeed

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
    <h1>YouTube RSS Extractor({{ channelsData.length || 0 }})</h1>

    <div v-if="store.loading.value" class="status">
      <p>Extracting channels data...</p>
    </div>

    <div v-else-if="store.error.value" class="status error">
      <p>{{ store.error.value }}</p>
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
