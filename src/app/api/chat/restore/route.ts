import { streamText, convertToModelMessages, createIdGenerator } from 'ai';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';
import { saveChat } from '@/utils/chat-store';
import { MyUIMessage } from '@/utils/chat-schema';

// import { groq } from "@ai-sdk/groq";
// model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, id: chatId }: { messages: MyUIMessage[]; id: string } =
    await req.json();
  console.log(';; req messages ', chatId, JSON.stringify(messages, null, 3));

  const result = streamText({
    model: lmstudio('qwen/qwen3-vl-4b'),
    // model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: ({ messages }) => {
      // console.log(';; onFin ', chatId, JSON.stringify(messages, null, 2));
      saveChat({ id: chatId, messages });
    },
    // Generate consistent server-side IDs for persistence:
    generateMessageId: createIdGenerator({
      prefix: 'msg',
      size: 6,
    }),
  });
}
