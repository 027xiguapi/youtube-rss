<script lang="ts" setup>
import { useI18n } from '../composables/useI18n'

const { t } = useI18n()
</script>

<template>
  <div class="tab-content">
    <div class="settings-panel">
      <p>{{ t('settings') }}</p>
      <!-- Settings content will be added here -->
    </div>
  </div>
</template>

<style scoped>
.tab-content {
  min-height: 200px;
}

.settings-panel {
  padding: 16px;
  color: #666;
}
</style>
