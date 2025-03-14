import { useTranslation } from 'react-i18next';
import { Link, useRouterState } from '@tanstack/react-router';
import { Input } from '../ui/input';
import { MenuIcon, XIcon, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';
import { useIsMobile } from '@/hooks/use-mobile';
import { useState } from 'react';
import { Button } from '../ui/button';

export interface NavItem {
  title: string;
  url: string;
}

/**
  * The properties for {@link Navbar}
  */
export type NavbarProps = {
  title: String;
  icon: LucideIcon;
  navItems: NavItem[];
};

export function Navbar(props: NavbarProps) {
  const [tg] = useTranslation();
  const [mobileNavbar, setMobileNavbar] = useState(false);
  const pathname = useRouterState().location.pathname;
  const isMobile = useIsMobile();

  return (
    <nav className='w-full bg-card p-4 px-6'>
      <div className='flex flex-row items-center justify-between gap-6 relative'>
        <div className='flex items-center gap-4'>
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <props.icon className='size-4' />
          </div>
          <div className="justify-start items-center">
            <span className="truncate font-semibold">
              {props.title}
            </span>
          </div>
        </div>

        <ul className='hidden md:flex items-center gap-10 text-card-foreground'>
          {props.navItems.map((item) => (
            <li key={item.url}>
              <Link to={item.url}>
                <span className={clsx(pathname === item.url ? "pb-1 border-b-2 border-sidebar-primary text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400", "hover:text-zinc-900 dark:hover:text-zinc-100")}>
                  {item.title}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <Input className='w-1/5 hidden md:block' type="text" placeholder={tg("search-recipe")} />

        {isMobile && (
          <Button variant="ghost" onClick={() => setMobileNavbar(!mobileNavbar)}>
            {mobileNavbar ? (
              <XIcon className='size-5' />
            ) : (
              <MenuIcon className='size-5' />
            )}
          </Button>
        )}
      </div>

      {isMobile && (
        <div
          className={clsx(
            "flex-1 justify-self-center pb-3 mt-8 md:block md:pb-0 md:mt-0 transition-all duration-300 ease-in-out", // Transition for smooth effect
            mobileNavbar ? "flex opacity-100 translate-y-0" : "hidden opacity-0 translate-y-4"
          )}
        >
          <ul className="items-center justify-center space-y-4 md:flex">
            {props.navItems.map((item) => (
              <li key={item.url}>
                <button onClick={() => setMobileNavbar(!mobileNavbar)}>
                  <Link to={item.url}>
                    <span className={clsx(pathname === item.url ? "pb-1 border-b-2 border-sidebar-primary text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400", "hover:text-zinc-900 dark:hover:text-zinc-100")}>
                      {item.title}
                    </span>
                  </Link>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </nav>
  );
}

