const YPP_TAG_ID = 'ypp-status-tag'
const RSS_BTN_ID = 'channel-rss-btn'

import { showChannelDialog, RSS_ICON } from '~/utils/channelDialog'
import { extractChannelData } from '~/utils/youtubeExtractor'

function detectYPP(): boolean {
  // Join/membership button in the channel actions area — only visible when channel has YPP
  const joinBtn = document.querySelector<HTMLElement>(
    'yt-flexible-actions-view-model button[aria-label*="加入此频道"],' +
    'yt-flexible-actions-view-model button[aria-label*="join this channel" i],' +
    'ytd-subscribe-button-renderer + button-view-model button[aria-label*="加入此频道"],' +
    'ytd-subscribe-button-renderer + button-view-model button[aria-label*="join this channel" i]'
  )
  if (joinBtn) return true

  // Fallback: generic join button in the actions area
  const actions = document.querySelector('yt-flexible-actions-view-model')
  if (actions) {
    const btnTexts = actions.querySelectorAll<HTMLElement>('button-view-model button')
    for (const btn of btnTexts) {
      const label = btn.getAttribute('aria-label') || ''
      if (/join this channel|加入此频道/i.test(label)) return true
    }
  }

  return false
}

function injectChannelElements() {
  const oldTag = document.getElementById(YPP_TAG_ID)
  if (oldTag) oldTag.remove()
  const oldBtn = document.getElementById(RSS_BTN_ID)
  if (oldBtn) oldBtn.remove()

  const titleH1 = document.querySelector('yt-dynamic-text-view-model h1.dynamicTextViewModelH1')
  if (!titleH1) return

  // YPP tag
  const hasYPP = detectYPP()
  if (hasYPP) {
    const tag = document.createElement('span')
    tag.id = YPP_TAG_ID
    tag.textContent = 'YPP'
    tag.style.cssText = `
      display: inline-flex;
      align-items: center;
      margin-left: 8px;
      padding: 2px 8px;
      border-radius: 4px;
      background: #2ba640;
      color: #fff;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
      vertical-align: middle;
      cursor: default;
      height: 15px;
      line-height: 15px;
    `
    tag.title = 'YouTube Partner Program'
    titleH1.appendChild(tag)
  }

  // RSS button
  const btn = document.createElement('a')
  btn.id = RSS_BTN_ID
  btn.href = '#'
  btn.title = 'View Channel Info'
  btn.innerHTML = RSS_ICON
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    margin-left: 8px;
    color: #909090;
    text-decoration: none;
    cursor: pointer;
    vertical-align: middle;
  `
  btn.addEventListener('mouseenter', () => (btn.style.color = '#f00'))
  btn.addEventListener('mouseleave', () => (btn.style.color = '#909090'))
  btn.addEventListener('click', (e) => {
    e.preventDefault()
    e.stopPropagation()
    showChannelDialog(window.location.href)
  })
  titleH1.appendChild(btn)
}

export default defineContentScript({
  matches: ['https://www.youtube.com/@*', 'https://www.youtube.com/c/*', 'https://www.youtube.com/channel/*'],
  main() {
    // Initial delay to let YouTube SPA render
    setTimeout(injectChannelElements, 1500)

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractChannelData') {
        (async () => {
          try {
            const channelData = await extractChannelData(window.location.href)
            if (channelData) {
              (channelData as any).hasYPP = detectYPP()
            }
            console.log('Extracted channel data:', channelData)
            sendResponse(channelData || {})
          } catch (e) {
            console.error('Error extracting channel data:', e)
            sendResponse({})
          }
        })()
        return true
      }
    })
  },
})
