import type { ChannelData, FeedChannel } from './types'

type AnyData = ChannelData | FeedChannel

export function copyToClipboard(data: AnyData | AnyData[]) {
  navigator.clipboard.writeText(JSON.stringify(data, null, 2))
}

export function downloadJSON(data: AnyData | AnyData[], filename: string) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function copyRSSUrl(rssUrl: string) {
  navigator.clipboard.writeText(rssUrl)
}
