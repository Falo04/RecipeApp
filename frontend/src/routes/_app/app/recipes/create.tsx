import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/app/recipes/create')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_app/app/recipes/create"!</div>
}
