import { createFileRoute, Navigate } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
    component: () => <Navigate to={"/app/recipes"} search={{ page: 1, search: "" }} />,
});
