import type React from 'react';
import { Toaster } from 'sonner';

/**
  * The BaseLayout
  */
export function BaseLayout({
  navbar,
  children,
}: React.PropsWithChildren<{
  navbar: React.ReactNode;
}>) {
  return (
    <div className='relative isolate flex flex-col min-h-svh w-full bg-white max-lg:flex-col lg:bg-zinc-100 dark:bg-zinc-900 dark:lg:bg-zinc-950'>
      <div className='w-full'>{navbar}</div>

      <div className='flex grow m-2 p-4 lg:rounded-lg lg:bg-white md:p-8 lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:rind-white/10'>
        {children}
      </div>

      <div className='absolute'>
        <Toaster richColors expand={true} />
      </div>
    </div>
  );
}

