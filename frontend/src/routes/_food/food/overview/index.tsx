import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_food/food/overview/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_food/food/overview/"!</div>
}
