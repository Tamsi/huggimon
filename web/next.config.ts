import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/card/[username]/face": ["./assets/fonts/**/*"],
    "/[username]": ["./assets/fonts/**/*"],
  },
};

export default nextConfig;
