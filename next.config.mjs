/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  basePath: process.env.GITHUB_ACTIONS ? "/pocket-garden" : "",
  assetPrefix: process.env.GITHUB_ACTIONS ? "/pocket-garden/" : ""
};

export default nextConfig;
