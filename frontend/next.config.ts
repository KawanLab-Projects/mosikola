import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'https',
        hostname: 'cdn.mosikola.com',
      },
      {
        protocol: 'https',
        hostname: 'pub-d55d1fb68fad45da9019893d2d32c092.r2.dev',
      },
    ],
  },
};

export default nextConfig;
