import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@resvg/resvg-js", "sharp"],
  outputFileTracingIncludes: {
    "/api/card/[username]/face": ["./assets/fonts/**/*"],
    "/[username]": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
