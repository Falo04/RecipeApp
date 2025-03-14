import { useTranslation } from 'react-i18next';
import type { NavItem } from './sidebar';
import { Link, useRouterState } from '@tanstack/react-router';
import { Input } from '../ui/input';
import { SearchIcon, type LucideIcon } from 'lucide-react';
import clsx from 'clsx';

/**
  * The properties for {@link Navbar}
  */
export type NavbarProps = {
  title: String;
  icon: LucideIcon;
  navItems: NavItem[];
};

/**
  * The Navbar
  */
export function Navbar(props: NavbarProps) {
  const [tg] = useTranslation();

  const pathname = useRouterState().location.pathname;

  return (
    <div className='w-full bg-card p-4 px-6 flex border flex-row items-center justify-between gap-6'>
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
          <li>
            <Link to={item.url}><span className={clsx(pathname === item.url ? "pb-1 border-b-2 border-sidebar-primary text-zinc-900 dark:text-zinc-100" : "text-zinc-500 dark:text-zinc-400", "hover:text-zinc-900 dark:hover:text-zinc-100")}>{item.title}</span></Link>
          </li>
        ))}
      </ul>

      <Input className='w-1/5' type="text" placeholder={tg("search-recipe")} />
    </div>
  );
}
