export default defineContentScript({
  matches: ['https://www.youtube.com/feed/channels*'],
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractChannelsRss') {
        (async () => {
          console.log('Received extractChannelsRss message');
          const channelsData: any[] = [];

          try {
            // Step 1: Wait for page to load
            await new Promise(r => setTimeout(r, 2000));

            // Step 2: Force scroll to load all channels (lazy loading)
            console.log('Starting scroll to load all channels...');
            let lastHeight = 0;
            let scrollAttempts = 0;
            const maxScrollAttempts = 50;

            while (scrollAttempts < maxScrollAttempts) {
              const currentHeight = document.documentElement.scrollHeight;

              // Check if spinner is still active (loading indicator)
              const spinner = document.querySelector('#spinnerContainer.active');
              if (!spinner && currentHeight === lastHeight) {
                console.log('All channels loaded');
                break;
              }

              window.scrollBy(0, 100000);
              lastHeight = currentHeight;
              scrollAttempts++;

              // Wait for content to load
              await new Promise(r => setTimeout(r, 500));
            }

            // Step 3: Extract ytInitialData
            let ytInitialData = null;
            const scripts = document.querySelectorAll('script');
            for (const script of scripts) {
              if (script.textContent?.includes('var ytInitialData')) {
                try {
                  const match = script.textContent.match(/var ytInitialData = ({.*?});/s);
                  if (match) {
                    ytInitialData = JSON.parse(match[1]);
                    break;
                  }
                } catch (e) {
                  console.error('Failed to parse ytInitialData:', e);
                }
              }
            }

            // Step 4: Extract channels from ytInitialData
            if (ytInitialData) {
              try {
                const tabs = ytInitialData.contents?.twoColumnBrowseResultsRenderer?.tabs || [];

                for (const tab of tabs) {
                  const tabRenderer = tab.tabRenderer;
                  if (tabRenderer?.content?.sectionListRenderer?.contents) {
                    const contents = tabRenderer.content.sectionListRenderer.contents;

                    for (const content of contents) {
                      const itemSectionRenderer = content.itemSectionRenderer;
                      if (itemSectionRenderer?.contents) {
                        for (const item of itemSectionRenderer.contents) {
                          if (item.gridRenderer?.items) {
                            for (const gridItem of item.gridRenderer.items) {
                              const channelData = extractChannelFromGridItem(gridItem);
                              if (channelData) {
                                channelsData.push(channelData);
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              } catch (e) {
                console.error('Error extracting from ytInitialData:', e);
              }
            }

            // Step 5: Fetch additional data (RSS URL, image, title) from each channel page
            console.log(`Fetching detailed data for ${channelsData.length} channels...`);
            for (let i = 0; i < channelsData.length; i++) {
              const channel = channelsData[i];
              if (channel.channel_id) {
                try {
                  const channelUrl = `https://www.youtube.com/channel/${channel.channel_id}`;
                  const response = await fetch(channelUrl);
                  if (response.ok) {
                    const html = await response.text();
                    const parser = new DOMParser();
                    const doc = parser.parseFromString(html, 'text/html');

                    // Extract RSS URL
                    const rssLink = doc.querySelector('link[rel="alternate"][type="application/rss+xml"]') as any;
                    if (rssLink) {
                      channel.rss_url = rssLink.href;
                    }

                    // Extract image from meta tag
                    const ogImage = doc.querySelector('meta[property="og:image"]');
                    if (ogImage) {
                      channel.image = ogImage.getAttribute('content');
                    }

                    // Extract title from meta tag (fallback if not already set)
                    if (!channel.title) {
                      const ogTitle = doc.querySelector('meta[property="og:title"]');
                      if (ogTitle) {
                        channel.title = ogTitle.getAttribute('content');
                      }
                    }
                  }
                } catch (e) {
                  console.error(`Error fetching channel ${channel.channel_id}:`, e);
                }
              }
            }

            // Step 5: Fallback - extract from DOM if ytInitialData parsing fails
            if (channelsData.length === 0) {
              console.log('Fallback: extracting from DOM...');
              const channelLinks = document.querySelectorAll('a[href*="/channel/"], a[href*="/@"]');
              const uniqueChannels = new Set<string>();

              for (const link of channelLinks) {
                const href = link.getAttribute('href');
                if (href) {
                  const match = href.match(/(?:\/channel\/|@)([^/?]+)/);
                  if (match) {
                    uniqueChannels.add(match[1]);
                  }
                }
              }

              for (const channelHandle of uniqueChannels) {
                const channelData: any = {
                  urlHandle: channelHandle,
                  rss_url: `https://www.youtube.com/feeds/videos.xml?channel_id=${channelHandle}`,
                };
                channelsData.push(channelData);
              }
            }

            console.log(`Extracted ${channelsData.length} channels`, channelsData);
            sendResponse({ channels: channelsData, total: channelsData.length });
          } catch (e) {
            console.error('Error in extractChannelsRss:', e);
            sendResponse({
              channels: [],
              total: 0,
              error: e instanceof Error ? e.message : 'Unknown error',
            });
          }
        })();
        return true; // Keep the message channel open for async response
      }
    });
  },
});

function extractChannelFromGridItem(gridItem: any): any | null {
  try {
    const channelRenderer = gridItem.gridChannelRenderer;
    if (!channelRenderer) return null;

    const channelData: any = {};

    if (channelRenderer.channelId) {
      channelData.channel_id = channelRenderer.channelId;
    }

    if (channelRenderer.title?.simpleText) {
      channelData.title = channelRenderer.title.simpleText;
    }

    if (channelRenderer.subscriberCountText?.simpleText) {
      const text = channelRenderer.subscriberCountText.simpleText;
      const match = text.match(/([\d.]+)\s*([KMB]?)/);
      if (match) {
        let count = parseFloat(match[1]);
        const unit = match[2];
        if (unit === 'K') count *= 1000;
        else if (unit === 'M') count *= 1000000;
        else if (unit === 'B') count *= 1000000000;
        channelData.subscriber_count = Math.floor(count);
      }
    }

    if (channelRenderer.thumbnail?.thumbnails) {
      const thumbnail =
        channelRenderer.thumbnail.thumbnails[channelRenderer.thumbnail.thumbnails.length - 1];
      if (thumbnail?.url) {
        channelData.thumbnail_url = thumbnail.url;
      }
    }

    if (channelRenderer.videoCountText?.simpleText) {
      const match = channelRenderer.videoCountText.simpleText.match(/(\d+)/);
      if (match) {
        channelData.video_count = parseInt(match[1]);
      }
    }

    if (channelRenderer.descriptionSnippet?.simpleText) {
      channelData.description = channelRenderer.descriptionSnippet.simpleText;
    }

    if (channelData.channel_id) {
      channelData.rss_url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelData.channel_id}`;
    }

    return channelData;
  } catch (e) {
    console.error('Error extracting channel from grid item:', e);
    return null;
  }
}
