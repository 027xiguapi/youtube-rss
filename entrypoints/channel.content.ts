export default defineContentScript({
  matches: ['https://www.youtube.com/@*', 'https://www.youtube.com/c/*', 'https://www.youtube.com/channel/*'],
  main() {
    browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === 'extractChannelData') {
        (async () => {
          try {
            let channelData: Record<string, any> = {}

            // Extract ytInitialData
            const ytInitialData = getYtInitialData() as any
            if (!ytInitialData) {
              sendResponse(channelData)
              return
            }

            const metadata = ytInitialData.metadata.channelMetadataRenderer;
            if (metadata) {
              channelData = {
                  externalId: metadata.externalId,
                  channelUrl: metadata.channelUrl,
                  title: metadata.title,
                  
                  categories: metadata.keywords, // 关键词通常作为分类参考
                  description: metadata.description,
                  content: metadata.description, // 接口中 content 暂用描述填充
                  
                  avatar: {
                      thumbnails: metadata.avatar?.thumbnails || []
                  },
                  
                  ownerUrls: metadata.ownerUrls || [],
                  rssUrl: metadata.rssUrl,
                  region: metadata.country,
                  
                  // 状态与时间信息
                  hasYPP: !!metadata.isFamilySafe, // 仅作示例参考，实际需要检查 monetization 字段
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString()
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

function getYtInitialData() {
  const scripts = document.querySelectorAll('script');
  let data = null;

  scripts.forEach(script => {
    const text = script.textContent || '';
    if (text.includes('var ytInitialData =')) {
      try {
        const jsonStr = text.split('var ytInitialData =')[1].split(';')[0].trim();
        data = JSON.parse(jsonStr);
      } catch (e) {
        console.error("解析 ytInitialData 失败", e);
      }
    }
  });
  return data;
}
