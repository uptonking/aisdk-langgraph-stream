export type LangGraphContentItem = {
  text?: string;
  type: 'text' | 'tool_use';
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  index?: number;
};

export type LangGraphMessage = {
  content?: LangGraphContentItem[] | string;
  tool_calls?: {
    id?: string;
    name: string;
    args?: Record<string, unknown>;
  }[];
  type: 'ai' | 'human' | 'system' | 'tool';
  id?: string;
};

export type LangGraphToolMessage = {
  content: string;
  type: 'tool';
  name: string;
  tool_call_id: string;
};

export type StreamState = {
  buffer: string;
  lastSeenText: string;
  currentTextBlockId: number;
  hasActiveTextBlock: boolean;
  toolCalls: Map<string, { name: string; input: Record<string, unknown> }>;
};