# YouTube Channel RSS Extractor

一个浏览器扩展，用于从 YouTube 频道页面提取 RSS 源和频道元数据。

## 功能

- 🎯 自动提取 YouTube 频道的 RSS URL
- 📊 获取频道元数据（频道 ID、标题、订阅者数、描述等）
- 🖼️ 显示频道头像
- 📋 复制 JSON 数据到剪贴板
- 💾 下载频道数据为 JSON 文件
- 🔗 快速复制 RSS URL

## 支持的 URL 格式

- `https://www.youtube.com/@channelhandle`
- `https://www.youtube.com/c/channelname`
- `https://www.youtube.com/channel/CHANNEL_ID`

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

1. 访问任何 YouTube 频道页面
2. 点击扩展图标打开弹窗
3. 扩展会自动提取频道数据
4. 使用以下选项：
   - **Copy JSON** - 复制所有频道数据到剪贴板
   - **Download JSON** - 下载数据为 JSON 文件
   - **Copy** (RSS URL) - 复制 RSS 源链接
   - **Refresh** - 重新提取数据

## 提取的数据

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

## 项目结构

```
├── entrypoints/
│   ├── background.ts          # 后台服务脚本
│   ├── content.ts             # 内容脚本
│   └── popup/
│       ├── App.vue            # 弹窗 UI 组件
│       └── main.ts            # 弹窗入口
├── utils/
│   └── youtubeExtractor.ts    # YouTube 数据提取工具
├── wxt.config.ts              # WXT 配置
└── package.json               # 项目依赖
```

## 技术栈

- **WXT** - 浏览器扩展框架
- **Vue 3** - UI 框架
- **TypeScript** - 类型安全
- **Manifest V3** - 现代扩展标准

## 原始脚本

该项目基于 `rss.js` Tampermonkey 脚本改进而来，转换为现代浏览器扩展格式。

## 许可证

MIT
