/** @type {import('next').NextConfig} */
const nextConfig = {
  // `standalone` emits a self-contained server bundle in .next/standalone,
  // which is what the Dockerfile copies into the final (small) runtime image.
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
