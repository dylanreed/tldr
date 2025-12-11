import Anthropic from '@anthropic-ai/sdk';
import { SummarizeRequest, SummaryResult, Topic, TopicDetailRequest } from '../types';
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
