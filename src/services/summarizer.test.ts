import { buildSummaryPrompt, parseSummaryResponse } from './summarizer';
import { DiscordMessage } from '../types';

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
