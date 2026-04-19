<script lang="ts" setup>
import { computed } from 'vue'
import ChannelsList from './ChannelsList.vue'
import { copyToClipboard, downloadJSON } from '../composables/useUtils'
import { useChannelStore } from '../stores/channelStore'
import { useI18n } from '../composables/useI18n'

const store = useChannelStore()
const { t } = useI18n()
const { channelsData, loading, error } = store

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
  emit('extract-data')
}

const copyAllRSS = async () => {
  const rssUrls = channelsData.map(ch => ch.rssUrl).filter(Boolean)
  if (rssUrls.length > 0) {
    await navigator.clipboard.writeText(rssUrls.join('\n'))
  }
}

const emit = defineEmits<{
  'extract-data': []
}>()
</script>

<template>
  <div class="tab-content">
    <div v-if="loading" class="status">
      <p>{{ t('extractingChannels') }}</p>
    </div>

    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <button @click="$emit('extract-data')">{{ t('retry') }}</button>
    </div>

    <ChannelsList
      v-else-if="channelsData.length > 0"
      :channels="channelsData"
      @refresh="$emit('extract-data')"
      @copy="handleCopyAll"
      @download="handleDownloadAll"
    />

    <div v-if="channelsData.length > 0" class="button-group">
      <button @click="fetchRSSData" class="btn-primary">{{ t('fetchRSSData') }}</button>
      <button @click="downloadOPML" class="btn-primary">{{ t('downloadOPML') }}</button>
      <button @click="copyAllRSS" class="btn-primary">{{ t('copyAllRSS') }}</button>
    </div>

    <div v-else class="status">
      <p>{{ t('noChannelsData') }}</p>
      <button @click="$emit('extract-data')">{{ t('extractData') }}</button>
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  min-height: 200px;
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
  flex-direction: row;
  gap: 8px;
  padding-top: 8px;
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
}

.btn-primary:hover {
  background: #0551b8;
}

.btn-primary:active {
  background: #043d8a;
}
</style>
