import type { Metadata } from "next";
import { AuctionInputForm } from "@/components/analyze/input-form";

export const metadata: Metadata = {
  title: "분석 입력 | 경매 분석기",
};

export default function AnalyzePage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">경매 물건 분석</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          경매 물건 정보를 입력하면 취득비용을 자동으로 계산합니다.
        </p>
      </div>
      <AuctionInputForm />
    </div>
  );
}
