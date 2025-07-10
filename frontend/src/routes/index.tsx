import { UserProvider } from "@/context/user";
import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: () => (
        <UserProvider>
            <Navigate to={"/app/recipes"} />
        </UserProvider>
    ),
});
