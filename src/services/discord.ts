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
