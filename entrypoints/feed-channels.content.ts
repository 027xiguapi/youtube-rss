import { extractChannelData } from '~/utils/youtubeExtractor'
import { sendMessage } from '~/utils/messaging'

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

function generateOPML(channels: { title?: string; id?: string; rssUrl?: string; channelUrl?: string }[]): string {
  const items = channels.map(ch => {
    const title = escapeXml(ch.title || ch.id || 'Unknown')
    const xmlUrl = escapeXml(ch.rssUrl || `https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`)
    const htmlUrl = escapeXml(ch.channelUrl || `https://www.youtube.com/channel/${ch.id}`)
    return `    <outline text="${title}" title="${title}" type="rss" xmlUrl="${xmlUrl}" htmlUrl="${htmlUrl}"/>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>YouTube Subscriptions</title>
    <dateCreated>${new Date().toISOString()}</dateCreated>
  </head>
  <body>
${items}
  </body>
</opml>`
}

function downloadOPML(opml: string) {
  const blob = new Blob([opml], { type: 'application/xml' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `youtube-subscriptions-${Date.now()}.opml`
  a.click()
  URL.revokeObjectURL(url)
}

function injectGetRssButton() {
  const titleH1 = document.querySelector<HTMLElement>(
    'yt-dynamic-text-view-model h1.dynamicTextViewModelH1'
  )
  if (!titleH1) return

  const existingBtn = document.getElementById('get-all-rss-btn')
  if (existingBtn) existingBtn.remove()

  const btn = document.createElement('button')
  btn.id = 'get-all-rss-btn'
  btn.textContent = '一键获取 RSS'
  btn.style.cssText = `
    display: inline-flex;
    align-items: center;
    margin-left: 8px;
    padding: 4px 12px;
    border-radius: 4px;
    border: 1px solid #555;
    background: #333;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    vertical-align: middle;
    height: 24px;
    line-height: 1;
    white-space: nowrap;
  `
  btn.addEventListener('mouseenter', () => { btn.style.background = '#555' })
  btn.addEventListener('mouseleave', () => { btn.style.background = '#333' })

  btn.addEventListener('click', async () => {
    btn.disabled = true
    btn.textContent = '获取中...'
    btn.style.opacity = '0.6'
    btn.style.cursor = 'not-allowed'

    const dialog = document.createElement('dialog')
    const label = document.createElement('label')
    const progress = document.createElement('progress')

    dialog.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 15px;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #444;
      background: #1a1a1a;
      color: #e0e0e0;
      z-index: 999999;
    `
    progress.style.width = '300px'

    dialog.appendChild(label)
    dialog.appendChild(progress)
    document.body.appendChild(dialog)
    dialog.showModal()

    label.innerText = '加载订阅列表中...'

    try {
      const content = document.getElementById('content')!
      let contentH: number

      // Auto-scroll to load all channels
      do {
        contentH = content.offsetHeight
        window.scrollBy(0, 100000)
        await new Promise((r) => setTimeout(r, 500))
      } while (
        content.querySelector('#spinnerContainer.active') != null ||
        content.offsetHeight > contentH
      )

      const channelElements = [
        ...content.querySelectorAll<HTMLAnchorElement>(
          'ytd-browse:not([hidden]) #main-link.channel-link'
        ),
      ]

      const channelUrls = channelElements.map(e => e.href)

      // 1. Query DB for existing channels
      label.innerText = '查询数据库中...'
      const searchResult: any = await sendMessage('BATCH_SEARCH_CHANNELS', channelUrls)
      const existingMap = new Map<string, any>()
      if (searchResult?.success && Array.isArray(searchResult.data)) {
        for (const ch of searchResult.data) {
          if (ch.channelUrl) existingMap.set(ch.channelUrl, ch)
        }
      }

      // 2. Only extract new channels
      const newElements = channelElements.filter(e => !existingMap.has(e.href))
      const allChannels: any[] = [...existingMap.values()]

      if (newElements.length > 0) {
        progress.max = newElements.length
        progress.value = 0

        for (const e of newElements) {
          label.innerText = `获取中... (${progress.value}/${progress.max})`

          try {
            const channelData = await extractChannelData(e.href)
            if (channelData) {
              allChannels.push(channelData)
            }
          } catch (err) {
            console.error(err)
          } finally {
            progress.value++
          }
        }

        // Save new channels
        const newData = allChannels.slice(existingMap.size)
        if (newData.length > 0) {
          label.innerText = '保存新频道中...'
          await sendMessage('BATCH_SAVE_CHANNELS', newData)
        }
      }

      if (allChannels.length === 0) {
        label.innerText = '未找到频道数据'
      } else {
        // 3. Generate OPML and show action buttons
        const opml = generateOPML(allChannels)
        const rssUrls = allChannels.map(ch => ch.rssUrl).filter(Boolean).join('\n')

        // Remove progress bar, show buttons instead
        progress.remove()

        const btnGroup = document.createElement('div')
        btnGroup.style.cssText = `
          display: flex;
          gap: 10px;
          justify-content: center;
          margin-top: 4px;
        `

        const copyBtn = document.createElement('button')
        copyBtn.textContent = '复制 RSS 链接'
        copyBtn.style.cssText = `
          flex: 1; padding: 8px 16px; border-radius: 8px;
          border: 1px solid #555; background: #333; color: #fff;
          cursor: pointer; font-size: 13px; font-weight: 600;
        `
        copyBtn.addEventListener('mouseenter', () => { copyBtn.style.background = '#555' })
        copyBtn.addEventListener('mouseleave', () => { copyBtn.style.background = '#333' })
        copyBtn.addEventListener('click', async () => {
          await navigator.clipboard.writeText(rssUrls)
          copyBtn.textContent = '已复制！'
          copyBtn.style.background = '#2ba640'
          setTimeout(() => {
            copyBtn.textContent = '复制 RSS 链接'
            copyBtn.style.background = '#333'
          }, 2000)
        })

        const downloadBtn = document.createElement('button')
        downloadBtn.textContent = '下载 OPML'
        downloadBtn.style.cssText = `
          flex: 1; padding: 8px 16px; border-radius: 8px;
          border: none; background: #2ba640; color: #fff;
          cursor: pointer; font-size: 13px; font-weight: 600;
        `
        downloadBtn.addEventListener('mouseenter', () => { downloadBtn.style.background = '#1e8630' })
        downloadBtn.addEventListener('mouseleave', () => { downloadBtn.style.background = '#2ba640' })
        downloadBtn.addEventListener('click', () => {
          downloadOPML(opml)
          downloadBtn.textContent = '已下载！'
          setTimeout(() => { downloadBtn.textContent = '下载 OPML' }, 2000)
        })

        btnGroup.appendChild(copyBtn)
        btnGroup.appendChild(downloadBtn)
        dialog.appendChild(btnGroup)

        label.innerText = `共 ${allChannels.length} 个频道（新 ${newElements.length} 个）`
      }
    } catch (err) {
      console.error(err)
      label.innerText = `错误: ${err}`
    } finally {
      btn.disabled = false
      btn.textContent = '一键获取 RSS'
      btn.style.opacity = '1'
      btn.style.cursor = 'pointer'
      setTimeout(() => {
        dialog.close()
        dialog.remove()
      }, 3000)
    }
  })

  titleH1.appendChild(btn)
}

export default defineContentScript({
  matches: ['https://www.youtube.com/feed/channels*'],

  main() {
    const run = () => setTimeout(injectGetRssButton, 1500)

    // Initial load
    run()

    // Re-run on YouTube SPA navigation
    document.addEventListener('yt-navigate-finish', run)

    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'extractChannelsRss') {
        (async () => {
          const dialog = document.createElement('dialog')
          const label = document.createElement('label')
          const progress = document.createElement('progress')

          dialog.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            padding: 20px;
            border-radius: 12px;
            z-index: 999999;
          `

          progress.style.width = '300px'

          dialog.appendChild(label)
          dialog.appendChild(progress)

          document.body.appendChild(dialog)
          dialog.showModal()

          label.innerText = 'Loading subscriptions...'

          try {
            const content = document.getElementById('content')!
            let contentH: number

            // Auto-scroll to load all channels
            do {
              contentH = content.offsetHeight
              window.scrollBy(0, 100000)
              await new Promise((r) => setTimeout(r, 500))
            } while (
              content.querySelector('#spinnerContainer.active') != null ||
              content.offsetHeight > contentH
            )

            // Get channel elements
            const channelElements = [
              ...content.querySelectorAll<HTMLAnchorElement>(
                'ytd-browse:not([hidden]) #main-link.channel-link'
              ),
            ]

            progress.max = channelElements.length
            progress.value = 0

            const channels: any[] = []

            // Extract channel data
            for (const e of channelElements) {
              label.innerText = `Fetching... (${progress.value}/${progress.max})`

              try {
                const channelData = await extractChannelData(e.href)
                if (channelData) {
                  channels.push(channelData)
                }
              } catch (err) {
                console.error(err)
              } finally {
                progress.value++
              }
            }

            sendResponse({
              success: true,
              channels: channels,
            })
          } catch (err) {
            console.error(err)
            sendResponse({
              success: false,
              error: String(err),
              channels: [],
            })
          } finally {
            setTimeout(() => {
              dialog.close()
              dialog.remove()
            }, 500)
          }
        })()
        return true
      }

      if (message.action === 'getChannelUrls') {
        const content = document.getElementById('content')!
        const channelElements = [
          ...content.querySelectorAll<HTMLAnchorElement>(
            'ytd-browse:not([hidden]) #main-link.channel-link'
          ),
        ]

        const channelUrls: any[] = []
        for (const e of channelElements) {
          channelUrls.push(e.href)
        }
        sendResponse(channelUrls)
        return true
      }
    })
  },
})
