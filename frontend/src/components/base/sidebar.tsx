import { useTranslation } from 'react-i18next';
import { Link } from '@tanstack/react-router';
import { Sidebar, SidebarContent, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../ui/sidebar';

export interface NavItem {
  title: string;
  url: string;
  icon: any,
}

/**
  * The properties for {@link AppSidebar}
  */
export type BaseSidebarProps = {
  title: string;
  mainIcon: any;
  navLinks: NavItem[];
};

/**
  * The AppSidebar
  */
export function BaseSidebar(props: BaseSidebarProps) {
  const [t] = useTranslation();

  return (
    <Sidebar collapsible='icon' className='pt-3 ps-1'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem className='flex'>
            <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
              <props.mainIcon className='size-4' />
            </div>
            <div className="ps-2 grid flex-1 text-left text-sm leading-tight justify-start items-center">
              <span className="truncate font-semibold">
                {props.title}
              </span>
            </div>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroupContent>
          <SidebarMenu>
            {props.navLinks.map((item) => (
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

