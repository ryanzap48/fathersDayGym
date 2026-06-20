import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Lift — strength tracking",
    short_name: "Lift",
    description: "Log workouts, track body weight, and watch your strength climb.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#fcfcfb",
    theme_color: "#e2502c",
    orientation: "portrait",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
