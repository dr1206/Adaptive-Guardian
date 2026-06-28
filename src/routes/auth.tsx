import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — AdaptiveGuard AI" },
      {
        name: "description",
        content:
          "Enter the AdaptiveGuard vault. Identity, verification, and behavioral enrollment for AI-powered continuous authentication.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <Outlet />,
});
