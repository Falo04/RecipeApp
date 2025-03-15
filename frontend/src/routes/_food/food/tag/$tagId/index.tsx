import SubmenuLayout from '@/components/base/submenu-layout';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/**
  * The properties for {@link TagDetail}
  */
export type TagDetailProps = {};

/**
  * The TagDetail
  */
function TagDetail(props: TagDetailProps) {
  const [t] = useTranslation();

  return (
    <SubmenuLayout hrefBack='/food/tag' heading={t("heading.tag-detail-title")}
      headingDescription={t("heading.tag-detail-description")}>
    </SubmenuLayout>
  );
}

export const Route = createFileRoute('/_food/food/tag/$tagId/')({
  component: TagDetail,

})

