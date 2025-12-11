# TLDR Bot Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a user-installable Discord bot that summarizes channel history and DMs the user a catch-up summary with interactive topic buttons.

**Architecture:** TypeScript Discord bot using discord.js for Discord API interactions and Anthropic SDK for Claude-powered summarization. Stateless design hosted on Fly.io. Slash command triggers message fetch, Claude summarization, and DM response with button components.

**Tech Stack:** TypeScript, Node.js, discord.js v14, @anthropic-ai/sdk, dotenv, Fly.io

---

## Task 1: Project Setup

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `src/index.ts`

**Step 1: Initialize npm project**

Run:
```bash
cd /Users/nervous/Library/CloudStorage/Dropbox/Github/tldr
npm init -y
```

**Step 2: Install dependencies**

Run:
```bash
npm install discord.js @anthropic-ai/sdk dotenv
npm install -D typescript @types/node ts-node nodemon
```

**Step 3: Create tsconfig.json**

Create `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

**Step 4: Create .gitignore**

Create `.gitignore`:
```
node_modules/
dist/
.env
*.log
```

**Step 5: Create .env.example**

Create `.env.example`:
```
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_application_client_id
ANTHROPIC_API_KEY=your_anthropic_api_key
```

**Step 6: Create minimal entry point**

Create `src/index.ts`:
```typescript
import 'dotenv/config';

console.log('TLDR Bot starting...');
console.log('Discord Token present:', !!process.env.DISCORD_TOKEN);
console.log('Anthropic Key present:', !!process.env.ANTHROPIC_API_KEY);
```

**Step 7: Add npm scripts to package.json**

Update `package.json` scripts section:
```json
{
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "nodemon --exec ts-node src/index.ts",
    "register": "ts-node src/register.ts"
  }
}
```

**Step 8: Test the setup**

Run:
```bash
npx ts-node src/index.ts
```
Expected: Output showing "TLDR Bot starting..." and token presence checks

**Step 9: Commit**

```bash
git init
git add .
git commit -m "feat: initial project setup with TypeScript and dependencies"
```

---

## Task 2: Time Parsing Utility

**Files:**
- Create: `src/utils/time.ts`
- Create: `src/utils/time.test.ts`

**Step 1: Write the failing tests**

Create `src/utils/time.test.ts`:
```typescript
import { parseTimeRange, ParsedTimeRange } from './time';

describe('parseTimeRange', () => {
  it('parses hours', () => {
    const result = parseTimeRange('24h');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(24 * 60 * 60 * 1000);
  });

  it('parses days', () => {
    const result = parseTimeRange('7d');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it('parses minutes', () => {
    const result = parseTimeRange('30m');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(30 * 60 * 1000);
  });

  it('parses weeks', () => {
    const result = parseTimeRange('2w');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).ms).toBe(2 * 7 * 24 * 60 * 60 * 1000);
  });

  it('returns error for invalid format', () => {
    const result = parseTimeRange('banana');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Invalid format. Use like `24h`, `3d`, `1w`');
  });

  it('returns error for zero duration', () => {
    const result = parseTimeRange('0h');
    expect(result.success).toBe(false);
    expect(result.error).toBe('Duration must be greater than 0');
  });

  it('formats duration as human readable', () => {
    const result = parseTimeRange('24h');
    expect(result.success).toBe(true);
    expect((result as ParsedTimeRange).humanReadable).toBe('24 hours');
  });
});
```

**Step 2: Install Jest**

Run:
```bash
npm install -D jest @types/jest ts-jest
npx ts-jest config:init
```

**Step 3: Run test to verify it fails**

Run:
```bash
npx jest src/utils/time.test.ts
```
Expected: FAIL with "Cannot find module './time'"

**Step 4: Write the implementation**

Create `src/utils/time.ts`:
```typescript
export interface ParsedTimeRange {
  success: true;
  ms: number;
  humanReadable: string;
}

export interface ParseError {
  success: false;
  error: string;
}

export type TimeRangeResult = ParsedTimeRange | ParseError;

const UNITS: Record<string, { ms: number; singular: string; plural: string }> = {
  m: { ms: 60 * 1000, singular: 'minute', plural: 'minutes' },
  h: { ms: 60 * 60 * 1000, singular: 'hour', plural: 'hours' },
  d: { ms: 24 * 60 * 60 * 1000, singular: 'day', plural: 'days' },
  w: { ms: 7 * 24 * 60 * 60 * 1000, singular: 'week', plural: 'weeks' },
};

export function parseTimeRange(input: string): TimeRangeResult {
  const match = input.toLowerCase().match(/^(\d+)([mhdw])$/);

  if (!match) {
    return {
      success: false,
      error: 'Invalid format. Use like `24h`, `3d`, `1w`',
    };
  }

  const amount = parseInt(match[1], 10);
  const unit = match[2];

  if (amount === 0) {
    return {
      success: false,
      error: 'Duration must be greater than 0',
    };
  }

  const unitInfo = UNITS[unit];
  const ms = amount * unitInfo.ms;
  const label = amount === 1 ? unitInfo.singular : unitInfo.plural;

  return {
    success: true,
    ms,
    humanReadable: `${amount} ${label}`,
  };
}
```

**Step 5: Run tests to verify they pass**

Run:
```bash
npx jest src/utils/time.test.ts
```
Expected: All tests PASS

**Step 6: Commit**

```bash
git add src/utils/time.ts src/utils/time.test.ts jest.config.js
git commit -m "feat: add time range parsing utility with tests"
```

---

## Task 3: TypeScript Types

**Files:**
- Create: `src/types.ts`

**Step 1: Create type definitions**

Create `src/types.ts`:
```typescript
export interface DiscordMessage {
  id: string;
  content: string;
  authorUsername: string;
  authorId: string;
  timestamp: Date;
  attachments: string[];
  embeds: number;
}

export interface Topic {
  id: string;
  emoji: string;
  label: string;
  summary: string;
}

export interface SummaryResult {
  overview: string;
  highlights: string[];
  topics: Topic[];
  messageCount: number;
  timeRange: string;
}

export interface SummarizeRequest {
  messages: DiscordMessage[];
  channelName: string;
  serverName: string;
  timeRange: string;
}

export interface TopicDetailRequest {
  topic: Topic;
  messages: DiscordMessage[];
  channelName: string;
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add TypeScript type definitions"
```

---

## Task 4: Discord Message Fetching Service

**Files:**
- Create: `src/services/discord.ts`
- Create: `src/services/discord.test.ts`

**Step 1: Write the failing test**

Create `src/services/discord.test.ts`:
```typescript
import { formatMessagesForSummary } from './discord';
import { DiscordMessage } from '../types';

describe('formatMessagesForSummary', () => {
  it('formats messages into readable text', () => {
    const messages: DiscordMessage[] = [
      {
        id: '1',
        content: 'Hello everyone!',
        authorUsername: 'Alice',
        authorId: '123',
        timestamp: new Date('2025-01-01T10:00:00Z'),
        attachments: [],
        embeds: 0,
      },
      {
        id: '2',
        content: 'Hi Alice!',
        authorUsername: 'Bob',
        authorId: '456',
        timestamp: new Date('2025-01-01T10:01:00Z'),
        attachments: [],
        embeds: 0,
      },
    ];

    const result = formatMessagesForSummary(messages);

    expect(result).toContain('Alice');
    expect(result).toContain('Hello everyone!');
    expect(result).toContain('Bob');
    expect(result).toContain('Hi Alice!');
  });

  it('includes attachment indicators', () => {
    const messages: DiscordMessage[] = [
      {
        id: '1',
        content: 'Check this out',
        authorUsername: 'Alice',
        authorId: '123',
        timestamp: new Date('2025-01-01T10:00:00Z'),
        attachments: ['image.png', 'doc.pdf'],
        embeds: 0,
      },
    ];

    const result = formatMessagesForSummary(messages);

    expect(result).toContain('[2 attachments]');
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx jest src/services/discord.test.ts
```
Expected: FAIL with "Cannot find module './discord'"

**Step 3: Write the implementation**

Create `src/services/discord.ts`:
```typescript
import {
  TextChannel,
  Message,
  Collection,
  ChannelType,
  GuildChannel,
} from 'discord.js';
import { DiscordMessage } from '../types';

const MAX_MESSAGES = 1000;
const MESSAGES_PER_FETCH = 100;

export async function fetchMessages(
  channel: TextChannel,
  sinceMs: number
): Promise<{ messages: DiscordMessage[]; capped: boolean }> {
  const cutoffTime = Date.now() - sinceMs;
  const allMessages: DiscordMessage[] = [];
  let lastId: string | undefined;
  let capped = false;

  while (allMessages.length < MAX_MESSAGES) {
    const options: { limit: number; before?: string } = {
      limit: MESSAGES_PER_FETCH,
    };
    if (lastId) {
      options.before = lastId;
    }

    const fetched: Collection<string, Message> = await channel.messages.fetch(options);

    if (fetched.size === 0) break;

    for (const msg of fetched.values()) {
      if (msg.createdTimestamp < cutoffTime) {
        return { messages: allMessages.reverse(), capped };
      }

      if (allMessages.length >= MAX_MESSAGES) {
        capped = true;
        return { messages: allMessages.reverse(), capped };
      }

      allMessages.push({
        id: msg.id,
        content: msg.content,
        authorUsername: msg.author.username,
        authorId: msg.author.id,
        timestamp: msg.createdAt,
        attachments: msg.attachments.map((a) => a.name || 'attachment'),
        embeds: msg.embeds.length,
      });
    }

    lastId = fetched.last()?.id;
  }

  return { messages: allMessages.reverse(), capped };
}

export function formatMessagesForSummary(messages: DiscordMessage[]): string {
  return messages
    .map((msg) => {
      let line = `[${msg.timestamp.toISOString()}] ${msg.authorUsername}: ${msg.content}`;

      if (msg.attachments.length > 0) {
        line += ` [${msg.attachments.length} attachment${msg.attachments.length > 1 ? 's' : ''}]`;
      }

      if (msg.embeds > 0) {
        line += ` [${msg.embeds} embed${msg.embeds > 1 ? 's' : ''}]`;
      }

      return line;
    })
    .join('\n');
}

export function isTextChannel(channel: GuildChannel): channel is TextChannel {
  return channel.type === ChannelType.GuildText;
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npx jest src/services/discord.test.ts
```
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/services/discord.ts src/services/discord.test.ts
git commit -m "feat: add Discord message fetching service"
```

---

## Task 5: Claude Summarization Service

**Files:**
- Create: `src/services/summarizer.ts`
- Create: `src/services/summarizer.test.ts`

**Step 1: Write the failing test**

Create `src/services/summarizer.test.ts`:
```typescript
import { buildSummaryPrompt, parseSummaryResponse } from './summarizer';
import { DiscordMessage, SummaryResult } from '../types';

describe('buildSummaryPrompt', () => {
  it('includes channel context', () => {
    const messages: DiscordMessage[] = [
      {
        id: '1',
        content: 'Test message',
        authorUsername: 'User',
        authorId: '123',
        timestamp: new Date(),
        attachments: [],
        embeds: 0,
      },
    ];

    const prompt = buildSummaryPrompt({
      messages,
      channelName: 'general',
      serverName: 'Test Server',
      timeRange: '24 hours',
    });

    expect(prompt).toContain('general');
    expect(prompt).toContain('Test Server');
    expect(prompt).toContain('24 hours');
  });
});

describe('parseSummaryResponse', () => {
  it('parses valid JSON response', () => {
    const json = JSON.stringify({
      overview: 'People discussed gaming',
      highlights: ['Game night planned', 'New member joined'],
      topics: [
        { id: 'gaming', emoji: '🎮', label: 'Gaming', summary: 'Discussion about games' },
      ],
    });

    const result = parseSummaryResponse(json, 50, '24 hours');

    expect(result.overview).toBe('People discussed gaming');
    expect(result.highlights).toHaveLength(2);
    expect(result.topics).toHaveLength(1);
    expect(result.messageCount).toBe(50);
  });

  it('handles malformed JSON gracefully', () => {
    const result = parseSummaryResponse('not json', 10, '1 hour');

    expect(result.overview).toContain('Unable to parse');
    expect(result.topics).toHaveLength(0);
  });
});
```

**Step 2: Run test to verify it fails**

Run:
```bash
npx jest src/services/summarizer.test.ts
```
Expected: FAIL with "Cannot find module './summarizer'"

**Step 3: Write the implementation**

Create `src/services/summarizer.ts`:
```typescript
import Anthropic from '@anthropic-ai/sdk';
import { SummarizeRequest, SummaryResult, Topic, TopicDetailRequest, DiscordMessage } from '../types';
import { formatMessagesForSummary } from './discord';

const anthropic = new Anthropic();

const SUMMARY_SYSTEM_PROMPT = `You are a Discord chat summarizer. Analyze the provided chat messages and create a concise summary.

Respond with ONLY valid JSON in this exact format:
{
  "overview": "1-2 sentence summary of the main discussion",
  "highlights": ["Important point 1", "Important point 2", "Important point 3"],
  "topics": [
    {"id": "unique-id", "emoji": "🎮", "label": "Short Label", "summary": "2-3 sentence detail about this topic"}
  ]
}

Rules:
- Overview should capture the essence of the conversation
- Highlights are the most important/actionable items (links shared, decisions made, questions asked)
- Topics are distinct discussion threads (2-5 topics max)
- Each topic needs a relevant emoji, short label (2-3 words), and brief summary
- Be concise but informative
- If there's nothing noteworthy, say so in overview and leave highlights/topics minimal`;

export function buildSummaryPrompt(request: SummarizeRequest): string {
  const formattedMessages = formatMessagesForSummary(request.messages);

  return `Summarize the following Discord chat from #${request.channelName} in "${request.serverName}" over the last ${request.timeRange}.

${request.messages.length} messages:

${formattedMessages}`;
}

export async function summarizeMessages(request: SummarizeRequest): Promise<SummaryResult> {
  const userPrompt = buildSummaryPrompt(request);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    system: SUMMARY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return parseSummaryResponse(content.text, request.messages.length, request.timeRange);
}

export function parseSummaryResponse(
  text: string,
  messageCount: number,
  timeRange: string
): SummaryResult {
  try {
    const parsed = JSON.parse(text);

    return {
      overview: parsed.overview || 'No summary available',
      highlights: parsed.highlights || [],
      topics: (parsed.topics || []).map((t: Topic, i: number) => ({
        id: t.id || `topic-${i}`,
        emoji: t.emoji || '💬',
        label: t.label || `Topic ${i + 1}`,
        summary: t.summary || '',
      })),
      messageCount,
      timeRange,
    };
  } catch {
    return {
      overview: 'Unable to parse summary. The conversation may have been too short or empty.',
      highlights: [],
      topics: [],
      messageCount,
      timeRange,
    };
  }
}

const TOPIC_DETAIL_PROMPT = `You are expanding on a specific topic from a Discord chat summary.

Given the topic and the original messages, provide a more detailed explanation of what was discussed.

Keep it to 2-3 paragraphs. Include specific usernames and what they said when relevant.
Quote notable messages directly when helpful.`;

export async function getTopicDetail(request: TopicDetailRequest): Promise<string> {
  const formattedMessages = formatMessagesForSummary(request.messages);

  const userPrompt = `Topic: ${request.topic.label}
Brief summary: ${request.topic.summary}

Original messages from #${request.channelName}:
${formattedMessages}

Provide more detail about this topic.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 800,
    system: TOPIC_DETAIL_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const content = response.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type from Claude');
  }

  return content.text;
}
```

**Step 4: Run tests to verify they pass**

Run:
```bash
npx jest src/services/summarizer.test.ts
```
Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/services/summarizer.ts src/services/summarizer.test.ts
git commit -m "feat: add Claude summarization service"
```

---

## Task 6: Slash Command Registration Script

**Files:**
- Create: `src/register.ts`

**Step 1: Create the registration script**

Create `src/register.ts`:
```typescript
import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const clientId = process.env.DISCORD_CLIENT_ID;
const token = process.env.DISCORD_TOKEN;

if (!clientId || !token) {
  console.error('Missing DISCORD_CLIENT_ID or DISCORD_TOKEN in environment');
  process.exit(1);
}

const commands = [
  new SlashCommandBuilder()
    .setName('tldr')
    .setDescription('Get a summary of recent channel activity')
    .addStringOption((option) =>
      option
        .setName('range')
        .setDescription('Time range (e.g., 24h, 3d, 1w)')
        .setRequired(true)
    )
    .toJSON(),
];

const rest = new REST().setToken(token);

async function register() {
  try {
    console.log('Registering slash commands...');

    await rest.put(Routes.applicationCommands(clientId), { body: commands });

    console.log('Successfully registered commands!');
    console.log('');
    console.log('Install the bot to your account with this URL:');
    console.log(
      `https://discord.com/oauth2/authorize?client_id=${clientId}&scope=applications.commands`
    );
  } catch (error) {
    console.error('Error registering commands:', error);
    process.exit(1);
  }
}

register();
```

**Step 2: Commit**

```bash
git add src/register.ts
git commit -m "feat: add slash command registration script"
```

---

## Task 7: Main Bot Implementation

**Files:**
- Modify: `src/index.ts`
- Create: `src/commands/tldr.ts`

**Step 1: Create the TLDR command handler**

Create `src/commands/tldr.ts`:
```typescript
import {
  ChatInputCommandInteraction,
  TextChannel,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
  ComponentType,
} from 'discord.js';
import { parseTimeRange } from '../utils/time';
import { fetchMessages, isTextChannel } from '../services/discord';
import { summarizeMessages, getTopicDetail } from '../services/summarizer';
import { DiscordMessage, SummaryResult, Topic } from '../types';

// Store recent summaries for button interactions (in-memory, clears on restart)
const recentSummaries = new Map<string, { messages: DiscordMessage[]; channelName: string }>();

export async function handleTldrCommand(interaction: ChatInputCommandInteraction): Promise<void> {
  const rangeInput = interaction.options.getString('range', true);

  // Parse time range
  const parsed = parseTimeRange(rangeInput);
  if (!parsed.success) {
    await interaction.reply({ content: parsed.error, ephemeral: true });
    return;
  }

  // Verify channel type
  const channel = interaction.channel;
  if (!channel || !('guild' in channel) || !channel.guild) {
    await interaction.reply({
      content: 'This command can only be used in a server channel.',
      ephemeral: true
    });
    return;
  }

  if (!isTextChannel(channel as TextChannel)) {
    await interaction.reply({
      content: 'This command can only be used in text channels.',
      ephemeral: true
    });
    return;
  }

  const textChannel = channel as TextChannel;
  const serverName = textChannel.guild.name;
  const channelName = textChannel.name;

  // Defer reply since this might take a while
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch messages
    const { messages, capped } = await fetchMessages(textChannel, parsed.ms);

    if (messages.length === 0) {
      await interaction.editReply({
        content: `No messages found in #${channelName} in the last ${parsed.humanReadable}.`,
      });
      return;
    }

    // Summarize
    const summary = await summarizeMessages({
      messages,
      channelName,
      serverName,
      timeRange: parsed.humanReadable,
    });

    // Build DM content
    const dmContent = buildSummaryMessage(summary, channelName, serverName, capped);
    const buttons = buildTopicButtons(summary.topics);

    // Send DM
    const user = interaction.user;
    const dmChannel = await user.createDM();

    const summaryId = `${user.id}-${Date.now()}`;
    recentSummaries.set(summaryId, { messages, channelName });

    // Clean up old summaries (keep last 50)
    if (recentSummaries.size > 50) {
      const firstKey = recentSummaries.keys().next().value;
      if (firstKey) recentSummaries.delete(firstKey);
    }

    const dmMessage = await dmChannel.send({
      content: dmContent,
      components: buttons.length > 0 ? [buttons] : [],
    });

    // Set up button collector
    if (summary.topics.length > 0) {
      const collector = dmMessage.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 30 * 60 * 1000, // 30 minutes
      });

      collector.on('collect', async (buttonInteraction: ButtonInteraction) => {
        await handleTopicButton(buttonInteraction, summary.topics, messages, channelName);
      });
    }

    await interaction.editReply({
      content: `Summary sent to your DMs! Check your messages.`,
    });
  } catch (error) {
    console.error('Error in tldr command:', error);
    await interaction.editReply({
      content: 'Something went wrong generating the summary. Please try again later.',
    });
  }
}

function buildSummaryMessage(
  summary: SummaryResult,
  channelName: string,
  serverName: string,
  capped: boolean
): string {
  let msg = `━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `📋 **TLDR for #${channelName}** (${serverName})\n`;
  msg += `Last ${summary.timeRange} • ${summary.messageCount} messages`;
  if (capped) msg += ` (capped at 1000)`;
  msg += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

  msg += `**Summary:** ${summary.overview}\n\n`;

  if (summary.highlights.length > 0) {
    msg += `**Highlights:**\n`;
    for (const highlight of summary.highlights) {
      msg += `• ${highlight}\n`;
    }
    msg += `\n`;
  }

  if (summary.topics.length > 0) {
    msg += `**Topics:** Click a button below for more details.\n`;
  }

  return msg;
}

function buildTopicButtons(topics: Topic[]): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  for (const topic of topics.slice(0, 5)) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`topic:${topic.id}`)
        .setLabel(`${topic.emoji} ${topic.label}`)
        .setStyle(ButtonStyle.Secondary)
    );
  }

  return row;
}

async function handleTopicButton(
  interaction: ButtonInteraction,
  topics: Topic[],
  messages: DiscordMessage[],
  channelName: string
): Promise<void> {
  const topicId = interaction.customId.replace('topic:', '');
  const topic = topics.find((t) => t.id === topicId);

  if (!topic) {
    await interaction.reply({ content: 'Topic not found.', ephemeral: true });
    return;
  }

  await interaction.deferReply();

  try {
    const detail = await getTopicDetail({ topic, messages, channelName });

    await interaction.editReply({
      content: `**${topic.emoji} ${topic.label}**\n\n${detail}`,
    });
  } catch (error) {
    console.error('Error getting topic detail:', error);
    await interaction.editReply({
      content: 'Failed to get topic details. Please try again.',
    });
  }
}
```

**Step 2: Update main entry point**

Replace `src/index.ts`:
```typescript
import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import { handleTldrCommand } from './commands/tldr';

const token = process.env.DISCORD_TOKEN;

if (!token) {
  console.error('Missing DISCORD_TOKEN in environment');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.once(Events.ClientReady, (c) => {
  console.log(`TLDR Bot ready! Logged in as ${c.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'tldr') {
    await handleTldrCommand(interaction);
  }
});

client.login(token);
```

**Step 3: Test compilation**

Run:
```bash
npm run build
```
Expected: Compiles without errors

**Step 4: Commit**

```bash
git add src/index.ts src/commands/tldr.ts
git commit -m "feat: implement main bot and tldr command handler"
```

---

## Task 8: Dockerfile and Fly.io Configuration

**Files:**
- Create: `Dockerfile`
- Create: `fly.toml`

**Step 1: Create Dockerfile**

Create `Dockerfile`:
```dockerfile
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

CMD ["node", "dist/index.js"]
```

**Step 2: Create fly.toml**

Create `fly.toml`:
```toml
app = "tldr-discord-bot"
primary_region = "ord"

[build]

[env]
  NODE_ENV = "production"

[[vm]]
  size = "shared-cpu-1x"
  memory = "256mb"
```

**Step 3: Update .dockerignore**

Create `.dockerignore`:
```
node_modules
src
*.md
.env
.git
.gitignore
jest.config.js
tsconfig.json
```

**Step 4: Commit**

```bash
git add Dockerfile fly.toml .dockerignore
git commit -m "feat: add Dockerfile and Fly.io configuration"
```

---

## Task 9: Documentation

**Files:**
- Create: `README.md`

**Step 1: Create README**

Create `README.md`:
```markdown
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
```

**Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
```

---

## Summary

**Total Tasks:** 9

1. Project setup (TypeScript, dependencies)
2. Time parsing utility with tests
3. TypeScript type definitions
4. Discord message fetching service with tests
5. Claude summarization service with tests
6. Slash command registration script
7. Main bot and command handler
8. Docker and Fly.io configuration
9. Documentation

**After completing all tasks:**
- Run full test suite: `npx jest`
- Build: `npm run build`
- Test locally with real Discord credentials
- Deploy to Fly.io
