export interface ChannelData {
  id?: string
  // 频道ID
  externalId?: string
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

// {
//     "externalId": "UCjY_1EGLMHeijGkV1khlPDg",
//     "channelUrl": "https://www.youtube.com/channel/UCjY_1EGLMHeijGkV1khlPDg",
//     "title": "metrolinehub",
//     "categories": "",
//     "description": "Explore Global Subway Maps\nExplore subway line maps from around the world, including major urban subway systems in Asia, Europe, America, Africa, and Oceania.\n",
//     "content": "Explore Global Subway Maps\nExplore subway line maps from around the world, including major urban subway systems in Asia, Europe, America, Africa, and Oceania.\n",
//     "avatar": {
//         "thumbnails": [
//             {
//                 "url": "https://yt3.googleusercontent.com/CFuZXh12pXPUMK6bBKKB6e3FPWixAvjqfPku4LjO8dPiUTwcSZmWiRpD6Jlm0s-AwLknyriHRQ=s900-c-k-c0x00ffffff-no-rj",
//                 "width": 900,
//                 "height": 900
//             }
//         ]
//     },
//     "ownerUrls": [
//         "http://www.youtube.com/@metrolinehub"
//     ],
//     "rssUrl": "https://www.youtube.com/feeds/videos.xml?channel_id=UCjY_1EGLMHeijGkV1khlPDg",
//     "hasYPP": true,
//     "createdAt": "2026-04-10T06:55:50.698Z",
//     "updatedAt": "2026-04-10T06:55:50.698Z"
// }

// 频道缩略图数据结构
export interface avatarData {
  thumbnails?: {
    url: string
    width: number
    height: number
  }[]
}