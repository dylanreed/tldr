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
