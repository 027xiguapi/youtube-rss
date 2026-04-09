<script lang="ts" setup>
defineProps<{
  copyLabel?: string
  downloadLabel?: string
  showRefresh?: boolean
}>()

const emit = defineEmits<{
  copy: []
  download: []
  refresh: []
}>()
</script>

<template>
  <div class="actions">
    <button @click="emit('copy')" class="btn-primary">{{ copyLabel || 'Copy JSON' }}</button>
    <button @click="emit('download')" class="btn-primary">{{ downloadLabel || 'Download JSON' }}</button>
    <button v-if="showRefresh !== false" @click="emit('refresh')" class="btn-secondary">Refresh</button>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-primary, .btn-secondary {
  flex: 1;
  min-width: 120px;
  padding: 10px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
}

.btn-primary {
  background: #065fd4;
  color: white;
}

.btn-primary:hover {
  background: #0551b8;
}

.btn-secondary {
  background: #f0f0f0;
  color: #030303;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #e0e0e0;
}
</style>
