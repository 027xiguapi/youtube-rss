<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import ChannelsTab from './components/ChannelsTab.vue'
import ToolsTab from './components/ToolsTab.vue'
import SettingsTab from './components/SettingsTab.vue'
import { useChannelStore } from './stores/channelStore'
import { useI18n } from './composables/useI18n'

const store = useChannelStore()
const { t } = useI18n()
const { channelsData } = store
const activeTab = ref<'channels' | 'tools' | 'settings'>('channels')

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

    <!-- Tab Navigation -->
    <div class="tabs">
      <button
        :class="['tab', { active: activeTab === 'channels' }]"
        @click="activeTab = 'channels'"
      >
        {{ t('channels') }}
      </button>
      <button
        :class="['tab', { active: activeTab === 'tools' }]"
        @click="activeTab = 'tools'"
      >
        {{ t('tools') }}
      </button>
      <button
        :class="['tab', { active: activeTab === 'settings' }]"
        @click="activeTab = 'settings'"
      >
        {{ t('settings') }}
      </button>
    </div>

    <!-- Tab Content -->
    <ChannelsTab v-if="activeTab === 'channels'" @extract-data="extractData" />
    <ToolsTab v-if="activeTab === 'tools'" />
    <SettingsTab v-if="activeTab === 'settings'" />
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

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.tab {
  padding: 8px 16px;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s;
  border-radius: 0;
}

.tab:hover {
  color: #030303;
}

.tab.active {
  color: #065fd4;
  border-bottom-color: #065fd4;
}
</style>
