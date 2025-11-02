import { readChat } from '@/utils/chat-store';
import { UI_MESSAGE_STREAM_HEADERS } from 'ai';
import { after } from 'next/server';
import { createResumableStreamContext } from 'resumable-stream';

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  // Reads the chat ID from the route params
  const { id } = await params;

  // Loads the chat data to check for an active stream
  const chat = await readChat(id);

  if (chat.activeStreamId == null) {
    // Returns 204 (No Content) if no stream is active
    return new Response(null, { status: 204 });
  }

  // /Resumes the existing stream if one is found
  const streamContext = createResumableStreamContext({
    // The after function from Next.js allows work to continue after the response has been sent.
    // This ensures that the resumable stream persists in Redis even after the initial response
    // is returned to the client, enabling reconnection later.
    waitUntil: after,
  });

  console.log(';; stream-resume ', chat.activeStreamId);

  return new Response(
    await streamContext.resumeExistingStream(chat.activeStreamId),
    { headers: UI_MESSAGE_STREAM_HEADERS },
  );
}
