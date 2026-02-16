/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep pdf-parse external so its bundled pdfjs is loaded from
    // node_modules at runtime instead of being re-bundled by webpack.
    serverComponentsExternalPackages: ["pdf-parse"],
  },
};

export default nextConfig;
