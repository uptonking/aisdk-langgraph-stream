'use client';

import Image from 'next/image';
import { useChat } from '@ai-sdk/react';
import { useState } from 'react';

export default function ChatWithGroqApi() {
  const [input, setInput] = useState('');
  const { messages, sendMessage } = useChat({
    // id: `${new Date().toISOString()}`,
    // resume: true,
  });
  // @ts-expect-error test
  globalThis['msgg'] = messages;

  return (
    <div className='font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20'>
      <main className='flex flex-col gap-[32px] row-start-2 items-center justify-center w-full'>
        {/* <p>Go Back</p> */}
        {/* <ol className='font-mono list-inside list-decimal text-sm/6 text-center sm:text-left'>
          <li className='mb-2 tracking-[-.01em]'>
            Get started with the Groq API .
          </li>
        </ol> */}

        <div className='flex flex-col w-full max-w-md py-24 mx-auto stretch'>
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

        {/* <div className="flex gap-4 items-center flex-col sm:flex-row">
          <a
            className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Read our docs
          </a>
        </div> */}
      </main>
      {/* <footer className='row-start-3 flex gap-[24px] flex-wrap items-center justify-center'>
        <a
          className='flex items-center gap-2 hover:underline hover:underline-offset-4'
          href='https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app'
          target='_blank'
          rel='noopener noreferrer'
        >
          <Image
            aria-hidden
            src='/globe.svg'
            alt='Globe icon'
            width={16}
            height={16}
          />
          Go to nextjs.org
        </a>
      </footer> */}
    </div>
  );
}
