import { BaseSidebar } from '@/components/base/sidebar';
import { SidebarLayout } from '@/components/base/sidebar-layout';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import { Soup, Home, ReceiptText } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

/**
  * The properties for {@link FoodMenu}
  */
export type FoodMenuProps = {};

const data = {
  title: "Food App",
  mainIcon: Soup,
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
  * The FoodMenu
  */
export default function FoodMenu(props: FoodMenuProps) {
  const [t] = useTranslation("food-menu");


  return (
    <SidebarProvider>
      <SidebarLayout sidebar={
        <BaseSidebar title={data.title} mainIcon={data.mainIcon} navLinks={data.navMain} />
      } children={
        <SidebarInset>
          <Suspense>
            <Outlet />
          </Suspense>
        </SidebarInset>
      }>
      </SidebarLayout>
    </SidebarProvider>
  );
}

export const Route = createLazyFileRoute('/_food')({
  component: () => (
    <FoodMenu />
  )
})
