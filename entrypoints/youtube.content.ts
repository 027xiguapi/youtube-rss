import { sendMessage } from '~/utils/messaging'
import { extractChannelData } from '~/utils/youtubeExtractor'

export default defineContentScript({
    matches: ['https://www.youtube.com/*'],

    main() {
      // RSS icon SVG
      const RSS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="6.18" cy="17.82" r="2.18"/><path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/></svg>`

      const showChannelDialog = async (channelLink: HTMLAnchorElement) => {
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

        try {
          const channel = await extractChannelData(channelLink.href)
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
        } catch (err) {
          dialog.innerHTML = `<p style="text-align:center;color:#f66;">Error: ${err}</p>`
        }
      }

      // Add RSS button to channel links in yt-content-metadata-view-model
      const addRssButtons = () => {
        const content = document.getElementById('content')
        if (!content) return

        const viewModels = content.querySelectorAll<HTMLElement>(
          'yt-content-metadata-view-model:not([hidden])'
        )

        for (const viewModel of viewModels) {
          if (viewModel.dataset.rssBtn) continue
          viewModel.dataset.rssBtn = '1'

          const channelLink = viewModel.querySelector<HTMLAnchorElement>('a.ytAttributedStringLink')
          if (!channelLink) continue

          // Only add to channel links (starts with /@ or /channel/)
          const href = channelLink.getAttribute('href') || ''
          if (!/^\/(@|channel\/)/.test(href)) continue

          const rssBtn = document.createElement('a')
          rssBtn.href = '#'
          rssBtn.title = 'View Channel Info'
          rssBtn.innerHTML = RSS_ICON
          rssBtn.style.cssText = `
            display: inline-flex;
            align-items: center;
            margin-left: 6px;
            color: #909090;
            text-decoration: none;
            cursor: pointer;
            vertical-align: text-top;
          `
          rssBtn.addEventListener('mouseenter', () => (rssBtn.style.color = '#f00'))
          rssBtn.addEventListener('mouseleave', () => (rssBtn.style.color = '#909090'))

          rssBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            showChannelDialog(channelLink)
          })

          channelLink.parentElement!.appendChild(rssBtn)
        }
      }

      addRssButtons()

      const observer = new MutationObserver(() => addRssButtons())
      observer.observe(document.body, { childList: true, subtree: true })

      browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === 'exportCookies') {
          try {
            const cookies = document.cookie.split('; ')
            const lines = [
              '# Netscape HTTP Cookie File',
              '# https://curl.haxx.se/rfc/cookie_spec.html',
              '# This is a generated file! Do not edit.',
              ''
            ]

            const domain = '.youtube.com'
            const includeSubdomains = 'TRUE'
            const path = '/'
            const expiration = '1810609496'

            cookies.forEach(cookie => {
              const [name, ...valueParts] = cookie.split('=')
              const value = valueParts.join('=')
              const isSecure = 'TRUE'
              lines.push(`${domain}\t${includeSubdomains}\t${path}\t${isSecure}\t${expiration}\t${name}\t${value}`)
            })

            const content = lines.join('\n')
            const blob = new Blob([content], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `www.youtube.com_cookies_${new Date().getTime()}.txt`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            sendResponse({ success: true })
          } catch (err) {
            sendResponse({ success: false, error: String(err) })
          }
          return true
        }

        if (message.action === 'getChannelsRss') {
           
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
  
              // Get channel elements
              const channelElements = [
                ...content.querySelectorAll<HTMLAnchorElement>('yt-content-metadata-view-model:not([hidden]) a'),
              ]
              const uniqueHrefList = [...new Set(
                channelElements.map(el => el.href)
              )];
  
              progress.max = uniqueHrefList.length
              progress.value = 0
              const channels: any[] = []
              try { 
                const { data } = await sendMessage('BATCH_SEARCH_CHANNELS', uniqueHrefList);

                channels.push(...data.channels)
                // Extract channel data
                for (const href of data.uniqueHrefs) {
                  label.innerText = `Fetching... (${progress.value}/${progress.max})`
    
                  try {
                   const channel = await extractChannelData(href)
                    if (channel?.id) {
                      channels.push({
                        ...channel,
                      })
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
                for (const href of uniqueHrefList) {
                  label.innerText = `Fetching... (${progress.value}/${progress.max})`
    
                  try {
                    const channel = await extractChannelData(href)
                    if (channel?.id) {
                      channels.push({
                        ...channel,
                      })
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
              }
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
  
        if (message.action === 'getChannelLinks') {
          const content = document.getElementById('content')!

          // Get channel elements
          const channelElements = [
            ...content.querySelectorAll<HTMLAnchorElement>('yt-content-metadata-view-model:not([hidden]) a'),
          ]
          const uniqueHrefList = [...new Set(
            channelElements.map(el => el.href).filter(href => href && href !== 'https://www.youtube.com/#')
          )]

          sendResponse({ urls: uniqueHrefList })
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
  