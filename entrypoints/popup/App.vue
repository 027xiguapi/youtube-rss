<script lang="ts" setup>
import { ref, onMounted } from 'vue'

interface ChannelData {
  urlHandle?: string
  channel_id?: string
  title?: string
  subscriber_count?: number
  description?: string
  thumbnail_url?: string
  video_count?: number
  rss_url?: string
  channel_created_at?: string
}

const loading = ref(false)
const channelData = ref<ChannelData | null>(null)
const error = ref('')

const extractData = async () => {
  loading.value = true
  error.value = ''

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab found')

    const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelData' })
    channelData.value = response
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to extract channel data'
    console.error('Error:', e)
  } finally {
    loading.value = false
  }
}

const copyToClipboard = () => {
  if (channelData.value) {
    navigator.clipboard.writeText(JSON.stringify(channelData.value, null, 2))
  }
}

const downloadJSON = () => {
  if (channelData.value) {
    const json = JSON.stringify(channelData.value, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `channel_${channelData.value.channel_id || channelData.value.urlHandle}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
}

const copyRSSUrl = () => {
  if (channelData.value?.rss_url) {
    navigator.clipboard.writeText(channelData.value.rss_url)
  }
}

onMounted(() => {
  extractData()
})
</script>

<template>
  <div class="container">
    <h1>YouTube RSS Extractor</h1>

    <div v-if="loading" class="loading">
      <p>Extracting channel data...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="extractData">Retry</button>
    </div>

    <div v-else-if="channelData" class="data">
      <div v-if="channelData.thumbnail_url" class="thumbnail">
        <img :src="channelData.thumbnail_url" :alt="channelData.title" />
      </div>

      <div class="info">
        <h2>{{ channelData.title || 'Unknown Channel' }}</h2>

        <div class="field" v-if="channelData.channel_id">
          <label>Channel ID:</label>
          <code>{{ channelData.channel_id }}</code>
        </div>

        <div class="field" v-if="channelData.subscriber_count">
          <label>Subscribers:</label>
          <span>{{ channelData.subscriber_count.toLocaleString() }}</span>
        </div>

        <div class="field" v-if="channelData.video_count">
          <label>Videos:</label>
          <span>{{ channelData.video_count }}</span>
        </div>

        <div class="field" v-if="channelData.description">
          <label>Description:</label>
          <p class="description">{{ channelData.description }}</p>
        </div>

        <div class="field" v-if="channelData.rss_url">
          <label>RSS URL:</label>
          <div class="rss-url">
            <a :href="channelData.rss_url" target="_blank">{{ channelData.rss_url }}</a>
            <button @click="copyRSSUrl" class="copy-btn">Copy</button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="copyToClipboard" class="btn-primary">Copy JSON</button>
        <button @click="downloadJSON" class="btn-primary">Download JSON</button>
        <button @click="extractData" class="btn-secondary">Refresh</button>
      </div>
    </div>

    <div v-else class="empty">
      <p>No channel data extracted yet</p>
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

h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #030303;
}

.loading, .error, .empty {
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

.data {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.thumbnail {
  text-align: center;
}

.thumbnail img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field label {
  font-weight: 600;
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
}

.field code {
  background: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 12px;
  word-break: break-all;
}

.field span {
  font-size: 14px;
  color: #030303;
}

.description {
  margin: 0;
  font-size: 13px;
  color: #666;
  line-height: 1.4;
}

.rss-url {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rss-url a {
  flex: 1;
  color: #065fd4;
  text-decoration: none;
  font-size: 12px;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rss-url a:hover {
  text-decoration: underline;
}

.copy-btn {
  padding: 4px 8px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-size: 11px;
  white-space: nowrap;
}

.copy-btn:hover {
  background: #e0e0e0;
}

.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  flex: 1;
  min-width: 120px;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: #065fd4;
  color: white;
}

.btn-primary:hover {
  background: #0551b8;
}

.btn-secondary {
  background: #f0f0f0;
  color: #030303;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.empty button {
  margin-top: 12px;
  padding: 8px 16px;
  background: #065fd4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>
