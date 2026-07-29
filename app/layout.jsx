import "./globals.css";

const basePath = process.env.GITHUB_ACTIONS ? "/pocket-garden" : "";

export const metadata = {
  title: "口袋花园",
  description: "把每一次坚持，种成自己的小花园",
  applicationName: "口袋花园",
  appleWebApp: { capable: true, title: "口袋花园", statusBarStyle: "default" },
  icons: { icon: `${basePath}/icon.svg`, apple: `${basePath}/icon.svg` },
  manifest: `${basePath}/manifest.webmanifest`
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#f8f5ef"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
