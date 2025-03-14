import type { SimpleTag } from '@/api/model/tag.interface';
import HeadingLayout from '@/components/base/heading-layout';
import { DataTable } from '@/components/base/data-table';
import { CreateTagDialog } from '@/components/dialogs/create-tag';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import TAGS_CONTEXT from '@/context/tags';
import type { ColumnDef } from '@tanstack/react-table';
import type { VariantProps } from 'class-variance-authority';
import React, { Suspense } from 'react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

/**
  * The properties for {@link TagsOverview}
  */
export type TagsOverviewProps = {};

/**
  * The TagsOverview
  */
export function TagsOverview(props: TagsOverviewProps) {
  const [t] = useTranslation();

  const tagContext = React.useContext(TAGS_CONTEXT);

  const [openCreateTag, setOpenCreateTag] = React.useState(false);

  const columns: ColumnDef<SimpleTag>[] = useMemo(() =>
    [
      {
        accessorKey: "name",
        header: "Name",
      },
      {
        accessorKey: "color",
        header: "Color",
        cell: ({ row }) => (
          <Badge variant={row.original.color.toLowerCase() as VariantProps<typeof badgeVariants>["variant"]}>{row.original.color}</Badge>
        )
      },
    ], [])

  return (
    <HeadingLayout heading={t("heading.tag-overview")} headingDescription={t("heading.tag-description")}
      headingChildren={
        <Button variant="primary" onClick={() => setOpenCreateTag(true)}>{t("button.create")}</Button>
      }>
      <DataTable data={tagContext.tags.items} columns={columns} />

      {openCreateTag && (
        <Suspense>
          <CreateTagDialog onClose={() => {
            setOpenCreateTag(false);
          }} />
        </Suspense>
      )}
    </HeadingLayout>
  );
}
