<script lang="ts" setup>
import { copyUrl } from '../composables/useUtils'
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
</script>

<template>
  <div class="channel-card">
    <div v-if="getThumbnailUrl()" class="card-thumbnail">
      <img :src="getThumbnailUrl()" :alt="getTitle()" />
    </div>

    <div class="card-info">
      <a  v-if="channel.ownerUrls && channel.ownerUrls.length > 0" :href="channel.ownerUrls[0]" target="_blank" class="owner-link">
        <h3 :title="getTitle()" class="meta-title">{{ getTitle() }}</h3>
      </a>
      <div class="card-meta">
        <div v-if="channel.rssUrl" class="rss-item">
          <a :href="channel.rssUrl" target="_blank" class="rss-link">{{ channel.rssUrl }}</a>
          <button @click="copyUrl(channel.rssUrl)" class="copy-btn" title="Copy RSS URL">Copy</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.channel-card {
  display: flex;
  gap: 12px;
  padding: 12px;
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
  gap: 0px;
  min-width: 0;
}

.card-info h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #030303;
  text-align: left;
  cursor: pointer;
}

.card-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: left;
}

.meta-item {
  font-size: 11px;
  color: #666;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rss-item {
  display: flex;
  gap: 6px;
  align-items: center;
  font-size: 11px;
}

.owner-link,
.rss-link {
  color: #065fd4;
  text-decoration: none;
  font-size: 11px;
  word-break: break-all;
}

.owner-link:hover,
.rss-link:hover {
  text-decoration: underline;
}

.copy-btn {
  padding: 2px 6px;
  background: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 3px;
  cursor: pointer;
  font-size: 10px;
  white-space: nowrap;
}

.copy-btn:hover {
  background: #e0e0e0;
}
</style>
