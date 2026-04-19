<script lang="ts" setup>
import { ref } from 'vue'
import { useChannelStore } from '../stores/channelStore'
import { useI18n } from '../composables/useI18n'

const store = useChannelStore()
const { t } = useI18n()

const channelLinks = ref<string[]>([])
const channelLinksLoading = ref(false)

const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:7002')
  : 'https://aitubestats.com'

const links = [
  { href: '/', label: t('home') },
  { href: '/youtube-rss', label: t('rssSearch') },
  { href: '/channel-id-finder', label: t('channelIdFinder') },
  { href: '/youtube-viewer', label: t('youtubeViewer') }
]

const exportYouTubeCookies = async () => {
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) {
      store.setError('No active tab found')
      return
    }

    const response = await browser.tabs.sendMessage(tab.id, { action: 'exportCookies' })
    if (response.success) {
      store.clearError()
    } else {
      store.setError(response.error || 'Failed to export cookies')
    }
  } catch (e) {
    store.setError(e instanceof Error ? e.message : 'Failed to export cookies')
    console.error('Error exporting cookies:', e)
  }
}

const getChannelLinks = async () => {
  channelLinksLoading.value = true
  channelLinks.value = []
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true })
    if (!tab.id) throw new Error('No active tab found')

    const response = await browser.tabs.sendMessage(tab.id, { action: 'getChannelLinks' })
    if (response && response.urls) {
      channelLinks.value = response.urls
    }
  } catch (e) {
    console.error('Error:', e)
  } finally {
    channelLinksLoading.value = false
  }
}

const copyChannelLinks = async () => {
  try {
    await navigator.clipboard.writeText(channelLinks.value.join('\n'))
  } catch (e) {
    console.error('Error:', e)
  }
}

</script>

<template>
  <div class="tab-content">
    <div class="tools-section">
      <div class="tool-group">
        <h3>{{ t('exportCookies') || 'Export YouTube Cookies' }}</h3>
        <div class="btn-row">
          <button @click="exportYouTubeCookies" class="btn-primary">
            {{ t('downloadCookies') || 'Download Cookies' }}
          </button>
        </div>
      </div>

      <div class="tool-group">
        <h3>{{ t('getChannelLinks') || 'Get Channel Links' }}</h3>
        <div class="btn-row">
          <button @click="getChannelLinks" class="btn-primary" :disabled="channelLinksLoading">
            {{ channelLinksLoading ? '...' : (t('getLinks') || 'Get Links') }}
          </button>
          <button v-if="channelLinks.length > 0" @click="copyChannelLinks" class="btn-secondary">
            {{ t('copyAll') || 'Copy All' }}
          </button>
        </div>
        <div v-if="channelLinks.length > 0" class="channel-links-list">
          <div v-for="(url, index) in channelLinks" :key="index" class="link-item">
            <a :href="url" target="_blank" rel="noreferrer" class="channel-url">{{ url }}</a>
          </div>
        </div>
        <div v-else-if="!channelLinksLoading" class="no-links">
          {{ t('noChannelLinksFound') || 'No channel links found' }}
        </div>
      </div>

      <div class="tool-group">
        <h3>{{ t('channelLinks') || 'Channel Links' }}</h3>
        <div class="channel-links">
          <a
            v-for="(link, index) in links"
            :key="link.href"
            :href="`${API_BASE_URL}${link.href}`"
            target="_blank"
            rel="noreferrer"
            class="btn-link"
          >
            {{index + 1}}. {{ link.label }}
          </a>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  min-height: 200px;
}

.tools-section {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.tool-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.tool-group h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #030303;
}

.channel-links {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  width: 100%;
}

.btn-primary {
  padding: 8px 16px;
  background: #065fd4;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary:hover {
  background: #0551b8;
}

.btn-primary:active {
  background: #043d8a;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  padding: 8px 16px;
  background: #fff;
  color: #065fd4;
  border: 1px solid #065fd4;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary:hover {
  background: #e8f0ff;
}

.btn-link {
  color: #065fd4;
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition: all 0.2s;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-link:hover {
  background: #e8f0ff;
  border-color: #065fd4;
}

.btn-row {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.channel-links-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 200px;
  overflow-y: auto;
  font-size: 12px;
  width: 100%;
}

.link-item {
  padding: 4px 8px;
  background: #f8f8f8;
  border-radius: 4px;
}

.channel-url {
  color: #065fd4;
  text-decoration: none;
  word-break: break-all;
}

.channel-url:hover {
  text-decoration: underline;
}

.no-links {
  color: #999;
  font-size: 13px;
  text-align: center;
}

.status {
  padding: 20px;
  text-align: center;
  color: #666;
}
</style>
