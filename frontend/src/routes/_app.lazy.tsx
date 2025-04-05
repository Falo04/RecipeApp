import { BaseLayout } from '@/components/base/base-layout';
import { Navbar } from '@/components/base/navbar';
import { TagsProvider } from '@/context/tags';
import { UserProvider } from '@/context/user';
import { createLazyFileRoute, Outlet } from '@tanstack/react-router';
import { Soup, } from 'lucide-react';
import { Suspense } from 'react';
import { useTranslation } from 'react-i18next';

/**
  * The properties for {@link FoodMenu}
  */
export type FoodMenuProps = {};

const data = {
  title: "Recipe App",
  mainIcon: Soup,
  navMain: [
    {
      title: "Recipes",
      url: "/app/recipes",
    },
    {
      title: "Tag",
      url: "/app/tag",
    }
  ]
}

/**
  * The FoodMenu
  */
export default function FoodMenu(props: FoodMenuProps) {
  const [t] = useTranslation("food-menu");

  return (
    <BaseLayout navbar={<Navbar title={data.title} icon={data.mainIcon} navItems={data.navMain} />} children={
      <Suspense>
        <Outlet />
      </Suspense>
    }>
    </BaseLayout>
  );
}

export const Route = createLazyFileRoute('/_app')({
  component: () => (
    <UserProvider>
      <TagsProvider>
        <FoodMenu />
      </TagsProvider>
    </UserProvider>
  )
})
