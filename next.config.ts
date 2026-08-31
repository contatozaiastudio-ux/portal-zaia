import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @ffmpeg-installer/ffmpeg locates its platform binary via a computed
  // require() path, which Turbopack's static bundler can't resolve. This
  // keeps it (and fluent-ffmpeg, which requires it) as a plain runtime
  // require instead of trying to bundle it — see src/lib/video-crop.ts.
  serverExternalPackages: ["@ffmpeg-installer/ffmpeg", "fluent-ffmpeg"],
};

export default nextConfig;
