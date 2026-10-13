import { createFileRoute } from "@tanstack/react-router";

import { getGetMeQueryOptions } from "@/api/generated";

export const Route = createFileRoute("/_app")({
    // Without a session the request throws a redirect to the login
    beforeLoad: ({ context }) => context.queryClient.query(getGetMeQueryOptions()),
});
