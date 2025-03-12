import { useTranslation } from 'react-i18next';
import { SidebarContent, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, Sidebar } from './ui/sidebar';
import { Home, ReceiptText, Soup } from 'lucide-react';
import { Link } from '@tanstack/react-router';

/**
  * The properties for {@link AppSidebar}
  */
export type AppSidebarProps = {};


const data = {
  title: {
    name: "Food App",
    icon: Soup
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/food/dashboard",
      icon: Home,
    },
    {
      title: "Food",
      url: "/food/overview",
      icon: ReceiptText,
    }
  ]
}

/**
  * The AppSidebar
  */
export function AppSidebar(props: AppSidebarProps) {
  const [t] = useTranslation();

  return (
    <Sidebar collapsible='icon' className='pt-3 ps-1'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className='flex'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
              <data.title.icon className='size-4' />
            </div>
            <div className="ps-2 grid flex-1 text-left text-sm leading-tight justify-start items-center">
              <span className="truncate font-semibold">
                {data.title.name}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupContent>
          <SidebarMenu>
            {data.navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <Link to={item.url}>
                    <item.icon />
                    <span>{t(item.title)}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarContent>
    </Sidebar>

  );
}

