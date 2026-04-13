import { ref, reactive, computed } from 'vue'
import { storage } from '@wxt-dev/storage'
import { sendMessage } from '~/utils/messaging'
import type { ChannelData } from '../composables/types'

const CACHE_KEY = 'local:channelsData'

// State
const channelsData = reactive<ChannelData[]>([])
const loading = ref(false)
const error = ref('')

// Getters
const channelCount = computed(() => channelsData.length)

const getChannelById = (externalId: string) => {
  return channelsData.find((ch) => ch.externalId === externalId)
}

const getChannelsByOwnerUrls = (ownerUrls: string[]) => {
  try {
    return channelsData.filter((ch) =>
      ch.ownerUrls?.some((url) => ownerUrls.includes(url))
    )
  } catch (e) {
    console.error('Error in getChannelsByOwnerUrls:', e)
    return []
  }
}

// Actions
const loadCachedData = async () => {
  try {
    const cached = (await storage.getItem(CACHE_KEY)) as ChannelData[] | null

    if (cached) {
      channelsData.length = 0
      channelsData.push(...Object.values(cached))
      return true
    }
  } catch (e) {
    console.error('Error loading cached data:', e)
    error.value = 'Failed to load cached data'
  }
  return false
}

const saveCachedData = async () => {
  try {
    await storage.setItem(CACHE_KEY, channelsData)
  } catch (e) {
    console.error('Error saving cached data:', e)
    error.value = 'Failed to save data'
  }
}

const setChannelsData = (data: ChannelData[]) => {
  channelsData.splice(0, channelsData.length, ...data)
  try {
    if (data.length === 0) return
    loading.value = true
    sendMessage('BATCH_SAVE_CHANNELS', [...data])
  } catch (e) {
    console.error('Failed to batch save channels:', e)
    error.value = 'Failed to batch save channels'
  } finally {
    loading.value = false
  }
}

const addChannel = (channel: ChannelData) => {
  const exists = channelsData.some((ch) => ch.externalId === channel.externalId)
  if (!exists) {
    channelsData.push(channel)
  }
}

const updateChannel = (externalId: string, updates: Partial<ChannelData>) => {
  const index = channelsData.findIndex((ch) => ch.externalId === externalId)
  if (index !== -1) {
    channelsData[index] = { ...channelsData[index], ...updates }
  }
}

const clearCache = async () => {
  try {
    await storage.removeItem(CACHE_KEY)
    channelsData.length = 0
    error.value = ''
  } catch (e) {
    console.error('Error clearing cache:', e)
    error.value = 'Failed to clear cache'
  }
}

const setLoading = (value: boolean) => {
  loading.value = value
}

const setError = (message: string) => {
  error.value = message
}

const clearError = () => {
  error.value = ''
}

const searchChannels = async (queries: string[]): Promise<ChannelData[]> => {
  try {
    if (!queries || queries.length === 0) {
      return []
    }
    loading.value = true

    const response = await browser.runtime.sendMessage({
      type: 'BATCH_SEARCH_CHANNELS',
      queries,
    })

    if (!response.success) {
      throw new Error(response.error || 'Failed to search channels')
    }

    return response.data || []
  } catch (e) {
    console.error('Failed to search channels:', e)
    error.value = 'Failed to search channels'
    return []
  } finally {
    loading.value = false
  }
}

export const useChannelStore = () => {
  return {
    // State
    channelsData,
    loading,
    error,

    // Getters
    channelCount,
    getChannelById,
    getChannelsByOwnerUrls,

    // Actions
    loadCachedData,
    saveCachedData,
    setChannelsData,
    searchChannels,
    addChannel,
    updateChannel,
    clearCache,
    setLoading,
    setError,
    clearError,
  }
}
