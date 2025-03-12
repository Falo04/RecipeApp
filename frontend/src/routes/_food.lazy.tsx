import { AppSidebar } from '@/components/app-sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { Sidebar, SidebarContent, SidebarGroupContent, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { createLazyFileRoute, Link, Outlet, useRouter, useRouterState } from '@tanstack/react-router';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

/**
  * The properties for {@link FoodMenu}
  */
export type FoodMenuProps = {};

/**
  * The FoodMenu
  */
export default function FoodMenu(props: FoodMenuProps) {
  const [t] = useTranslation("food-menu");

  const pathname = useRouterState().location.pathname.split("/")[2];

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className='flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12'>
          <div className='flex items-center gap-2 px-4'>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className='hidden md:block'>
                  <Link to='/food/dashboard'>
                    {t("breadcrumb.dashboard")}
                  </Link>
                </BreadcrumbItem>
                {pathname === "dashboard" ? <></> :
                  <>
                    < BreadcrumbSeparator className='hidden md:block' />
                    <BreadcrumbItem> {pathname}
                    </BreadcrumbItem>
                  </>}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <Suspense>
          <Outlet />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  );
}

export const Route = createLazyFileRoute('/_food')({
  component: () => (
    <FoodMenu />
  )
})
