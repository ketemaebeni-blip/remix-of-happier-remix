import { createFileRoute } from "@tanstack/react-router";
import SweetBloom from "@/components/sweet-bloom/SweetBloom";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sweet Bloom — Dessert Boutique" },
      { name: "description", content: "Sweet Bloom — Premium cakes, cookies, shakes & more." },
      { property: "og:title", content: "Sweet Bloom — Dessert Boutique" },
      { property: "og:description", content: "Sweet Bloom — Premium cakes, cookies, shakes & more." },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600;1,700&family=DM+Sans:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return <SweetBloom />;
}
