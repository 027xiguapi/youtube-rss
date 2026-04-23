export interface ChannelData {
  // 频道ID
  id?: string
  // 频道链接
  channelUrl?: string
  // 频道名称
  title?: string
  // 订阅者数量
  subscriberCount?: number
  // 视频数量
  videoCount?: number
  // 频道分类
  categories?: string
  // 频道描述
  description?: string
  // 频道内容
  content?: string
  // 频道缩略图
  avatar?: avatarData
  // 拥有频道链接
  ownerUrls?: string[]
  // 频道rss链接
  rssUrl?: string
  // 频道地区
  region?: string
  // 频道创建时间
  channelCreatedAt?: string
  // 频道是否启用YouTube合作伙伴计划
  hasYPP?: boolean
  // 数据创建时间
  createdAt?: string
  // 数据修改时间
  updatedAt?: string
}

// 频道缩略图数据结构
export interface avatarData {
  thumbnails?: {
    url: string
    width: number
    height: number
  }[]
}