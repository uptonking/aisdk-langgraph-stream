# vercel ai sdk test

## overview

- aisdk example app following [Next.js App Router tutorial with `@ai-sdk/react`](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)

```bash
pnpm i
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- ai api key uses [Groq](https://ai-sdk.dev/providers/ai-sdk-providers/groq)
  - it's easy to switch to other ai providers
  - ollama/lmstudio is tested locally

## examples

- http://localhost:3000/starter
  - chat split view with text and `streamdown`

- http://localhost:3000/chat-restore
  - restore chat contents when page reloads
  - for multi-turn conversation, previous messages are sent along with latest message
# notes
- this example shows how to use Multi-Step Tool Calls
  - 👀 some ai is not smart, the tools provided just wont be called.
  - in my test, groq `llama-3.3-70b-versatile` will mostly do multi tool calls,  `meta-llama/llama-4-scout-17b-16e-instruct` only calls one tool.

## License

MIT
