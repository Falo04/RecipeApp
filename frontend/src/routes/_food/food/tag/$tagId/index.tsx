import { Api } from '@/api/api';
import type { SimpleRecipe } from '@/api/model/recipe.interface';
import { DataTable } from '@/components/base/data-table';
import SubmenuLayout from '@/components/base/submenu-layout';
import { createFileRoute } from '@tanstack/react-router';
import type { ColumnDef } from '@tanstack/react-table';
import { Router } from 'lucide-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/**
  * The properties for {@link TagDetail}
  */
export type TagDetailProps = {};

/**
  * The TagDetail
  */
function TagDetail(props: TagDetailProps) {
  const [t] = useTranslation("tag");
  const [tg] = useTranslation();

  const data = Route.useLoaderData();
  if (!data) {
    return;
  }

  const columns: ColumnDef<SimpleRecipe>[] = useMemo(() => [
    {
      accessorKey: "name",
      header: () => <span>{tg("table.name")}</span>
    },
    {
      accessorKey: "description",
      header: () => <span>{tg("table.description")}</span>
    }
  ], []);

  return (
    <SubmenuLayout hrefBack='/food/tag' heading={t("heading.detail-title")}
      headingDescription={t("heading.detail-description")}>
      <DataTable href="/food/overview" data={data.items} columns={columns} />
    </SubmenuLayout>
  );
}

export const Route = createFileRoute('/_food/food/tag/$tagId/')({
  component: TagDetail,
  loader: async ({ params }) => {
    const res = await Api.tags.getRecipesByTag(params.tagId);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    return res.data;
  }

})

