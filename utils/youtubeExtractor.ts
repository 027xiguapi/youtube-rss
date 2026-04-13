export async function extractChannelData(href: string) {
  const res = await fetch(href)
  if (!res.ok) return null

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
    return {
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
    }
  }
}
