import { convertAisdkMsgToLangchainMsg } from "@/utils/message-converter";

export async function POST(request: Request) {
  const { messages } = await request.json();
  // console.log(';; req-graph-msg ', JSON.stringify(messages, null, 3));

  const langgraphMessage = Array.isArray(messages) && messages.length > 0 ? messages.map(msg => convertAisdkMsgToLangchainMsg(msg)) : [];

  // Forward to your LangGraph API
  // const response = await fetch('https://your-langgraph-api.com/stream', {
  const response = await fetch('http://localhost:2024/runs/stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      {
        "input": {
          "messages": langgraphMessage
        },
        "stream_mode": [
          "messages-tuple",
          "values"
        ],
        "stream_resumable": true,
        "assistant_id": "agent",
        "on_disconnect": "continue"
      }
      //   {
      //   "assistant_id": "agent",
      //   "input": {
      //     "messages": [
      //       {
      //         "role": "human",
      //         "content": "count from zz1 to zz5, every item on a separate line  /no_think "
      //       }
      //     ]
      //   },
      //   "stream_mode": "messages-tuple"
      // }
    ),
  });

  // Return the SSE stream directly
  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
    },
  });
}