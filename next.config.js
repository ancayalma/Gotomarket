/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript errors will now fail the build (safety net removed)
  // typescript: { ignoreBuildErrors: true },
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
        source: "/campaigns/boards/:path*",
        destination: "/projects/boards/:path*",
        permanent: true,
      },
      {
        source: "/campaigns/tasks/:path*",
        destination: "/projects/tasks/:path*",
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
        // Apply CSP to all routes
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "img-src 'self' data: blob: https:",
              "connect-src 'self' https: wss:",
              "media-src 'self' blob: https:",
              // Allow Surge to be embedded in an iFrame from this app
              "frame-src 'self' https://surge.basalthq.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
  output: "standalone",
};

module.exports = nextConfig;

