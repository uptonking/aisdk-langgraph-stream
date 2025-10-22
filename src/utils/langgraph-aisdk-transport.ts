import type {
  HttpChatTransportInitOptions,
  UIMessage,
  UIMessageChunk,
} from 'ai';
import { HttpChatTransport } from 'ai';
import type {
  LangGraphContentItem,
  LangGraphMessage,
  LangGraphToolMessage,
  StreamState,
} from './types';

const createStreamState = (): StreamState => ({
  buffer: '',
  lastSeenText: '',
  currentTextBlockId: 0,
  hasActiveTextBlock: false,
  toolCalls: new Map(),
});

const parseSSEData = (line: string): unknown | null => {
  if (!line.startsWith('data: ')) return null;

  try {
    return JSON.parse(line.slice(6));
  } catch (error) {
    console.warn('Failed to parse SSE line:', line, error);
    return null;
  }
};

const endTextBlock = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  state: StreamState,
) => {
  if (state.hasActiveTextBlock) {
    controller.enqueue({
      type: 'text-end',
      id: `text-${state.currentTextBlockId}`,
    });
    state.hasActiveTextBlock = false;
  }
};

const startTextBlock = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  state: StreamState,
) => {
  controller.enqueue({
    type: 'text-start',
    id: `text-${state.currentTextBlockId}`,
  });
  state.hasActiveTextBlock = true;
};

const processTextDelta = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  state: StreamState,
  text: string,
) => {
  const isNewText = !text.startsWith(state.lastSeenText);

  if (isNewText && state.lastSeenText.length > 0) {
    endTextBlock(controller, state);
    state.currentTextBlockId++;
    startTextBlock(controller, state);

    controller.enqueue({
      type: 'text-delta',
      id: `text-${state.currentTextBlockId}`,
      delta: text,
    });
    state.lastSeenText = text;
  } else if (text.length > state.lastSeenText.length) {
    if (!state.hasActiveTextBlock) {
      startTextBlock(controller, state);
    }

    const newText = text.slice(state.lastSeenText.length);
    controller.enqueue({
      type: 'text-delta',
      id: `text-${state.currentTextBlockId}`,
      delta: newText,
    });
    state.lastSeenText = text;
  }
};

const processToolUse = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  state: StreamState,
  item: LangGraphContentItem,
  input: Record<string, unknown>,
) => {
  if (!item.name) return;

  const toolCallId = item.id || `${item.name}-${Date.now()}`;

  endTextBlock(controller, state);

  state.toolCalls.set(toolCallId, {
    name: item.name,
    input,
  });

  controller.enqueue({
    type: 'tool-input-available',
    toolCallId,
    toolName: item.name,
    input,
  });
};

const processToolOutput = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  toolMessage: LangGraphToolMessage,
) => {
  controller.enqueue({
    type: 'tool-output-available',
    toolCallId: toolMessage.tool_call_id,
    output: toolMessage.content,
  });
};

const processAIMessage = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  state: StreamState,
  message: LangGraphMessage,
) => {
  if (!message.content) return;

  if (!Array.isArray(message.content))
    return processTextDelta(controller, state, message.content);

  for (const item of message.content) {
    if (item.type === 'text' && item.text) {
      processTextDelta(controller, state, item.text);
    } else if (item.type === 'tool_use') {
      const args =
        message.tool_calls?.find(({ id }) => id === item.id)?.args || {};

      processToolUse(controller, state, item, args);
    }
  }
};

const processMessage = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  state: StreamState,
  message: LangGraphMessage | LangGraphToolMessage,
) => {
  if (message.type === 'tool' && 'tool_call_id' in message) {
    processToolOutput(controller, message);
  } else if (message.type === 'ai' && 'content' in message) {
    processAIMessage(controller, state, message);
  } else if (message.type === 'human' && 'content' in message) {
    processAIMessage(controller, state, message);
  } else if (message.type === 'system' && 'content' in message) {
    processAIMessage(controller, state, message);
  }
};

const processDataChunk = (
  controller: ReadableStreamDefaultController<UIMessageChunk>,
  state: StreamState,
  data: unknown,
) => {
  if (Array.isArray(data)) {
    for (const message of data as (LangGraphMessage | LangGraphToolMessage)[]) {
      processMessage(controller, state, message);
    }
  } else if (data && typeof data === 'object') {
    const dataObj = data as Record<string, unknown>;

    if (
      dataObj.tools &&
      typeof dataObj.tools === 'object' &&
      dataObj.tools !== null
    ) {
      const toolsObj = dataObj.tools as Record<string, unknown>;
      if (Array.isArray(toolsObj.messages)) {
        for (const toolMessage of toolsObj.messages as LangGraphToolMessage[]) {
          processToolOutput(controller, toolMessage);
        }
      }
    } else if (dataObj.type === 'tool' && dataObj.tool_call_id) {
      processToolOutput(controller, dataObj as LangGraphToolMessage);
    }
  }
};

/**
 * https://ai-sdk.dev/docs/ai-sdk-ui/transport
 */
export class LangGraphChatTransport<
  UI_MESSAGE extends UIMessage,
> extends HttpChatTransport<UI_MESSAGE> {
  constructor(options: HttpChatTransportInitOptions<UI_MESSAGE>) {
    super(options);
  }

  public processResponseStream(
    stream: ReadableStream<Uint8Array>,
  ): ReadableStream<UIMessageChunk> {
    return new ReadableStream({
      async start(controller) {
        const decoder = new TextDecoder();
        const state = createStreamState();
        const reader = stream.getReader();

        try {
          // The infinite loop is necessary to continuously read from the stream until it is fully consumed.
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            state.buffer += decoder.decode(value, { stream: true });
            const lines = state.buffer.split('\n');
            state.buffer = lines.pop() || '';

            // console.log(';; graph-http ', value, state.buffer)

            for (const line of lines) {
              if (!line.startsWith('event: ') && !line.startsWith('data: '))
                continue;
              if (line.startsWith('event: ')) continue;

              const data = parseSSEData(line);
              if (data) {
                processDataChunk(controller, state, data);
              }
            }
          }

          endTextBlock(controller, state);
        } catch (error) {
          controller.enqueue({
            type: 'error',
            errorText: String(error),
          });
        } finally {
          controller.close();
        }
      },
    });
  }
}

// Export types for external use
export type {
  LangGraphMessage,
  LangGraphToolMessage,
  LangGraphContentItem,
  StreamState,
} from './types';

