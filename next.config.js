/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    "puppeteer-core", 
    "puppeteer-extra", 
    "puppeteer-extra-plugin-stealth", 
    "puppeteer", 
    "@sparticuz/chromium"
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: '4mb',
    },
  },
  // TypeScript errors will now fail the build (safety net removed)
  // typescript: { ignoreBuildErrors: true },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "echo.basalthq.com",
      },
      {
        protocol: "https",
        hostname: "engram1.blob.core.windows.net",
      },
      {
        protocol: "https",
        hostname: "basaltcrm.s3.us-west-or.io.cloud.ovh.us",
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_VERSION: require("./package.json").version,
  },
  async redirects() {
    return [
      {
        source: "/voicehub",
        destination: "/echo",
        permanent: true,
      },
      {
        source: "/en/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/de/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/cz/:path*",
        destination: "/:path*",
        permanent: true,
      },
      {
        source: "/uk/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
    ];
  },
  // output: "standalone", // Disabled for Plesk/Windows to avoid NTFS invalid file path errors
};

module.exports = nextConfig;

