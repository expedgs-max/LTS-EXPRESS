import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    'serumal-elidia-unfatuitously.ngrok-free.dev',
    'fiber-urologist-treason.ngrok-free.dev',
    '*.ngrok-free.dev',
    '192.168.1.5',
    '192.168.1.2',
    '192.168.1.*',
  ],
  env: {
    //   SERVER_DOMAIN: process.env.SERVER_DOMAIN,
    //   NEXT_PUBLIC_SERVER_DOMAIN: process.env.NEXT_PUBLIC_SERVER_DOMAIN,
    //   NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    //   SERVER_LOCAL: process.env.SERVER_LOCAL,
    //   IMGS_DOMAIN: process.env.IMGS_DOMAIN,
    //   WS_SERVER: process.env.WS_SERVER,
    //   MAPBOX_API_KEY: process.env.MAPBOX_API_KEY,
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_AUTH_TOKEN: process.env.SENTRY_AUTH_TOKEN,
    SENTRY_TELEMETRY: process.env.SENTRY_TELEMETRY || "0",
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.6',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.5',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.2',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.5',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.4',
      },
      {
        protocol: 'http',
        hostname: '192.168.1.50',
      },
      {
        protocol: 'http',
        hostname: '192.168.163.149',
      },
      {
        protocol: 'http',
        hostname: '192.168.*.*',
      },
      {
        protocol: 'https',
        hostname: 'fiber-urologist-treason.ngrok-free.dev',
      },
      {
        protocol: 'https',
        hostname: 'serumal-elidia-unfatuitously.ngrok-free.dev',
      },
      {
        protocol: 'https',
        hostname: 'steerable-overlap-nutlike.ngrok-free.dev',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase the limit to 10 MB
    },
    allowedDevOrigins: [
      'localhost:3000',
      '127.0.0.1:3000',
      'serumal-elidia-unfatuitously.ngrok-free.dev',
      'fiber-urologist-treason.ngrok-free.dev',
      '*.ngrok-free.dev',
      '192.168.1.5',
      '192.168.1.2'
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config) => {
    config.module.exprContextCritical = false;
    return config;
  },
  async rewrites() {
    const localDjango = 'http://127.0.0.1:8000';
    return [
      {
        source: '/media/:path*',
        destination: `${localDjango}/media/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `${localDjango}/images/:path*`,
      },
    ];
  },
};

export default nextConfig;