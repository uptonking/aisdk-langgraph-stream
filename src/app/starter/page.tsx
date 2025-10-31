'use client';

import Image from 'next/image';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';
import { Streamdown } from 'streamdown';

export default function ChatWithAi() {
  const [input, setInput] = useState('');
  const { messages, sendMessage, status } = useChat({
    // id: `${new Date().toISOString()}`,
    // resume: true,
  });
  // @ts-expect-error test
  globalThis['msgg'] = messages;

  // console.log(';; pps ', messages);

  return (
    <div className='grid min-h-screen grid-rows-[20px_1fr_20px] items-center justify-items-center gap-16 p-8 pb-20 font-sans sm:p-20'>
      <div className=''>
        <h2 className='text-2xl font-bold text-teal-500'>Chat with AI</h2>
      </div>
      <main className='row-start-2 flex w-full flex-col items-center justify-center gap-[32px]'>
        {/* <p>Go Back</p> */}
        {/* <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left'>
          <li className='mb-2 tracking-[-.01em]'>
            Get started with the Groq API .
          </li>
        </ol> */}

        <div className='stretch mx-auto flex w-full max-w-6xl flex-col py-24'>
          {/* 水平布局容器，用于并排显示两个聊天视图 */}
          <div className='flex w-full gap-8'>
            {/* 左侧：原始消息视图 */}
            <div className='markdown-content flex-1'>
              <h3 className='mb-4 text-lg font-semibold text-blue-600'>
                原始消息视图 (仅文本)
              </h3>
              {messages.map((message) => (
                <div key={message.id} className='whitespace-pre-wrap'>
                  <div className='mt-3 font-bold'>
                    {message.role === 'user' ? '👤 User: ' : '👾 AI: '}
                  </div>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <div
                            className='mt-1.5 border-t border-neutral-400'
                            key={`${message.id}-${i}`}
                          >
                            {part.text}
                          </div>
                        );
                      case 'tool-weather':
                      case 'tool-convertFahrenheitToCelsius':
                        return (
                          <pre
                            className='mt-1.5 border-t border-indigo-400'
                            key={`${message.id}-${i}`}
                          >
                            {JSON.stringify(part, null, 2)}
                          </pre>
                        );
                    }
                  })}
                </div>
              ))}
            </div>

            {/* 右侧：Streamdown 视图 */}
            <div className='markdown-content flex-1'>
              <h3 className='mb-4 text-lg font-semibold text-green-600'>
                Streamdown 视图 (code/table/mermaid)
              </h3>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.parts
                    .filter((part) => part.type === 'text')
                    .map((part, index) => (
                      <Streamdown
                        isAnimating={status === 'streaming'}
                        className='prose max-w-none prose-neutral dark:prose-invert'
                        key={index}
                      >
                        {part.text}
                      </Streamdown>
                    ))}
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage({ text: input });
              setInput('');
            }}
          >
            <input
              className='fixed bottom-0 mb-8 w-full max-w-md rounded border border-zinc-300 p-2 shadow-xl dark:border-zinc-800 dark:bg-zinc-900'
              value={input}
              placeholder='what do you want create today...'
              onChange={(e) => setInput(e.currentTarget.value)}
            />
          </form>
        </div>
      </main>
    </div>
  );
}
