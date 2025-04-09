import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_app/app/dashboard/')({
  component: UpdateRecipe,
})

function UpdateRecipe() {
  return <div className='grid grid-cols-1 grid-row-1 lg:grid-cols-2 lg:grid-row-2 xl:grid-cols-3 gap-4'>
  </div>
}
