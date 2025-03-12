import { Login } from '@/components/login'
import { UserProvider } from '@/context/user'
import { createFileRoute, Navigate } from '@tanstack/react-router'
import { Toaster } from 'sonner'

export const Route = createFileRoute('/')({
  component: () => (
    <>
      <Toaster richColors />
      {/* <Navigate to={"/food/dashboard"} /> */}
      <UserProvider>
        <Navigate to={"/food/dashboard"} />
      </UserProvider>
    </>
  ),
})


