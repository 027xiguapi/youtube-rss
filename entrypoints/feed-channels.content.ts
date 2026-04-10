export default defineContentScript({
  matches: ['https://www.youtube.com/feed/channels*'],

  main() {
    browser.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      if (message.action === 'extractChannelsRss') {
        (async () => {
          // ========================
          // ✅ 创建进度弹窗
          // ========================
          const dialog = document.createElement('dialog');
          const label = document.createElement('label');
          const progress = document.createElement('progress');
  
          dialog.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 15px;
            padding: 20px;
            border-radius: 12px;
            z-index: 999999;
          `;
  
          progress.style.width = '300px';
  
          dialog.appendChild(label);
          dialog.appendChild(progress);
  
          document.body.appendChild(dialog);
          dialog.showModal();
  
          label.innerText = 'Loading subscriptions...';
  
          try {
            const content = document.getElementById('content')!;
            let contentH: number;
  
            // ========================
            // ✅ 自动滚动加载
            // ========================
            do {
              contentH = content.offsetHeight;
              window.scrollBy(0, 100000);
              await new Promise((r) => setTimeout(r, 500));
            } while (
              content.querySelector('#spinnerContainer.active') != null ||
              content.offsetHeight > contentH
            );
  
            // ========================
            // ✅ 获取频道列表
            // ========================
            const channelElements = [
              ...content.querySelectorAll<HTMLAnchorElement>(
                'ytd-browse:not([hidden]) #main-link.channel-link'
              ),
            ];
  
            progress.max = channelElements.length;
            progress.value = 0;
  
            const channels: any[] = [];
  
            // ========================
            // ✅ 遍历抓取
            // ========================
            for (const e of channelElements) {
              label.innerText = `Fetching... (${progress.value}/${progress.max})`;
  
              try {
                const channelName =
                  e.querySelector('yt-formatted-string.ytd-channel-name')?.textContent || '';
  
                const res = await fetch(e.href);
                if (!res.ok) continue;
  
                const html = await res.text();
  
                // 👉 RSS
                const rssMatch = html.match(
                  /<link[^>]+rel=["']alternate["'][^>]+type=["']application\/rss\+xml["'][^>]+href=["'](.+?)["']/
                );
  
                // 👉 image_src
                const imageMatch = html.match(
                  /<link[^>]+rel=["']image_src["'][^>]+href=["'](.+?)["']/
                );
  
                // 👉 fallback og:image
                const ogImageMatch = html.match(
                  /<meta property=["']og:image["'] content=["'](.+?)["']/
                );
  
                const image =
                  imageMatch?.[1] ||
                  ogImageMatch?.[1] ||
                  '';
  
                channels.push({
                  title: channelName,
                  rssUrl: rssMatch?.[1] || '',
                  thumbnailUrl: image,
                });
              } catch (err) {
                console.error(err);
              } finally {
                progress.value++;
              }
            }
  
            // ========================
            // ✅ 返回数据
            // ========================
            sendResponse({
              success: true,
              total: channelElements.length,
              fetched: channels.length,
              channels,
            });
  
          } catch (err) {
            console.error(err);
            sendResponse({
              success: false,
              error: String(err),
            });
          } finally {
            // ========================
            // ✅ 关闭弹窗
            // ========================
            setTimeout(() => {
              dialog.close();
              dialog.remove();
            }, 500);
          }
        })();
      // ⚠️ 必须 return true（异步）
      return true;
      }
    });
  },
});