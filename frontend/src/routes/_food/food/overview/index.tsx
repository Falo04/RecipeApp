import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';

/**
  * The properties for {@link FoodOverview}
  */
export type FoodOverviewProps = {};

/**
  * The FoodOverview
  */
function FoodOverview(props: FoodOverviewProps) {
  const [t] = useTranslation();

  return (
    <div></div>
  );
}

export const Route = createFileRoute('/_food/food/overview/')({
  component: FoodOverview,
  loader: async ({ deps }) => {

  }
})
