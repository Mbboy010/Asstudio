import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        // Catches all Firebase auth internal requests on your custom domain
        source: '/__/auth/:path*', 
        // Forwards them securely to your actual Firebase project
        destination: 'https://as-studio1.firebaseapp.com/__/auth/:path*', 
      },
    ];
  },
};

export default nextConfig;
