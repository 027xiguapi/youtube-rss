import { generateTOTP, getCurrentStep } from '~/utils/2fa'
import { onMessage } from '~/utils/messaging'
import type { ChannelData } from '~/entrypoints/popup/composables/types'

const API_BASE_URL = import.meta.env.DEV
  ? (import.meta.env.VITE_API_BASE_URL || 'http://localhost:7002')
  : 'https://aitubestats.com'

export default defineBackground(() => {
  console.log('YouTube RSS Extractor background script loaded')

  // Handle batch save channels request from popup
  onMessage('BATCH_SAVE_CHANNELS', async (message:any) => {
    try {
      const sendResponse = await handleBatchSaveChannels(message.data)
      return true;
    } catch (error: any) {
      console.error('Failed to batch save channels:', error)
      return { success: false, error: error.message }
    }
  });
  onMessage('BATCH_SEARCH_CHANNELS', async (message:any) => {
    try {
      const sendResponse = await handleBatchSearchChannels(message.data)
      return sendResponse;
    } catch (error: any) {
      console.error('Failed to batch search channels:', error)
      return { success: false, error: error.message }
    }
  });
})

async function handleBatchSaveChannels(data: ChannelData[]) {
  try {
    if (data.length === 0) {
      return { success: true, message: 'No channels to save' }
    }

    const tfaSecret = import.meta.env.VITE_TFA_SECRET || ''
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

    const result = await res.json()
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to batch save channels:', error)
    throw error
  }
}

async function handleBatchSearchChannels(queries: string[]) {
  try {
    if (!queries || queries.length === 0) {
      return { success: true, data: [] }
    }

    const searchParams = new URLSearchParams()

    for (const q of queries) {
      searchParams.append('q', q)
    }

    const res = await fetch(`${API_BASE_URL}/api/channels/batch?${searchParams.toString()}`, {
      method: 'GET',
    })

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`)
    }

    const result = await res.json()
    return { success: true, data: result }
  } catch (error) {
    console.error('Failed to batch search channels:', error)
    throw error
  }
}
