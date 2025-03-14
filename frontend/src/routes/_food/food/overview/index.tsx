import { Api } from '@/api/api';
import type { SimpleRecipe } from '@/api/model/recipe.interface';
import { createFileRoute } from '@tanstack/react-router';
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
  const [t] = useTranslation();

  const columns: ColumnDef<SimpleRecipe>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: "Name",
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      header: "Tags",
      accessorKey: "tags",
      cell: ({ row }) => {
        const tags = row.original.tags; // Get the full tags array
        return (
          <div className="flex flex-wrap gap-1">
            {tags.map((tag) => (
              <BadgeButton key={tag.uuid} variant='blue'>
                {tag.name}
              </BadgeButton>
            ))}
          </div>
        );
      },
    },
  ], []);

  // const { offset, limit } = Route.useSearch();

  const data = Route.useLoaderData();
  if (!data) {
    return;
  }

  return (
    <HeadingLayout heading={t("heading.recipe-overview")} headingDescription={t("heading.heading-description")}>
      <DataTable data={data.items} columns={columns} />
    </HeadingLayout>
  );
}

export const Route = createFileRoute('/_food/food/overview/')({
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
