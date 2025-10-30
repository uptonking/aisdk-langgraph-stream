import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from 'ai';
import { z } from 'zod';

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

// import { groq } from "@ai-sdk/groq";
// import { openai } from '@ai-sdk/openai';
// model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  // console.log(';; GROQ_API_KEY ', process.env['GROQ_API_KEY'])

  const { messages }: { messages: UIMessage[] } = await req.json();
  // console.log(';; req messages ', JSON.stringify(messages, null, 3));

  const result = streamText({
    model: lmstudio('qwen/qwen3-vl-4b'),
    // model: lmstudio('lfm2-8b-a1b'),
    // model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    // model: groq("qwen/qwen3-32b"),
    messages: convertToModelMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
