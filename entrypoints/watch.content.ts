const RSS_BTN_ID = 'channel-rss-btn'
const STATS_WRAPPER_ID = 'video-stats-wrapper'

import { showChannelDialog, RSS_ICON } from '~/utils/channelDialog'
import { extractChannelData } from '~/utils/youtubeExtractor'
import { sendMessage } from '~/utils/messaging'

function getViewsAndEstimateRevenue() {
  const viewText = document.querySelector('ytd-video-primary-info-renderer .view-count')?.textContent || '';
  const views = parseInt(viewText.replace(/[^0-9]/g, ''), 10);

  if (isNaN(views)) {
    console.log('无法获取播放量');
    return null;
  }

  const rpmLow = 1;
  const rpmHigh = 5;
  const revenueLow = (views / 1000) * rpmLow;
  const revenueHigh = (views / 1000) * rpmHigh;

  return { views, revenueLow, revenueHigh };
}

function checkVideoMonetization(): boolean {
  const hasAdElement = !!document.querySelector(
    '.ytp-ad-player-overlay, .ytp-ad-text, #visit-advertiser'
  )
  const hasAdLabel = Array.from(
    document.querySelectorAll('.style-scope .ytd-video-secondary-info-renderer')
  ).some(el => el.textContent?.includes('广告') || el.textContent?.includes('Ad'))
  const hasMonetIcon = !!document.querySelector(
    'ytd-video-primary-info-renderer .style-scope.ytd-badge-supported-renderer'
  )
  return hasAdElement || hasAdLabel || hasMonetIcon
}

function injectChannelElements() {
  const oldBtn = document.getElementById(RSS_BTN_ID)
  if (oldBtn) oldBtn.remove()
  const oldWrapper = document.getElementById(STATS_WRAPPER_ID)
  if (oldWrapper) oldWrapper.remove()

  const container = document.querySelector('ytd-channel-name #container')
  if (!container) return

  const isMonetized = checkVideoMonetization()
  const stats = getViewsAndEstimateRevenue()

  // Stats wrapper (ad badge + view count / revenue)
  const wrapper = document.createElement('span')
  wrapper.id = STATS_WRAPPER_ID
  wrapper.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: 0;
    margin-left: 8px;
    vertical-align: middle;
    border-radius: 4px;
    overflow: hidden;
    height: 19px;
  `

  const badge = document.createElement('span')
  badge.textContent = isMonetized ? 'Ads' : 'No Ads'
  badge.style.cssText = `
    display: inline-flex;
    align-items: center;
    padding: 0 8px;
    background: ${isMonetized ? '#2ba640' : '#555'};
    color: #fff;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.5px;
    height: 100%;
    line-height: 19px;
    cursor: default;
  `
  badge.title = isMonetized ? 'Video has ad monetization enabled' : 'No ads detected on this video'
  wrapper.appendChild(badge)

  if (stats) {
    const revText = document.createElement('span')
    revText.textContent = `${stats.views.toLocaleString()} views | Est. $${stats.revenueLow.toFixed(2)}–$${stats.revenueHigh.toFixed(2)}`
    revText.style.cssText = `
      display: inline-flex;
      align-items: center;
      padding: 0 8px;
      background: #333;
      color: #aaa;
      font-size: 11px;
      font-weight: 500;
      height: 100%;
      line-height: 19px;
      cursor: default;
    `
    revText.title = 'Estimated revenue (RPM $1–$5)'
    wrapper.appendChild(revText)
  }

  container.appendChild(wrapper)

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
    const channelLink = document.querySelector<HTMLAnchorElement>('ytd-channel-name #text-container yt-formatted-string#text a')
    const channelUrl = channelLink?.href || window.location.href
    showChannelDialog(channelUrl)
  })
  container.appendChild(btn)

  // Extract and auto-save channel data
  const channelLink = document.querySelector<HTMLAnchorElement>('ytd-channel-name #text-container yt-formatted-string#text a')
  const channelUrl = channelLink?.href
  if (channelUrl) {
    extractChannelData(channelUrl).then(channel => {
      if (channel) {
        sendMessage('BATCH_SAVE_CHANNELS', [channel])
          .catch(err => console.error('Failed to auto-save channel:', err))
      }
    })
  }
}

export default defineContentScript({
  matches: ['https://www.youtube.com/watch?v=*'],
  main() {
    const run = () => setTimeout(injectChannelElements, 1500)

    // Initial load
    run()

    // Re-run on YouTube SPA navigation
    document.addEventListener('yt-navigate-finish', run)
  },
})
