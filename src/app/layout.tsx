import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "경매 분석기 | 아파트 경매 입찰가 분석",
  description: "아파트 경매 시세 분석, 취득비용 계산, 매물 비교를 통한 합리적 입찰 가치 판단",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body
        style={{
          fontFamily:
            "'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        }}
        className="antialiased"
      >
        <Header />
        <main className="min-h-[calc(100vh-3.5rem)]">
          {children}
        </main>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
