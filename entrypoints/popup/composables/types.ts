export interface ChannelData {
  urlHandle?: string
  channel_id?: string
  title?: string
  subscriber_count?: number
  description?: string
  thumbnail_url?: string
  video_count?: number
  rss_url?: string
  channel_created_at?: string
  image?: string
  og_image?: string
  og_title?: string
}

export interface FeedChannel {
  name: string
  url: string
  rss: string
  image: string
}
