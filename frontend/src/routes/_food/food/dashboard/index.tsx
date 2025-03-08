import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_food/food/dashboard/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_food/food/dashboard/"!</div>
}
