<script lang="ts" setup>
import { copyRSSUrl } from '../composables/useUtils'
import type { ChannelData } from '../composables/types'

const props = defineProps<{
  channel: ChannelData
}>()

const getThumbnailUrl = () => {
  return props.channel.avatar?.thumbnails?.[0]?.url || ''
}

const getTitle = () => {
  return props.channel.title || 'Unknown Channel'
}

const formatSubscribers = (count?: number) => {
  if (!count) return ''
  if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`
  if (count >= 1000) return `${(count / 1000).toFixed(1)}K`
  return count.toString()
}
</script>

<template>
  <div class="channel-card">
    <div v-if="getThumbnailUrl()" class="card-thumbnail">
      <img :src="getThumbnailUrl()" :alt="getTitle()" />
    </div>

    <div class="card-info">
      <h3 :title="getTitle()">{{ getTitle() }}</h3>

      <div class="card-meta">
        <span v-if="channel.subscriberCount" class="meta-item">
          {{ formatSubscribers(channel.subscriberCount) }} subscribers
        </span>
        <span v-if="channel.videoCount" class="meta-item">
          {{ channel.videoCount }} videos
        </span>
      </div>

      <div v-if="channel.rssUrl" class="card-rss">
        <a :href="channel.rssUrl" target="_blank" title="Open RSS feed">RSS</a>
        <button @click="copyRSSUrl(channel.rssUrl)" class="copy-btn" title="Copy RSS URL">Copy</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
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
  border-radius: 8px;
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
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #030303;
}

.card-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 11px;
  color: #666;
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

.copy-btn {
  padding: 2px 6px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
}

.copy-btn:hover {
  background: #e0e0e0;
}
</style>
