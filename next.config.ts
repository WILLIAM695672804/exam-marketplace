import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empecher les packages Node.js d'etre bundles cote client
  serverExternalPackages: ["@prisma/adapter-pg", "pg", "pino", "bcryptjs"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  // Headers de sécurité
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  // Désactiver l'empreinte X-Powered-By
  poweredByHeader: false,
  // Permettre le HMR WebSocket depuis une IP réseau
  allowedDevOrigins: ["192.168.1.159"],
};

export default nextConfig;
