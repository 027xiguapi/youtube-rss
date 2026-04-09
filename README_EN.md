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

## Supported Pages

- Single channel pages:
  - `https://www.youtube.com/@channelhandle`
  - `https://www.youtube.com/c/channelname`
  - `https://www.youtube.com/channel/CHANNEL_ID`
- Subscriptions page (bulk extraction):
  - `https://www.youtube.com/feed/channels`

## Installation

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
4. Use the following options:
   - **Copy JSON** - Copy channel data to clipboard
   - **Download JSON** - Download data as a JSON file
   - **Copy** (RSS URL) - Copy the RSS feed link
   - **Refresh** - Re-extract data

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
│   ├── channel.content.ts         # Single channel content script
│   ├── feed-channels.content.ts   # Subscriptions page bulk extraction script
│   └── popup/
│       ├── App.vue                # Popup main component
│       ├── components/
│       │   ├── ActionBar.vue      # Action buttons bar
│       │   ├── ChannelCard.vue    # Channel card
│       │   ├── ChannelDetail.vue  # Single channel detail view
│       │   └── ChannelsList.vue   # Channels list view
│       ├── composables/
│       │   ├── types.ts           # Type definitions
│       │   └── useUtils.ts        # Utility functions
│       └── main.ts                # Popup entry point
├── utils/
│   └── youtubeExtractor.ts        # YouTube data extraction utility
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
