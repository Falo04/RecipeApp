import { Api } from '@/api/api';
import SubmenuLayout from '@/components/base/submenu-layout';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

/**
  * The properties for {@link RecipeDetails}
  */
export type RecipeDetailProps = {};

/**
  * The RecipeDetails
  */
function RecipeDetail(props: RecipeDetailProps) {
  const [t] = useTranslation("recipe");

  const data = Route.useLoaderData();
  if (!data) {
    return;
  }

  return (
    <SubmenuLayout heading={t("heading.detail-heading")} headingDescription={t("heading.detail-description")} hrefBack={"/app/recipes"} objectName={data.name}>
      <div className='flex flex-col gap-2 lg:grid lg:grid-cols-2'>
        <div>
        </div>
        <div>
        </div>
      </div>
    </SubmenuLayout>
  );
}

export const Route = createFileRoute('/_app/app/recipes/$recipeId/')({
  component: RecipeDetail,
  loader: async ({ params }) => {
    const res = await Api.recipe.getById(params.recipeId);
    if (res.error) {
      toast.error(res.error.message);
      return;
    }
    return res.data;
  }
})

