import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { z } from "zod";

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

  const result = streamText({
      // model: lmstudio('qwen/qwen3-14b'),
      model: lmstudio('lfm2-8b-a1b'),
    // model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    // model: groq("qwen/qwen3-32b"),
    messages: convertToModelMessages(messages),
    // stopWhen: stepCountIs(5),
    // tools: {
    //   weather: tool({
    //     description: "Get the weather in a location (fahrenheit)",
    //     inputSchema: z.object({
    //       location: z.string().describe("The location to get the weather for"),
    //     }),
    //     execute: async ({ location }) => {
    //       // Generate temperature in Fahrenheit that corresponds to 28-40°C
    //       // 28°C = 82.4°F, 40°C = 104°F
    //       const temperature = Math.round(Math.random() * (104 - 82) + 82);
    //       return {
    //         location,
    //         temperature,
    //       };
    //     },
    //   }),
    //   convertFahrenheitToCelsius: tool({
    //     description: "Convert a temperature in fahrenheit to celsius",
    //     inputSchema: z.object({
    //       temperature: z
    //         .union([z.number(), z.string()])
    //         .describe("The temperature in fahrenheit to convert"),
    //     }),
    //     execute: async ({ temperature }) => {
    //       const tempNumber =
    //         typeof temperature === "string"
    //           ? parseFloat(temperature)
    //           : temperature;
    //       const celsius = Math.round((tempNumber - 32) * (5 / 9));
    //       return {
    //         fahrenheit: tempNumber,
    //         celsius,
    //       };
    //     },
    //   }),
    // },
  });

  return result.toUIMessageStreamResponse();
}
