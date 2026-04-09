<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import ChannelDetail from './components/ChannelDetail.vue'
import ChannelsList from './components/ChannelsList.vue'
import { copyToClipboard, downloadJSON } from './composables/useUtils'
import type { ChannelData, FeedChannel } from './composables/types'

const loading = ref(false)
const channelData = ref<ChannelData | null>(null)
const channelsData = ref<FeedChannel[]>([])
const error = ref('')
const isFeedPage = ref(false)

const extractData = async () => {
  loading.value = true
  error.value = ''

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab found')

    const isFeed = tab.url?.includes('youtube.com/feed/channels')
    isFeedPage.value = isFeed || false

    if (isFeed) {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelsRss' })
      console.log(11, response);
      if (response && response.channels) {
        channelsData.value = response.channels || []
      }
      if (channelsData.value.length === 0) {
        error.value = 'No channels found on this page'
      }
    } else {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelData' })
      channelData.value = response
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to extract data'
    console.error('Error:', e)
  } finally {
    loading.value = false
  }
}

const handleCopySingle = () => copyToClipboard(channelData.value!)
const handleDownloadSingle = () => downloadJSON(channelData.value!, `channel_${channelData.value!.channel_id || channelData.value!.urlHandle}.json`)
const handleCopyAll = () => copyToClipboard(channelsData.value)
const handleDownloadAll = () => downloadJSON(channelsData.value, 'channels.json')

onMounted(() => {
  extractData()
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
</style>
