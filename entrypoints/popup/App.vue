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
  image?: string
  og_image?: string
  og_title?: string
}

const loading = ref(false)
const channelData = ref<ChannelData | null>(null)
const channelsData = ref<ChannelData[]>([])
const error = ref('')
const isFeedPage = ref(false)

const extractData = async () => {
  loading.value = true
  error.value = ''

  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab found')

    // Check if we're on the feed/channels page
    const isFeed = tab.url?.includes('youtube.com/feed/channels')
    isFeedPage.value = isFeed || false

    if (isFeed) {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'extractChannelsRss' })
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

const copyToClipboard = (data: ChannelData | ChannelData[]) => {
  navigator.clipboard.writeText(JSON.stringify(data, null, 2))
}

const downloadJSON = (data: ChannelData | ChannelData[], filename: string) => {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

const copyRSSUrl = (rssUrl: string) => {
  navigator.clipboard.writeText(rssUrl)
}

onMounted(() => {
  extractData()
})

</script>

<template>
  <div class="container">
    <h1>YouTube RSS Extractor</h1>

    <div v-if="loading" class="loading">
      <p>Extracting {{ isFeedPage ? 'channels' : 'channel' }} data...</p>
    </div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="extractData">Retry</button>
    </div>

    <!-- Single Channel View -->
    <div v-else-if="channelData && !isFeedPage" class="data">
      <div v-if="channelData.thumbnail_url || channelData.og_image" class="thumbnail">
        <img :src="channelData.thumbnail_url || channelData.og_image" :alt="channelData.title" />
      </div>

      <div class="info">
        <h2>{{ channelData.title || channelData.og_title || 'Unknown Channel' }}</h2>

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
            <button @click="copyRSSUrl(channelData.rss_url)" class="copy-btn">Copy</button>
          </div>
        </div>
      </div>

      <div class="actions">
        <button @click="copyToClipboard(channelData)" class="btn-primary">Copy JSON</button>
        <button @click="downloadJSON(channelData, `channel_${channelData.channel_id || channelData.urlHandle}.json`)" class="btn-primary">Download JSON</button>
        <button @click="extractData" class="btn-secondary">Refresh</button>
      </div>
    </div>

    <!-- Multiple Channels View (Feed Page) -->
    <div v-else-if="channelsData.length > 0 && isFeedPage" class="channels-list">
      <div class="channels-header">
        <h2>{{ channelsData.length }} Channels Found</h2>
        <div class="actions">
          <button @click="copyToClipboard(channelsData)" class="btn-primary">Copy All JSON</button>
          <button @click="downloadJSON(channelsData, 'channels.json')" class="btn-primary">Download All</button>
          <button @click="extractData" class="btn-secondary">Refresh</button>
        </div>
      </div>

      <div class="channels-grid">
        <div v-for="channel in channelsData" :key="channel.channel_id" class="channel-card">
          <div v-if="channel.thumbnail_url" class="card-thumbnail">
            <img :src="channel.thumbnail_url" :alt="channel.title" />
          </div>

          <div class="card-info">
            <h3>{{ channel.title }}</h3>

            <div v-if="channel.subscriber_count" class="card-stat">
              <span class="label">Subscribers:</span>
              <span>{{ channel.subscriber_count.toLocaleString() }}</span>
            </div>

            <div v-if="channel.video_count" class="card-stat">
              <span class="label">Videos:</span>
              <span>{{ channel.video_count }}</span>
            </div>

            <div v-if="channel.rss_url" class="card-rss">
              <a :href="channel.rss_url" target="_blank" title="Open RSS feed">RSS</a>
              <button @click="copyRSSUrl(channel.rss_url)" class="copy-btn" title="Copy RSS URL">Copy</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="empty">
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

h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #030303;
}

h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
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

/* Channels List Styles */
.channels-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.channels-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.channels-header h2 {
  margin: 0;
}

.channels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
}

.channel-card {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  transition: background 0.2s;
}

.channel-card:hover {
  background: #f0f0f0;
}

.card-thumbnail {
  flex-shrink: 0;
}

.card-thumbnail img {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.card-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.card-info h3 {
  margin: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-stat {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.card-stat .label {
  font-weight: 600;
  color: #999;
}

.card-rss {
  display: flex;
  gap: 6px;
  align-items: center;
}

.card-rss a {
  color: #065fd4;
  text-decoration: none;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 6px;
  background: #e8f0ff;
  border-radius: 3px;
}

.card-rss a:hover {
  background: #d0e0ff;
}

.card-rss .copy-btn {
  padding: 2px 6px;
  font-size: 10px;
}
</style>
