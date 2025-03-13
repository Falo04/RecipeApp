import { Api } from '@/api/api';
import type { SimpleRecipe } from '@/api/model/recipe.interface';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { DataTable } from '@/components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import HeadingLayout from '@/components/base/heading-layout';

/**
  * The properties for {@link FoodOverview}
  */
export type FoodOverviewProps = {};

const columns: ColumnDef<SimpleRecipe>[] = [
  {
    accessorKey: "name",
    // header: ({ column }) => {
    //   return (
    //     <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
    //       "table.name"
    //     </Button>
    //   )
    // },
    header: "name",
  },
  {
    accessorKey: "description",
    header: "Description",
  },
  {
    accessorKey: "tags",
    header: "Tags",
  }
]

/**
  * The FoodOverview
  */
function FoodOverview(props: FoodOverviewProps) {
  const [t] = useTranslation();


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

    if (!res.data) {
      toast.error("something happened, got empty data");
    }

    return res.data;
  }
})
