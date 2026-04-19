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
    <div class="channels-grid">
      <ChannelCard v-for="channel in channels" :key="channel.externalId" :channel="channel" />
    </div>
  </div>
</template>

<style scoped>
.channels-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: calc(100vh - 170px);
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
  overflow-y: auto;
}
</style>
