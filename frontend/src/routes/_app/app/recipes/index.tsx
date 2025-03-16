import { Api } from '@/api/api';
import type { SimpleRecipeWithTags } from '@/api/model/recipe.interface';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DataTable } from '@/components/base/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import HeadingLayout from '@/components/base/heading-layout';
import { useMemo } from 'react';
import { BadgeButton } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

/**
  * The properties for {@link FoodOverview}
  */
export type FoodOverviewProps = {};



/**
  * The FoodOverview
  */
function FoodOverview(props: FoodOverviewProps) {
  const [t] = useTranslation("recipe");
  const [tg] = useTranslation();

  const columns: ColumnDef<SimpleRecipeWithTags>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: () => <span>{tg("table.name")}</span>,
      cell: ({ row }) => (
        <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}  >
          <div className='max-w-[180px] sm:max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap'> <span>{row.original.name}</span></div>
        </Link >
      )
    },
    {
      accessorKey: "description",
      header: () => <span>{tg("table.description")}</span>,
      cell: ({ row }) => (
        <Link to={"/app/recipes/$recipeId"} params={{ recipeId: row.original.uuid }}  >
          <div className='max-w-[180px] sm:max-w-[400px] overflow-hidden text-ellipsis whitespace-nowrap'> <span>{row.original.name}</span></div>
        </Link >
      )
    },
    {
      accessorKey: "tags",
      header: () => <span>{tg("table.tags")}</span>,
      cell: ({ row }) => (
        <Link to='/app/recipes/$recipeId' params={{ recipeId: row.original.uuid }}>
          <div className="flex flex-wrap gap-1">
            {row.original.tags.map((tag) => (
              <Link to='/app/tag/$tagId' params={{ tagId: tag.uuid }}>
                <BadgeButton key={tag.uuid} variant='blue'>
                  {tag.name}
                </BadgeButton>
              </Link>
            ))}
          </div>
        </Link>
      )
    },
  ], []);

  // const { offset, limit } = Route.useSearch();

  const data = Route.useLoaderData();
  if (!data) {
    return;
  }

  return (
    <HeadingLayout heading={t("heading.overview-title")} headingDescription={t("heading.overview-description")}
      headingChildren={
        <Link to={"/app/recipes/create"}>
          <Button variant="primary">{t("button.create")}</Button>
        </Link>
      }>
      <DataTable data={data.items} columns={columns} />
    </HeadingLayout>
  );
}

export const Route = createFileRoute('/_app/app/recipes/')({
  component: FoodOverview,
  // loaderDeps: ({ search: { offset, limit } }) => ({ offset, limit }),
  // loader: async ({ deps: { offset, limit } }) => {
  loader: async () => {
    const res = await Api.recipe.getAll(50, 0);

    if (res.error) {
      toast.error(res.error.message);
      return;
    }

    return res.data;
  }
})
