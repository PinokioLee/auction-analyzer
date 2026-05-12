import type { Metadata } from "next";
import "./globals.css";

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
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body
        style={{
          fontFamily:
            "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif",
        }}
        className="antialiased"
      >
        {children}
      </body>
    </html>
  );
}
