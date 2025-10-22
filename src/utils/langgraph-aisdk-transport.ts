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
  console.log(';; processTextDelta called:', { text, lastSeenText: state.lastSeenText, hasActiveTextBlock: state.hasActiveTextBlock });
  
  // If this is the first text chunk, start a new text block
  if (!state.hasActiveTextBlock) {
    startTextBlock(controller, state);
  }
  
  // AI SDK streaming pattern: maintain a single text block for the entire response
  // Only send incremental differences as text-delta
  let delta = '';
  
  if (state.lastSeenText === '') {
    // First chunk - send the full text
    delta = text;
  } else if (text.startsWith(state.lastSeenText)) {
    // This is an incremental update - only send the new part
    delta = text.slice(state.lastSeenText.length);
  } else {
    // Content doesn't match previous text - this is normal for LangGraph
    // Just send the entire text as delta (LangGraph sends full content each time)
    delta = text;
  }
  
  // Only send delta if there's new content
  if (delta.length > 0) {
    controller.enqueue({
      type: 'text-delta',
      id: `text-${state.currentTextBlockId}`,
      delta: delta,
    });
    state.lastSeenText = text;
    console.log(';; Enqueued text-delta:', delta);
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
  console.log(';; processDataChunk received data:', data);
  
  if (Array.isArray(data)) {
    for (const message of data) {
      console.log(';; Processing array message:', message);
      
      // Handle LangGraph AIMessageChunk format
      if (message && typeof message === 'object' && 'type' in message) {
        const msg = message as Record<string, unknown>;
        
        if (msg.type === 'AIMessageChunk' && msg.content !== undefined) {
          const content = String(msg.content);
          console.log(';; Found AIMessageChunk with content:', content);
          
          // Simplified approach: just process the text delta
          // The processTextDelta function will handle incremental updates
          processTextDelta(controller, state, content);
        }
        // Handle other message types if needed
      }
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
    console.log(';; LangGraphChatTransport.processResponseStream called');
    
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

            const decoded = decoder.decode(value, { stream: true });
            // console.log(';; Received chunk:', decoded);
            
            state.buffer += decoded;
            const lines = state.buffer.split('\n');
            state.buffer = lines.pop() || '';

            console.log(';; Parsed lines:', lines);

            for (const line of lines) {
              if (!line.startsWith('event: ') && !line.startsWith('data: '))
                continue;
              if (line.startsWith('event: ')) continue;

              // console.log(';; Processing SSE line:', line);
              const data = parseSSEData(line);
              if (data) {
                console.log(';; Parsed data:', data);
                processDataChunk(controller, state, data);
              }
            }
          }

          endTextBlock(controller, state);
        } catch (error) {
          console.error(';; Error in processResponseStream:', error);
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

