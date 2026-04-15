<script lang="ts" setup>
import { useChannelStore } from '../stores/channelStore'
import { useI18n } from '../composables/useI18n'

const store = useChannelStore()
const { t } = useI18n()

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

</script>

<template>
  <div class="tab-content">
    <div class="tools-section">
      <div class="tool-group">
        <h3>{{ t('exportCookies') || 'Export YouTube Cookies' }}</h3>
        <button @click="exportYouTubeCookies" class="btn-primary">
          {{ t('downloadCookies') || 'Download Cookies' }}
        </button>
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
  gap: 12px;
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

.status {
  padding: 20px;
  text-align: center;
  color: #666;
}
</style>
