<script lang="ts" setup>
import ActionBar from './ActionBar.vue'
import ChannelCard from './ChannelCard.vue'
import type { ChannelData } from '../composables/types'

defineProps<{
  channels: ChannelData[]
}>()

const emit = defineEmits<{
  refresh: []
  copy: []
  download: []
}>()
</script>

<template>
  <div class="channels-list">
    <div class="channels-header">
      <h2>{{ channels.length }} Channels Found</h2>
    </div>

    <div class="channels-grid">
      <ChannelCard v-for="channel in channels" :key="channel.externalId" :channel="channel" />
    </div>
    <ActionBar
      copy-label="Copy All JSON"
      download-label="Download All"
      @copy="emit('copy')"
      @download="emit('download')"
      @refresh="emit('refresh')"
    />
  </div>
</template>

<style scoped>
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
  font-size: 16px;
  color: #030303;
}

.channels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  max-height: 600px;
  overflow-y: auto;
}
</style>
