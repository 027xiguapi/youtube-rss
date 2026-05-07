const YPP_TAG_ID = 'ypp-status-tag'
const RSS_BTN_ID = 'channel-rss-btn'

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

function injectYppTag(hasYPP: boolean) {
  const old = document.getElementById(YPP_TAG_ID)
  if (old) old.remove()

  const tag = document.createElement('span')
  tag.id = YPP_TAG_ID
  tag.textContent = hasYPP ? 'YPP' : ''
  if (!hasYPP) return

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
  `
  tag.title = 'YouTube Partner Program'

  // Try placing after the channel title in the header
  const titleEl = document.querySelector(
    'ytd-channel-name yt-formatted-string#text, #channel-header yt-formatted-string#text'
  )
  if (titleEl) {
    titleEl.parentElement?.style.setProperty('align-items', 'center')
    titleEl.after(tag)
  } else {
    // Fallback: inject near subscribe button area
    const subscribeArea = document.querySelector('#subscribe-button')
    if (subscribeArea) {
      subscribeArea.parentElement?.appendChild(tag)
    }
  }
}

function initYppTag() {
  const hasYPP = detectYPP()
  injectYppTag(hasYPP)

  // Re-check after mutations (SPA navigation)
  const observer = new MutationObserver(() => {
    const hasYPP = detectYPP()
    injectYppTag(hasYPP)
  })
  observer.observe(document.body, { childList: true, subtree: true })
}

const RSS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="6.18" cy="17.82" r="2.18"/><path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/></svg>`

function showChannelDialog() {
  const dialog = document.createElement('dialog')
  dialog.style.cssText = `
    padding: 24px;
    border-radius: 12px;
    border: 1px solid #444;
    background: #1a1a1a;
    color: #e0e0e0;
    max-width: 520px;
    width: 90%;
    z-index: 999999;
    font-size: 14px;
    line-height: 1.6;
  `
  dialog.innerHTML = `<p style="text-align:center;color:#888;">Loading channel info...</p>`
  document.body.appendChild(dialog)
  dialog.showModal()

  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) { dialog.close(); dialog.remove() }
  })

  extractChannelData(window.location.href).then(channel => {
    if (!channel) {
      dialog.innerHTML = `<p style="text-align:center;color:#f66;">Failed to fetch channel data</p>`
      return
    }

    const fields: { label: string; value: string }[] = []
    if (channel.id) fields.push({ label: 'Channel ID', value: channel.id })
    if (channel.title) fields.push({ label: 'Title', value: channel.title })
    if (channel.channelUrl) fields.push({ label: 'URL', value: channel.channelUrl })
    if (channel.rssUrl) fields.push({ label: 'RSS Feed', value: channel.rssUrl })

    const fieldHtml = fields.map(f => `
      <div style="display:flex;flex-direction:column;gap:2px;">
        <span style="font-size:12px;color:#888;">${f.label}</span>
        <span style="word-break:break-all;color:#e0e0e0;">${f.value}</span>
      </div>
    `).join('<hr style="border:none;border-top:1px solid #333;margin:4px 0;">')

    dialog.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:16px;color:#fff;">Channel Details</h3>
          <button id="closeBtn" style="
            background:none;border:none;color:#888;font-size:20px;
            cursor:pointer;padding:0;line-height:1;
          ">&times;</button>
        </div>
        ${fieldHtml}
        <button id="copyBtn" style="
          margin-top:4px;padding:8px 16px;border-radius:8px;
          border:1px solid #555;background:#333;color:#fff;
          cursor:pointer;font-size:13px;
        ">Copy RSS URL</button>
      </div>
    `

    dialog.querySelector('#closeBtn')!.addEventListener('click', () => { dialog.close(); dialog.remove() })
    dialog.querySelector('#copyBtn')!.addEventListener('click', async () => {
      if (channel.rssUrl) {
        await navigator.clipboard.writeText(channel.rssUrl)
        const btn = dialog.querySelector('#copyBtn')!
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Copy RSS URL' }, 2000)
      }
    })
  }).catch(err => {
    dialog.innerHTML = `<p style="text-align:center;color:#f66;">Error: ${err}</p>`
  })
}

function injectRssBtn() {
  const old = document.getElementById(RSS_BTN_ID)
  if (old) old.remove()

  const titleH1 = document.querySelector('yt-dynamic-text-view-model h1.dynamicTextViewModelH1')
  if (!titleH1) return
  if (titleH1.querySelector(`#${RSS_BTN_ID}`)) return

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
    showChannelDialog()
  })

  titleH1.appendChild(btn)
}

function initRssBtn() {
  injectRssBtn()
  const observer = new MutationObserver(() => injectRssBtn())
  observer.observe(document.body, { childList: true, subtree: true })
}

export default defineContentScript({
  matches: ['https://www.youtube.com/@*', 'https://www.youtube.com/c/*', 'https://www.youtube.com/channel/*'],
  main() {
    // Initial delay to let YouTube SPA render
    setTimeout(initYppTag, 1500)
    setTimeout(initRssBtn, 1500)

    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractChannelData') {
        (async () => {
          try {
            let channelData: Record<string, any> = {}

            // 获取当前页面 HTML
            const res = await fetch(window.location.href)
            if (!res.ok) {
              sendResponse({})
              return
            }

            const html = await res.text()

            const rssMatch = html.match(
              /<link\srel="alternate"\stype="application\/rss\+xml"\stitle="RSS"\shref="(.+?)"/
            )
            const imageMatch = html.match(
              /<link\srel="image_src"\shref="(.+?)"/
            )
            const canonicalMatch = html.match(
              /<link\srel="canonical"\shref="https:\/\/www\.youtube\.com\/channel\/([^"]+)"/
            )

            const channelId = canonicalMatch?.[1] || ''
            const rssUrl = rssMatch?.[1] || ''
            const thumbnailUrl = imageMatch?.[1] || ''

            if (channelId && rssUrl) {
              channelData = {
                id: channelId,
                channelUrl: window.location.href,
                title: document.title,
                avatar: {
                  thumbnails: thumbnailUrl ? [{ url: thumbnailUrl }] : [],
                },
                ownerUrls: [window.location.href],
                rssUrl: rssUrl,
                hasYPP: detectYPP(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
            }

            console.log('Extracted channel data:', channelData)
            sendResponse(channelData)
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
