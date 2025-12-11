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
