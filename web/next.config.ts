import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.cloudflare.steamstatic.com",
        pathname: "/apps/dota2/images/dota_react/heroes/**",
      },
      {
        protocol: "https",
        hostname: "avatars.steamstatic.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "avatars.fastly.steamstatic.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
