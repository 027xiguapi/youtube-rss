import type { ChannelData } from './types'

export function copyToClipboard(data: ChannelData | ChannelData[]) {
  navigator.clipboard.writeText(JSON.stringify(data, null, 2))
}

export function downloadJSON(data: ChannelData | ChannelData[], filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function copyUrl(url: string) {
  navigator.clipboard.writeText(url)
}
