import { BaseLayout } from '@/components/base/base-layout';
import { Navbar } from '@/components/base/navbar';
import { TagsProvider } from '@/context/tags';
import USER_CONTEXT, { UserProvider } from '@/context/user';
import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import { Soup, Home, ReceiptText, TagIcon } from 'lucide-react';
import React, { Suspense } from 'react';
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
    },
    {
      title: "Recipes",
      url: "/food/overview",
    },
    {
      title: "Tag",
      url: "/food/tag",
    }
  ]
}

/**
  * The FoodMenu
  */
export default function FoodMenu(props: FoodMenuProps) {
  const [t] = useTranslation("food-menu");

  const user = React.useContext(USER_CONTEXT);

  return (
    <BaseLayout navbar={<Navbar title={data.title} icon={data.mainIcon} navItems={data.navMain} />} children={
      <Suspense>
        <Outlet />
      </Suspense>
    }>
    </BaseLayout>
  );
}

export const Route = createLazyFileRoute('/_food')({
  component: () => (
    <UserProvider>
      <TagsProvider>
        <FoodMenu />
      </TagsProvider>
    </UserProvider>
  )
})
