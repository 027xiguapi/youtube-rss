export default defineContentScript({
  matches: ['https://www.youtube.com/@*', 'https://www.youtube.com/c/*', 'https://www.youtube.com/channel/*'],
  main() {
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
