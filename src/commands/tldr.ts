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
      components: summary.topics.length > 0 ? [buttons] : [],
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
