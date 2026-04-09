# YouTube Channel RSS Extractor

[English](./README_EN.md) | 中文

一个浏览器扩展，用于从 YouTube 频道页面或订阅页面批量提取 RSS 源和频道元数据。

## 功能

- 自动提取 YouTube 频道的 RSS URL
- 获取频道元数据（频道 ID、标题、订阅者数、描述等）
- 支持从订阅页面批量提取所有订阅频道的 RSS
- 显示频道头像
- 复制 JSON 数据到剪贴板
- 下载频道数据为 JSON 文件
- 快速复制 RSS URL

## 支持的页面

- 单个频道页面：
  - `https://www.youtube.com/@channelhandle`
  - `https://www.youtube.com/c/channelname`
  - `https://www.youtube.com/channel/CHANNEL_ID`
- 订阅页面（批量提取）：
  - `https://www.youtube.com/feed/channels`

## 安装

### 开发模式

1. 安装依赖：
```bash
pnpm install
```

2. 启动开发服务器：
```bash
pnpm dev
```

3. 在浏览器中加载扩展：
   - **Chrome**: 打开 `chrome://extensions/`，启用"开发者模式"，点击"加载已解压的扩展程序"，选择 `.output/chrome-mv3-dev` 文件夹
   - **Firefox**: 打开 `about:debugging#/runtime/this-firefox`，点击"加载临时附加组件"，选择 `.output/firefox-mv3-dev/manifest.json`

### 生产构建

```bash
pnpm build
```

打包为 ZIP：
```bash
pnpm zip
```

## 使用方法

### 单个频道页面

1. 访问任意 YouTube 频道页面
2. 点击扩展图标打开弹窗
3. 扩展会自动提取频道数据
4. 使用以下选项：
   - **Copy JSON** - 复制频道数据到剪贴板
   - **Download JSON** - 下载数据为 JSON 文件
   - **Copy** (RSS URL) - 复制 RSS 源链接
   - **Refresh** - 重新提取数据

### 订阅页面（批量模式）

1. 访问 `https://www.youtube.com/feed/channels`
2. 点击扩展图标打开弹窗
3. 扩展会自动滚动加载所有订阅频道，并逐一提取 RSS
4. 完成后显示所有频道的列表，支持：
   - **Copy All JSON** - 复制全部频道数据
   - **Download All** - 下载全部数据为 JSON
   - 单独复制每个频道的 RSS URL

## 提取的数据

### 单个频道

```json
{
  "urlHandle": "channelhandle",
  "channel_id": "UCxxxxxxxxxxxxxx",
  "title": "Channel Name",
  "subscriber_count": 1000000,
  "description": "Channel description",
  "thumbnail_url": "https://...",
  "video_count": 150,
  "rss_url": "https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxxxxxxxxx"
}
```

### 订阅页面批量提取

```json
{
  "name": "Channel Name",
  "url": "https://www.youtube.com/@channelhandle",
  "rss": "https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxxxxxxxxx",
  "image": "https://yt3.googleusercontent.com/..."
}
```

## 项目结构

```
├── entrypoints/
│   ├── background.ts              # 后台服务脚本
│   ├── channel.content.ts         # 单频道内容脚本
│   ├── feed-channels.content.ts   # 订阅页面批量提取脚本
│   └── popup/
│       ├── App.vue                # 弹窗主组件
│       ├── components/
│       │   ├── ActionBar.vue      # 操作按钮栏
│       │   ├── ChannelCard.vue    # 频道卡片
│       │   ├── ChannelDetail.vue  # 单频道详情
│       │   └── ChannelsList.vue   # 频道列表
│       ├── composables/
│       │   ├── types.ts           # 类型定义
│       │   └── useUtils.ts        # 工具函数
│       └── main.ts                # 弹窗入口
├── utils/
│   └── youtubeExtractor.ts        # YouTube 数据提取工具
├── wxt.config.ts                  # WXT 配置
└── package.json
```

## 技术栈

- **WXT** - 浏览器扩展框架
- **Vue 3** - UI 框架
- **TypeScript** - 类型安全
- **Manifest V3** - 现代扩展标准

## 许可证

MIT
