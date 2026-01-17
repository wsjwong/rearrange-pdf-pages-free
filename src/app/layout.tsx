import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rearrange PDF Pages Free",
  description: "Reorder, remove, and manage your PDF pages with ease.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="app-wrapper">
          <div className="app-content">
            {children}
          </div>
          <footer className="tools-footer">
            <div className="container tools-footer-inner">
              <div className="tools-footer-header">
                <span className="tools-footer-label">More tools from SimpleMetrics</span>
              </div>
              <div className="tools-footer-links">
                <a
                  href="https://simplemetrics.xyz/bulk-image-url-downloader/?utm_source=pdf.simplemetrics.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Image Downloader
                </a>
                <a
                  href="https://simplemetrics.xyz/ai-thumbnail-generator/?utm_source=pdf.simplemetrics.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  AI Thumbnail Generator
                </a>
                <a
                  href="https://simplemetrics.xyz/gemini-token-counter/?utm_source=pdf.simplemetrics.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gemini Token Counter
                </a>
                <a
                  href="https://simplemetrics.xyz/gemini-token-cost-calculator/?utm_source=pdf.simplemetrics.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Gemini Token Cost Calculator
                </a>
                <a
                  href="https://simplemetrics.xyz/pdf-to-text/?utm_source=pdf.simplemetrics.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PDF to Text
                </a>
              </div>
            </div>
          </footer>
        </div>
        {process.env.NODE_ENV === "production" ? (
          <Script
            src="https://analytics.simplemetrics.xyz/script.js"
            data-website-id="8da5816a-73f5-4dcf-8008-1f637cb3fe44"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
