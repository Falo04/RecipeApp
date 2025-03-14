import type React from 'react';
import { useTranslation } from 'react-i18next';

/**
  * The BaseLayout
  */
export function BaseLayout({
  navbar,
  children,
}: React.PropsWithChildren<{
  navbar: React.ReactNode;
}>) {
  const [t] = useTranslation();

  return (
    <div className='relative isolate flex flex-col min-h-svh w-full bg-white max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950'>
      <div className='w-full'>{navbar}</div>

      <div className='grow p-4 lg:rounded-lg lg:bg-white lg:p-8 lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:rind-white/10'>
        <div className='mx-auto overflow-hidden'>{children}</div>
      </div>
    </div>
  );
}

