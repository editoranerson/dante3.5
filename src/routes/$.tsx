import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const App = lazy(() => import("@/App"));

export const Route = createFileRoute("/$")({
  head: () => ({
    meta: [
      { title: "Querido Dante — O universo interativo do Dante" },
      {
        name: "description",
        content:
          "Explore o universo de Querido Dante: biblioteca, chatstories, personagens, segredos, minijogos e muito mais.",
      },
      { property: "og:title", content: "Querido Dante — O universo interativo do Dante" },
      {
        property: "og:description",
        content:
          "Biblioteca, chatstories, personagens, segredos, minijogos e recompensas no universo de Querido Dante.",
      },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://queridodante.lovable.app/og-preview.jpg" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "https://queridodante.lovable.app/og-preview.jpg" },
    ],
  }),
  component: CatchAll,
});

function Loader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-grape-400 border-t-transparent" />
    </div>
  );
}

function CatchAll() {
  return (
    <ClientOnly fallback={<Loader />}>
      <Suspense fallback={<Loader />}>
        <App />
      </Suspense>
    </ClientOnly>
  );
}
