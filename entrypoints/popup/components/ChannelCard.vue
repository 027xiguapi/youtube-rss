<script lang="ts" setup>
import { copyRSSUrl } from '../composables/useUtils'
import type { ChannelData } from '../composables/types'

defineProps<{
  channel: ChannelData
}>()
</script>

<template>
  <div class="channel-card">
    <div v-if="channel.thumbnailUrl" class="card-thumbnail">
      <img :src="channel.thumbnailUrl" :alt="channel.title" />
    </div>

    <div class="card-info">
      <h3>{{ channel.title }}</h3>

      <div class="card-rss">
        <a v-if="channel.rssUrl" :href="channel.rssUrl" target="_blank" title="Open RSS feed">RSS</a>
        <button v-if="channel.rssUrl" @click="copyRSSUrl(channel.rssUrl)" class="copy-btn" title="Copy RSS URL">Copy</button>
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
  color: #030303;
}

.card-url {
  color: #065fd4;
  text-decoration: none;
  font-size: 11px;
  word-break: break-all;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-url:hover {
  text-decoration: underline;
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
