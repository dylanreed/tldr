# TLDR Bot Design

## Overview

A user-installable Discord app that summarizes channel activity and DMs you a catch-up summary.

## Core Concept

1. User installs the app to their Discord account (one-time setup)
2. In any server they're a member of, run `/tldr 24h` (or `3d`, `12h`, etc.)
3. Bot reads recent messages from that channel (using user's permissions)
4. Claude summarizes the conversation into key topics and highlights
5. Bot DMs user the summary with buttons for each topic
6. Click a button to get more detail on that specific topic

### Constraints

- Can only access channels the user has read access to
- Message history capped at ~1000 messages per request
- Uses Anthropic API key from environment (personal use for now)

## User Experience

### Setup (one-time)

```
1. Clone repo, run `npm install`
2. Create Discord app at discord.com/developers
3. Add Discord bot token and Anthropic API key to `.env`
4. Run `npm run register` to register the slash command
5. Install app to your account via OAuth URL
6. Run `npm start` (local) or `fly deploy` (production)
```

### Daily Usage

```
You (in #general):  /tldr 24h

Bot (in your DMs):
━━━━━━━━━━━━━━━━━━━━━━━━━━━
TLDR for #general (last 24 hours)
━━━━━━━━━━━━━━━━━━━━━━━━━━━

**Summary:** Mostly discussion about the upcoming game night
and some debugging help for @Mike's Python project.

**Highlights:**
- Game night confirmed for Saturday 8pm
- Link shared: discord.gg/newserver
- @Sarah asked about React hooks (got answered)

[Game Night] [Python Debug] [React Question]
```

### Drilling Down

```
User: *clicks [Python Debug]*

Bot:
**Python Debug Discussion**
@Mike was getting a KeyError in his dictionary lookup...
[continues with relevant context and resolution]
```

## Technical Architecture

### Project Structure

```
tldr/
├── src/
│   ├── index.ts          # Entry point, Discord client setup
│   ├── commands/
│   │   └── tldr.ts       # Slash command handler
│   ├── services/
│   │   ├── discord.ts    # Message fetching logic
│   │   └── summarizer.ts # Claude API integration
│   ├── utils/
│   │   └── time.ts       # Parse "24h", "3d" into durations
│   └── types.ts          # TypeScript interfaces
├── .env                  # Local dev tokens (gitignored)
├── .env.example          # Template for required env vars
├── Dockerfile            # Container for Fly.io
├── fly.toml              # Fly.io config
├── package.json
└── tsconfig.json
```

### Dependencies

- `discord.js` - Discord API client
- `@anthropic-ai/sdk` - Claude API
- `dotenv` - Environment variable loading (local dev)

### Data Flow

1. User runs `/tldr 3h` → Discord sends interaction to bot
2. Bot parses time range, fetches messages from Discord API
3. Messages formatted and sent to Claude with summarization prompt
4. Claude returns structured summary with topics
5. Bot creates DM with summary text + button components
6. Button clicks trigger follow-up Claude calls for detail

## Configuration & Deployment

### Environment Variables

```
DISCORD_TOKEN=your_bot_token
ANTHROPIC_API_KEY=sk-ant-xxx
DISCORD_CLIENT_ID=your_app_client_id
```

### Local Development

```bash
npm install
npm run register   # Register slash command with Discord
npm run dev        # Run locally with hot reload
```

### Fly.io Deployment

```bash
fly launch                # One-time setup
fly secrets set DISCORD_TOKEN=xxx ANTHROPIC_API_KEY=xxx DISCORD_CLIENT_ID=xxx
fly deploy                # Deploy updates
```

### fly.toml

```toml
app = "tldr-bot"
primary_region = "ord"

[build]

[env]
  NODE_ENV = "production"
```

## Error Handling

| Scenario | Response |
|----------|----------|
| Invalid time format (`/tldr banana`) | "Invalid format. Use like `24h`, `3d`, `1w`" |
| No messages in range | "No messages found in the last X" |
| Channel has 10k+ messages in range | Cap at 1000, note "Summarizing most recent 1000 messages" |
| User lacks channel permissions | Discord handles - command won't show or fails gracefully |
| Anthropic API error | "Summary failed, try again later" + log error |
| Rate limited by Discord | Built into discord.js, handles automatically |

### Message Limits

- Discord API fetches 100 messages per request
- Batch up to 10 requests (1000 messages max)
- If time range contains more, summarize most recent 1000 and note it

## Future Enhancements (not in v1)

- Per-user API key storage via `/setkey` command
- Database for key storage (SQLite or Postgres)
- Public user management and rate limiting
