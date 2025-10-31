'use client';

import { UIMessage, useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { useState } from 'react';

export function ChatUiPersistence({
  id,
  initialMessages,
}: { id?: string | undefined; initialMessages?: UIMessage[] } = {}) {
  const [input, setInput] = useState('');

  const { sendMessage, messages } = useChat({
    id, // use the provided chat ID
    messages: initialMessages, // load initial messages
    transport: new DefaultChatTransport({
      api: '/api/chat/restore',
    }),
  });

  // console.log(';; pps ', initialMessages, messages);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage({ text: input });
      setInput('');
    }
  };

  return (
    <div>
      {messages.map((m) => (
        <div key={m.id}>
          {m.role === 'user' ? '👤 User: ' : '👾 AI: '}
          {m.parts
            .map((part) => (part.type === 'text' ? part.text : ''))
            .join('')}
        </div>
      ))}

      <form
        onSubmit={handleSubmit}
        className='fixed bottom-0 mb-20 w-full max-w-md'
      >
        <input
          className='w-full max-w-md rounded border border-zinc-300 p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900'
          value={input}
          placeholder='what do you want create today...'
          onChange={(e) => setInput(e.currentTarget.value)}
        />
        <button type='submit' className='ml-4'>
          Send
        </button>
      </form>
    </div>
  );
}
