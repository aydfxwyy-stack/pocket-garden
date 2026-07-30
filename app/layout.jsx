import "./globals.css";

const basePath = process.env.GITHUB_ACTIONS ? "/pocket-garden" : "";

export const metadata = {
  title: "口袋花园",
  description: "把每一次坚持，种成自己的小花园",
  applicationName: "口袋花园",
  appleWebApp: { capable: true, title: "口袋花园", statusBarStyle: "default" },
  icons: {
    icon: [
      { url: `${basePath}/icons/icon-192.png`, sizes: "192x192", type: "image/png" },
      { url: `${basePath}/icons/icon-512.png`, sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: `${basePath}/icons/icon-180.png`, sizes: "180x180", type: "image/png" }]
  },
  manifest: `${basePath}/manifest.webmanifest`
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#fff9f7"
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
