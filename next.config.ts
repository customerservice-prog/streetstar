import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            // Permit embedding only in Bajo Mundo TV's official Viral section.
            value: "frame-ancestors 'self' https://bajomundotv.com https://www.bajomundotv.com",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
