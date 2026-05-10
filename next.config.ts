import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR WebSocket from any private-network IP so the dev server works
  // regardless of which subnet the homelab is on.
  allowedDevOrigins: ['192.168.*', '10.*', '172.*'],
};

export default nextConfig;
