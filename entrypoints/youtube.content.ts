export default defineContentScript({
    matches: ['https://www.youtube.com/*'],
  
    main() {
      browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
  
              // Extract channel data
              for (const href of uniqueHrefList) {
                label.innerText = `Fetching... (${progress.value}/${progress.max})`
  
                try {
                  const res = await fetch(href)
                  if (!res.ok) continue
  
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

                  const ogTitleMatch = html.match(
                    /<meta\sproperty="og:title"\scontent="([^"]+)"/
                  );
  
                  const channelId = canonicalMatch?.[1] || ''
                  const rssUrl = rssMatch?.[1] || ''
                  const thumbnailUrl = imageMatch?.[1] || ''
                  const ogTitle = ogTitleMatch ? ogTitleMatch[1] : '';
  
                  if (channelId && rssUrl) {
                    channels.push({
                      externalId: channelId,
                      channelUrl: href,
                      title: ogTitle,
                      avatar: {
                        thumbnails: thumbnailUrl ? [{ url: thumbnailUrl }] : [],
                      },
                      ownerUrls: [href],
                      rssUrl: rssUrl,
                      createdAt: new Date().toISOString(),
                      updatedAt: new Date().toISOString(),
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
  