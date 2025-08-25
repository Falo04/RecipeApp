import { createFileRoute, Navigate } from "@tanstack/react-router";
import { AccountProvider } from "@/context/account.tsx";

export const Route = createFileRoute("/")({
    component: () => (
        <AccountProvider>
            <Navigate to={"/app/recipes"} search={{ page: 1, search: "" }} />
        </AccountProvider>
    ),
});
