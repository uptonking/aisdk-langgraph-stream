import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { z } from "zod";

import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

import { after } from "next/server";

import {
  observe,
  updateActiveObservation,
  updateActiveTrace,
} from "@langfuse/tracing";
import { trace } from "@opentelemetry/api";

import { langfuseSpanProcessor } from "../../../utils/langfuse-instrumentation";


// import { groq } from "@ai-sdk/groq";
// model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),

const lmstudio = createOpenAICompatible({
  name: 'lmstudio',
  baseURL: 'http://localhost:1234/v1',
});

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

// export async function POST(req: Request) {

//   const { messages }: { messages: UIMessage[] } = await req.json();

//   const result = streamText({
//       // model: lmstudio('qwen/qwen3-14b'),
//       model: lmstudio('lfm2-8b-a1b'),
//     // model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
//     // model: groq("qwen/qwen3-32b"),
//     messages: convertToModelMessages(messages),
//     // stopWhen: stepCountIs(5),
//   });

//   return result.toUIMessageStreamResponse();
// }


const handler = async (req: Request) => {
  const {
    messages,
    chatId,
    userId,
  }: { messages: UIMessage[]; chatId: string; userId: string } =
    await req.json();

  // Set session id and user id on active trace
  const inputText = messages[messages.length - 1].parts.find(
    (part) => part.type === "text"
  )?.text;

  updateActiveObservation({
    input: inputText,
  });

  updateActiveTrace({
    name: "my-ai-sdk-trace",
    sessionId: chatId,
    userId,
    input: inputText,
  });

  const result = streamText({
    // model: lmstudio('qwen/qwen3-vl-4b'),
    model: lmstudio('qwen/qwen3-14b'),
    messages: convertToModelMessages(messages),
    // ... other streamText options ...
    experimental_telemetry: {
      isEnabled: true,
    },
    onFinish: async (result) => {
      updateActiveObservation({
        output: result.content,
      });
      updateActiveTrace({
        output: result.content,
      });

      // End span manually after stream has finished
      trace.getActiveSpan()?.end();
    },
    onError: async (error) => {
      updateActiveObservation({
        output: error,
        level: "ERROR"
      });
      updateActiveTrace({
        output: error,
      });

      // End span manually after stream has finished
      trace.getActiveSpan()?.end();
    },
  });

  // Important in serverless environments: schedule flush after request is finished
  after(async () => await langfuseSpanProcessor.forceFlush());

  return result.toUIMessageStreamResponse();
};

export const POST = observe(handler, {
  name: "handle-chat-message",
  // end observation _after_ stream has finished
  endOnExit: false,
});
