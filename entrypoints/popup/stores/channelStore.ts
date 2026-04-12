import { ref, reactive, computed } from 'vue'
import { storage } from '@wxt-dev/storage'
import type { ChannelData } from '../composables/types'
import { generateTOTP, getCurrentStep } from '~/utils/2fa';

const CACHE_KEY = 'local:channelsData'

const API_BASE_URL = 'http://localhost:3000'

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
    console.log('Saved cached data:', channelsData)
  } catch (e) {
    console.error('Error saving cached data:', e)
    error.value = 'Failed to save data'
  }
}

const setChannelsData = async (data: ChannelData[]) => {
  channelsData.splice(0, channelsData.length, ...data)
  try {
    if (data.length === 0) return
    loading.value = true

    const tfaSecret = process.env.TFA_SECRET || '963_SHARED_SECRET_KEY'
    const step = getCurrentStep()
    const tfa = await generateTOTP(tfaSecret, step)
    const res = await fetch(`${API_BASE_URL}/api/channels/rss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ channels: data, timestamp: Date.now(), tfa }),
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }
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
    addChannel,
    updateChannel,
    clearCache,
    setLoading,
    setError,
    clearError,
  }
}
