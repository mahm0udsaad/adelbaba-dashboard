import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.adil-baba.com",
        port: "",
        pathname: "/**"
      },
      {
        protocol: "https",
        hostname: "shippo-static-v2.s3.amazonaws.com",
        port: "",
        pathname: "/**"
      }
    ]
  },
}

export default nextConfig


