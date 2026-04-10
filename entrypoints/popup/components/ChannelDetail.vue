<script lang="ts" setup>
import { copyRSSUrl } from '../composables/useUtils'
import ActionBar from './ActionBar.vue'
import type { ChannelData } from '../composables/types'

const props = defineProps<{
  channel: ChannelData
}>()

const emit = defineEmits<{
  refresh: []
  copy: []
  download: []
}>()

const getThumbnailUrl = () => {
  return props.channel.avatar?.thumbnails?.[0]?.url || ''
}

const getTitle = () => {
  return props.channel.title || 'Unknown Channel'
}
</script>

<template>
  <div class="channel-detail">
    <div class="detail-header">
      <div v-if="getThumbnailUrl()" class="thumbnail">
        <img :src="getThumbnailUrl()" :alt="getTitle()" />
      </div>

      <div class="header-info">
        <h2>{{ getTitle() }}</h2>
        <p v-if="channel.description" class="description">{{ channel.description }}</p>
      </div>
    </div>

    <div class="detail-content">
      <div v-if="channel.externalId" class="field">
        <label>Channel ID:</label>
        <code>{{ channel.externalId }}</code>
      </div>

      <div v-if="channel.channelUrl" class="field">
        <label>Channel URL:</label>
        <a :href="channel.channelUrl" target="_blank" class="url-link">{{ channel.channelUrl }}</a>
      </div>

      <div v-if="channel.subscriberCount" class="field">
        <label>Subscribers:</label>
        <span>{{ channel.subscriberCount.toLocaleString() }}</span>
      </div>

      <div v-if="channel.videoCount" class="field">
        <label>Videos:</label>
        <span>{{ channel.videoCount }}</span>
      </div>

      <div v-if="channel.region" class="field">
        <label>Region:</label>
        <span>{{ channel.region }}</span>
      </div>

      <div v-if="channel.rssUrl" class="field">
        <label>RSS URL:</label>
        <div class="rss-url">
          <a :href="channel.rssUrl" target="_blank" class="rss-link">RSS Feed</a>
          <button @click="copyRSSUrl(channel.rssUrl)" class="copy-btn" title="Copy RSS URL">Copy</button>
        </div>
      </div>

      <div v-if="channel.ownerUrls && channel.ownerUrls.length > 0" class="field">
        <label>Owner URLs:</label>
        <div class="owner-urls">
          <a v-for="(url, idx) in channel.ownerUrls" :key="idx" :href="url" target="_blank" class="owner-link">
            {{ url }}
          </a>
        </div>
      </div>
    </div>

    <ActionBar
      @copy="emit('copy')"
      @download="emit('download')"
      @refresh="emit('refresh')"
    />
  </div>
</template>

<style scoped>
.channel-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  gap: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
}

.thumbnail {
  flex-shrink: 0;
}

.thumbnail img {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
}

.header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.header-info h2 {
  margin: 0;
  font-size: 16px;
  color: #030303;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.description {
  margin: 0;
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.detail-content {
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
  font-size: 11px;
  color: #666;
  text-transform: uppercase;
}

.field code {
  background: #f5f5f5;
  padding: 6px 8px;
  border-radius: 4px;
  font-family: 'Monaco', 'Courier New', monospace;
  font-size: 11px;
  word-break: break-all;
}

.field span {
  font-size: 13px;
  color: #030303;
}

.url-link,
.rss-link,
.owner-link {
  color: #065fd4;
  text-decoration: none;
  font-size: 12px;
  word-break: break-all;
}

.url-link:hover,
.rss-link:hover,
.owner-link:hover {
  text-decoration: underline;
}

.rss-url {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rss-link {
  flex: 1;
  padding: 4px 8px;
  background: #e8f0ff;
  border-radius: 3px;
  text-align: center;
}

.rss-link:hover {
  background: #d0e0ff;
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

.owner-urls {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.owner-link {
  padding: 4px 0;
  font-size: 12px;
}
</style>
