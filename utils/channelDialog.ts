import { extractChannelData } from '~/utils/youtubeExtractor'

const RSS_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="6.18" cy="17.82" r="2.18"/><path d="M4 4.44v2.83c7.03 0 12.73 5.7 12.73 12.73h2.83c0-8.59-6.97-15.56-15.56-15.56zm0 5.66v2.83c3.9 0 7.07 3.17 7.07 7.07h2.83c0-5.47-4.43-9.9-9.9-9.9z"/></svg>`

function renderChannelFields(channel: NonNullable<Awaited<ReturnType<typeof extractChannelData>>>) {
  const fields: { label: string; value: string }[] = []
  if (channel.id) fields.push({ label: 'Channel ID', value: channel.id })
  if (channel.title) fields.push({ label: 'Title', value: channel.title })
  if (channel.channelUrl) fields.push({ label: 'URL', value: channel.channelUrl })
  if (channel.rssUrl) fields.push({ label: 'RSS Feed', value: channel.rssUrl })

  return fields.map(f => `
    <div style="display:flex;flex-direction:column;gap:2px;">
      <span style="font-size:12px;color:#888;">${f.label}</span>
      <div style="display:flex;align-items:center;gap:6px;">
        <span class="field-value" style="flex:1;word-break:break-all;color:#e0e0e0;cursor:pointer;" data-value="${f.value}" title="Click to copy">${f.value}</span>
        ${f.label === 'URL' ? `<a href="${f.value}" target="_blank" rel="noopener" style="
          color:#909090;text-decoration:none;cursor:pointer;flex-shrink:0;
          display:inline-flex;align-items:center;
        " title="Open in new tab">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>` : ''}
      </div>
    </div>
  `).join('<hr style="border:none;border-top:1px solid #333;margin:4px 0;">')
}

export function showChannelDialog(url: string) {
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

  extractChannelData(url).then(channel => {
    if (!channel) {
      dialog.innerHTML = `<p style="text-align:center;color:#f66;">Failed to fetch channel data</p>`
      return
    }

    dialog.innerHTML = `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <h3 style="margin:0;font-size:16px;color:#fff;">Channel Details</h3>
          <button id="closeBtn" style="
            background:none;border:none;color:#888;font-size:20px;
            cursor:pointer;padding:0;line-height:1;
          ">&times;</button>
        </div>
        ${renderChannelFields(channel)}
        <button id="copyBtn" style="
          margin-top:4px;padding:8px 16px;border-radius:8px;
          border:1px solid #555;background:#333;color:#fff;
          cursor:pointer;font-size:13px;
        ">Copy RSS URL</button>
      </div>
    `

    dialog.querySelector('#closeBtn')!.addEventListener('click', () => { dialog.close(); dialog.remove() })

    // Click field values to copy
    dialog.querySelectorAll<HTMLElement>('.field-value').forEach(el => {
      el.addEventListener('click', async () => {
        const text = el.dataset.value || el.textContent || ''
        await navigator.clipboard.writeText(text)
        const original = el.textContent || ''
        el.textContent = 'Copied!'
        el.style.color = '#2ba640'
        setTimeout(() => { el.textContent = original; el.style.color = '#e0e0e0' }, 1500)
      })
    })
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

export { RSS_ICON }
