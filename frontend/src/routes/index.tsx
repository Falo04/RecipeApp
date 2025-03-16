import { UserProvider } from '@/context/user'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export const Route = createFileRoute('/')({
  component: () => (
    <>
      <Toaster richColors />
      <UserProvider>
        <Navigate to={"/app/recipes"} />
      </UserProvider>
    </>
  ),
})


