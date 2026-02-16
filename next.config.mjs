/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Prevent webpack from bundling native/Node-only packages.
    // pdf-parse v2 references Worker, canvas, document, and window internally;
    // bundling it causes crashes in the Next.js server runtime.
    serverComponentsExternalPackages: ["pdf-parse", "pdfjs-dist"],
  },
};

export default nextConfig;
