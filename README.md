# TLDR Discord Bot

A user-installable Discord bot that summarizes channel activity and DMs you a catch-up summary.

## Features

- Run `/tldr 24h` in any server you're a member of
- Get a summary DM with key topics and highlights
- Click buttons to drill down into specific topics
- Powered by Claude for intelligent summarization

## Setup

### Prerequisites

- Node.js 20+
- Discord Developer account
- Anthropic API key

### 1. Create Discord Application

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Go to Bot section, create a bot
4. Copy the bot token
5. Enable MESSAGE CONTENT INTENT in Bot settings
6. Copy the Application ID from General Information

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
DISCORD_TOKEN=your_bot_token
DISCORD_CLIENT_ID=your_application_id
ANTHROPIC_API_KEY=your_anthropic_key
```

### 4. Register Commands

```bash
npm run register
```

This outputs an install URL. Click it to add the bot to your account.

### 5. Run Locally

```bash
npm run dev
```

## Deployment (Fly.io)

### First Time

```bash
fly launch --no-deploy
fly secrets set DISCORD_TOKEN=xxx ANTHROPIC_API_KEY=xxx DISCORD_CLIENT_ID=xxx
npm run build
fly deploy
```

### Updates

```bash
npm run build
fly deploy
```

## Usage

In any server channel:
```
/tldr 24h    # Last 24 hours
/tldr 3d     # Last 3 days
/tldr 1w     # Last week
/tldr 30m    # Last 30 minutes
```

The bot will DM you a summary with clickable topic buttons.

## License

MIT
