import {
  streamText,
  UIMessage,
  convertToModelMessages,
  tool,
  stepCountIs,
} from "ai";
import { z } from "zod";

import { groq } from "@ai-sdk/groq";

// import { openai } from '@ai-sdk/openai';
// model: groq('meta-llama/llama-4-scout-17b-16e-instruct'),

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
    // model: groq("llama-3.3-70b-versatile"),
    messages: convertToModelMessages(messages),
    stopWhen: stepCountIs(5),
    tools: {
      weather: tool({
        description: "Get the weather in a location (fahrenheit)",
        inputSchema: z.object({
          location: z.string().describe("The location to get the weather for"),
        }),
        execute: async ({ location }) => {
          // Generate temperature in Fahrenheit that corresponds to 28-40°C
          // 28°C = 82.4°F, 40°C = 104°F
          const temperature = Math.round(Math.random() * (104 - 82) + 82);
          return {
            location,
            temperature,
          };
        },
      }),
      convertFahrenheitToCelsius: tool({
        description: "Convert a temperature in fahrenheit to celsius",
        inputSchema: z.object({
          temperature: z
            .union([z.number(), z.string()])
            .describe("The temperature in fahrenheit to convert"),
        }),
        execute: async ({ temperature }) => {
          const tempNumber =
            typeof temperature === "string"
              ? parseFloat(temperature)
              : temperature;
          const celsius = Math.round((tempNumber - 32) * (5 / 9));
          return {
            fahrenheit: tempNumber,
            celsius,
          };
        },
      }),
    },
  });

  return result.toUIMessageStreamResponse();
}
