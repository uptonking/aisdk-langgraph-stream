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

  // console.log(';; msg ', messages);

  return (
    <div className='font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
      <div className=''>
        <h2 className='text-2xl font-bold text-teal-500 '>Chat with AI</h2>
      </div>
      <main className='flex flex-col gap-[32px] row-start-2 items-center justify-center w-full'>
        {/* <p>Go Back</p> */}
        {/* <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left'>
          <li className='mb-2 tracking-[-.01em]'>
            Get started with the Groq API .
          </li>
        </ol> */}

        <div className='flex flex-col w-full max-w-6xl py-24 mx-auto stretch'>
          {/* 水平布局容器，用于并排显示两个聊天视图 */}
          <div className='flex gap-8 w-full'>
            {/* 左侧：原始消息视图 */}
            <div className='flex-1 markdown-content'>
              <h3 className='text-lg font-semibold mb-4 text-blue-600'>
                原始消息视图 (仅文本)
              </h3>
              {messages.map((message) => (
                <div key={message.id} className='whitespace-pre-wrap'>
                  <div className='font-bold mt-3'>
                    {message.role === 'user' ? '👤 User: ' : '👾 AI: '}
                  </div>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case 'text':
                        return (
                          <div
                            className='border-t border-neutral-400 mt-1.5'
                            key={`${message.id}-${i}`}
                          >
                            {part.text}
                          </div>
                        );
                      case 'tool-weather':
                      case 'tool-convertFahrenheitToCelsius':
                        return (
                          <pre
                            className='border-t border-indigo-400 mt-1.5'
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
            <div className='flex-1 markdown-content'>
              <h3 className='text-lg font-semibold mb-4 text-green-600'>
                Streamdown 视图 (code/table/mermaid)
              </h3>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.parts
                    .filter((part) => part.type === 'text')
                    .map((part, index) => (
                      <Streamdown
                        isAnimating={status === 'streaming'}
                        className='prose prose-neutral dark:prose-invert max-w-none'
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
              className='fixed dark:bg-zinc-900 bottom-0 w-full max-w-md p-2 mb-8 border border-zinc-300 dark:border-zinc-800 rounded shadow-xl'
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
