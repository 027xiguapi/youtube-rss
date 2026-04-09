export default defineContentScript({
  matches: ['https://www.youtube.com/@*', 'https://www.youtube.com/c/*', 'https://www.youtube.com/channel/*'],
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractChannelData') {
        (async () => {
          console.log('Received extractChannelData message');
          const channelData: Record<string, any> = {};

          // Extract channelId from URL or page data
          const urlMatch = window.location.href.match(/(?:@|\/c\/|\/channel\/)([^/?]+)/)
          if (urlMatch) {
            channelData.urlHandle = urlMatch[1]
          }

          // Try to get channelId from ytInitialData
          let ytInitialData = null
          const scripts = document.querySelectorAll('script')
          for (const script of scripts) {
            if (script.textContent?.includes('var ytInitialData')) {
              try {
                const match = script.textContent.match(/var ytInitialData = ({.*?});/s)
                if (match) {
                  ytInitialData = JSON.parse(match[1])
                  break
                }
              } catch (e) {
                console.error('Failed to parse ytInitialData:', e)
              }
            }
          }

          // Extract channel metadata
          if (ytInitialData) {
            try {
              const header =
                ytInitialData.header?.c4TabbedHeaderRenderer || ytInitialData.header?.pageHeaderRenderer

              if (header?.channelId) {
                channelData.channel_id = header.channelId
              }

              if (header?.title?.simpleText) {
                channelData.title = header.title.simpleText
              }

              if (header?.subtitle?.runs?.[0]?.text) {
                const text = header.subtitle.runs[0].text
                const match = text.match(/([\d.]+)\s*([KMB]?)/)
                if (match) {
                  let count = parseFloat(match[1])
                  const unit = match[2]
                  if (unit === 'K') count *= 1000
                  else if (unit === 'M') count *= 1000000
                  else if (unit === 'B') count *= 1000000000
                  channelData.subscriber_count = Math.floor(count)
                }
              }

              if (header?.description?.simpleText) {
                channelData.description = header.description.simpleText
              }

              // Extract thumbnail
              const thumbnail = header?.avatar?.thumbnails?.[header.avatar.thumbnails.length - 1]
              if (thumbnail?.url) {
                channelData.thumbnail_url = thumbnail.url
              }

              // Extract video count from tabs
              const tabs = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs || []
              for (const tab of tabs) {
                const tabRenderer = tab.tabRenderer
                if (tabRenderer?.content?.sectionListRenderer?.contents) {
                  const contents = tabRenderer.content.sectionListRenderer.contents
                  for (const content of contents) {
                    const itemSectionRenderer = content.itemSectionRenderer
                    if (itemSectionRenderer?.contents?.[0]?.gridRenderer?.items) {
                      channelData.video_count = itemSectionRenderer.contents[0].gridRenderer.items.length
                    }
                  }
                }
              }
            } catch (e) {
              console.error('Error extracting from ytInitialData:', e)
            }
          }

          // Extract RSS URL from page HTML
          const rssLink = document.querySelector('link[rel="alternate"][type="application/rss+xml"]') as any
          if (rssLink) {
            channelData.rss_url = rssLink.href
          }

          // Extract image and title from meta tags
          const ogImage = document.querySelector('meta[property="og:image"]')
          if (ogImage) {
            channelData.image = ogImage.getAttribute('content')
          }

          const ogTitle = document.querySelector('meta[property="og:title"]')
          if (ogTitle) {
            channelData.title = ogTitle.getAttribute('content')
          }

          console.log('Extracted channel data:', channelData)
          sendResponse(channelData)
        })()
      }
    })
  },
})
