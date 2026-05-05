import "./globals.css";

export const metadata = {
  title: "TON Market Maker Tool",
  description: "Multi-wallet trading tool for TON blockchain - STON.fi & DeDust",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
