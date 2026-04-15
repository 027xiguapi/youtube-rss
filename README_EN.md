# YouTube Channel RSS Extractor

English | [中文](./README.md)

A browser extension to extract RSS feeds and channel metadata from YouTube channel pages or the subscriptions page in bulk.

## Features

- Automatically extract RSS URLs from YouTube channels
- Retrieve channel metadata (channel ID, title, subscriber count, description, etc.)
- Bulk extract RSS feeds from all subscribed channels on the subscriptions page
- Display channel avatars
- Copy JSON data to clipboard
- Download channel data as JSON files
- Quick copy RSS URLs
- Export YouTube Cookies (Netscape format)
- Quick open channel links

## Supported Pages

- Single channel pages:
  - `https://www.youtube.com/@channelhandle`
  - `https://www.youtube.com/c/channelname`
  - `https://www.youtube.com/channel/CHANNEL_ID`
- Subscriptions page (bulk extraction):
  - `https://www.youtube.com/feed/channels`

## Installation

### Chrome Web Store

[Install from Chrome Web Store](https://chromewebstore.google.com/detail/youtube-rss-extractor/cjljpiaogilmoaffnbfmaaagpmndjfmh)

### GitHub

[Project Repository](https://github.com/027xiguapi/youtube-rss)

### Related Links

- [Dashboard](https://aitubestats.com/)
- [RSS Search](https://aitubestats.com/youtube-rss)
- [Channel ID Finder](https://aitubestats.com/channel-id-finder)
- [YouTube Viewer](https://aitubestats.com/youtube-viewer)

### Development Mode

1. Install dependencies:
```bash
pnpm install
```

2. Start the development server:
```bash
pnpm dev
```

3. Load the extension in your browser:
   - **Chrome**: Go to `chrome://extensions/`, enable "Developer mode", click "Load unpacked", and select the `.output/chrome-mv3-dev` folder
   - **Firefox**: Go to `about:debugging#/runtime/this-firefox`, click "Load Temporary Add-on", and select `.output/firefox-mv3-dev/manifest.json`

### Production Build

```bash
pnpm build
```

Build as ZIP:
```bash
pnpm zip
```

## Usage

### Single Channel Page

1. Visit any YouTube channel page
2. Click the extension icon to open the popup
3. The extension automatically extracts channel data
4. In the **Channels** tab, use the following options:
   - **Fetch RSS Data** - Get fresh RSS data
   - **Download OPML** - Download OPML file
5. In the **Tools** tab:
   - **Export YouTube Cookies** - Export YouTube Cookies (Netscape format)
   - **Channel Links** - Quick open channel links

### Subscriptions Page (Bulk Mode)

1. Visit `https://www.youtube.com/feed/channels`
2. Click the extension icon to open the popup
3. The extension will automatically scroll to load all subscribed channels and extract RSS feeds one by one
4. Once complete, a list of all channels is displayed with support for:
   - **Copy All JSON** - Copy all channel data
   - **Download All** - Download all data as JSON
   - Copy individual channel RSS URLs

## Extracted Data

### Single Channel

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

### Bulk Extraction from Subscriptions Page

```json
{
  "name": "Channel Name",
  "url": "https://www.youtube.com/@channelhandle",
  "rss": "https://www.youtube.com/feeds/videos.xml?channel_id=UCxxxxxxxxxxxxxx",
  "image": "https://yt3.googleusercontent.com/..."
}
```

## Project Structure

```
├── entrypoints/
│   ├── background.ts              # Background service script
│   ├── youtube.content.ts         # YouTube page content script
│   ├── channel.content.ts         # Single channel content script
│   ├── feed-channels.content.ts   # Subscriptions page bulk extraction script
│   └── popup/
│       ├── App.vue                # Popup main component (tab navigation)
│       ├── components/
│       │   ├── ChannelsTab.vue    # Channels tab
│       │   ├── ToolsTab.vue       # Tools tab
│       │   ├── SettingsTab.vue    # Settings tab
│       │   ├── ChannelsList.vue   # Channels list
│       │   ├── ChannelCard.vue    # Channel card
│       │   ├── ChannelDetail.vue  # Single channel detail view
│       │   └── ActionBar.vue      # Action buttons bar
│       ├── composables/
│       │   ├── types.ts           # Type definitions
│       │   ├── useUtils.ts        # Utility functions
│       │   └── useI18n.ts         # Internationalization
│       ├── stores/
│       │   └── channelStore.ts    # Channel data store
│       ├── main.ts                # Popup entry point
│       ├── App.vue                # Popup main component
│       ├── index.html             # Popup HTML
│       └── style.css              # Popup styles
├── locales/                       # Internationalization language files
│   ├── en.json                    # English
│   ├── zh_CN.json                 # Simplified Chinese
│   ├── zh_TW.json                 # Traditional Chinese
│   ├── ja.json                    # Japanese
│   ├── ko.json                    # Korean
│   ├── es.json                    # Spanish
│   └── fr.json                    # French
├── utils/
│   ├── 2fa.ts                     # 2FA utility functions
│   └── messaging.ts               # Messaging utility
├── wxt.config.ts                  # WXT configuration
└── package.json
```

## Tech Stack

- **WXT** - Browser extension framework
- **Vue 3** - UI framework
- **TypeScript** - Type safety
- **Manifest V3** - Modern extension standard

## License

MIT
