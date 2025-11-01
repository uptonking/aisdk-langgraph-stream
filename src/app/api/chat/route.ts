import {
  convertToModelMessages,
  createIdGenerator,
  generateId,
  stepCountIs,
  streamText,
  tool,
  UIMessage,
} from 'ai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';
import { z } from 'zod';

import { MyUIMessage } from '@/utils/chat-schema';
import { readChat, saveChat } from '@/utils/chat-store';
import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// import { groq } from "@ai-sdk/groq";
// model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages: messagesLatest,
    id: chatId,
  }: { messages: MyUIMessage[]; id: string } = await req.json();
  const chat = await readChat(chatId);
  let messages = chat.messages;

  messages = [...messages, ...messagesLatest];
  // Clear any previous active stream and save the user message
  saveChat({ id: chatId, messages, activeStreamId: null });

  // console.log(';; req messages ', chatId, JSON.stringify(messages, null, 3));

  const result = streamText({
    model: lmstudio('qwen/qwen3-vl-4b'),
    // model: lmstudio('lfm2-8b-a1b'),
    // model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    // model: groq("qwen/qwen3-32b"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages }) => {
      // console.log(';; onFin ', chatId, JSON.stringify(messages, null, 2));
      saveChat({ id: chatId, messages, activeStreamId: null });
    },
    // Generate consistent server-side IDs for persistence:
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 9,
    }),

    //
    async consumeSseStream({ stream }) {
      // const streamId = generateId();
      const streamId = createIdGenerator({
        prefix: 'msg',
        size: 9,
      })();

      const streamContext = createResumableStreamContext({ waitUntil: after });
      
      // Create a resumable stream from the SSE stream
      await streamContext.createNewResumableStream(streamId, () => stream);

      // 👀 Update the chat with the active stream ID
      saveChat({ id: chatId, activeStreamId: streamId });
    },
  });
}
