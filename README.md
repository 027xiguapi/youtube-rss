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
- 导出 YouTube Cookies（Netscape 格式）
- 快速打开频道链接

## 支持的页面

- 单个频道页面：
  - `https://www.youtube.com/@channelhandle`
  - `https://www.youtube.com/c/channelname`
  - `https://www.youtube.com/channel/CHANNEL_ID`
- 订阅页面（批量提取）：
  - `https://www.youtube.com/feed/channels`

## 安装

### Chrome Web Store

[在 Chrome Web Store 安装](https://chromewebstore.google.com/detail/youtube-rss-extractor/cjljpiaogilmoaffnbfmaaagpmndjfmh)

### GitHub

[项目地址](https://github.com/027xiguapi/youtube-rss)

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
4. 在 **Channels** 选项卡中使用以下选项：
   - **Fetch RSS Data** - 获取新鲜 RSS 数据
   - **Download OPML** - 下载 OPML 文件
5. 在 **Tools** 选项卡中：
   - **Export YouTube Cookies** - 导出 YouTube Cookies（Netscape 格式）
   - **Channel Links** - 快速打开频道链接

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
│   ├── youtube.content.ts         # YouTube 页面内容脚本
│   ├── channel.content.ts         # 单频道内容脚本
│   ├── feed-channels.content.ts   # 订阅页面批量提取脚本
│   └── popup/
│       ├── App.vue                # 弹窗主组件（标签页导航）
│       ├── components/
│       │   ├── ChannelsTab.vue    # 频道选项卡
│       │   ├── ToolsTab.vue       # 工具选项卡
│       │   ├── SettingsTab.vue    # 设置选项卡
│       │   ├── ChannelsList.vue   # 频道列表
│       │   ├── ChannelCard.vue    # 频道卡片
│       │   ├── ChannelDetail.vue  # 单频道详情
│       │   └── ActionBar.vue      # 操作按钮栏
│       ├── composables/
│       │   ├── types.ts           # 类型定义
│       │   ├── useUtils.ts        # 工具函数
│       │   └── useI18n.ts         # 国际化
│       ├── stores/
│       │   └── channelStore.ts    # 频道数据存储
│       ├── main.ts                # 弹窗入口
│       ├── App.vue                # 弹窗主组件
│       ├── index.html             # 弹窗 HTML
│       └── style.css              # 弹窗样式
├── locales/                       # 国际化语言文件
│   ├── en.json                    # 英文
│   ├── zh_CN.json                 # 简体中文
│   ├── zh_TW.json                 # 繁体中文
│   ├── ja.json                    # 日文
│   ├── ko.json                    # 韩文
│   ├── es.json                    # 西班牙文
│   └── fr.json                    # 法文
├── utils/
│   ├── 2fa.ts                     # 2FA 工具函数
│   └── messaging.ts               # 消息传递工具
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
