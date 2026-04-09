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

const thumbnailSrc = props.channel.thumbnail_url || props.channel.og_image
const title = props.channel.title || props.channel.og_title || 'Unknown Channel'
</script>

<template>
  <div class="data">
    <div v-if="thumbnailSrc" class="thumbnail">
      <img :src="thumbnailSrc" :alt="channel.title" />
    </div>

    <div class="info">
      <h2>{{ title }}</h2>

      <div class="field" v-if="channel.channel_id">
        <label>Channel ID:</label>
        <code>{{ channel.channel_id }}</code>
      </div>

      <div class="field" v-if="channel.subscriber_count">
        <label>Subscribers:</label>
        <span>{{ channel.subscriber_count.toLocaleString() }}</span>
      </div>

      <div class="field" v-if="channel.video_count">
        <label>Videos:</label>
        <span>{{ channel.video_count }}</span>
      </div>

      <div class="field" v-if="channel.description">
        <label>Description:</label>
        <p class="description">{{ channel.description }}</p>
      </div>

      <div class="field" v-if="channel.rss_url">
        <label>RSS URL:</label>
        <div class="rss-url">
          <a :href="channel.rss_url" target="_blank">{{ channel.rss_url }}</a>
          <button @click="copyRSSUrl(channel.rss_url!)" class="copy-btn">Copy</button>
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

h2 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #030303;
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
</style>
