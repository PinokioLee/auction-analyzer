import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { cn, formatManwon, formatKoreanWon } from "@/lib/utils";
import type { AnalyzeResult } from "@/types/auction";

export const metadata: Metadata = {
  title: "분석 결과 | 경매 분석기",
};

interface Props {
  searchParams: Promise<{ id?: string }>;
}

// ── 층 구간 카드 ─────────────────────────────────

function FloorCard({
  label,
  marketPrice,
  totalCost,
  profit,
  roi,
}: {
  label: string;
  marketPrice: number;
  totalCost: number;
  profit: number;
  roi: number;
}) {
  const positive = profit >= 0;
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {marketPrice === 0 ? (
          <p className="text-xs text-muted-foreground">데이터 없음</p>
        ) : (
          <>
            <p className="text-lg font-bold">{formatKoreanWon(marketPrice)}</p>
            <div className="flex items-center gap-1.5">
              <Badge variant={positive ? "default" : "destructive"} className="text-xs">
                {positive ? "+" : ""}
                {formatManwon(profit)}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {positive ? "▲" : "▼"} {Math.abs(roi)}%
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ── 결과 없음 컴포넌트 ────────────────────────────

function NotFound({ message }: { message: string }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-10 text-center">
      <p className="text-muted-foreground">{message}</p>
      <Link href="/analyze" className={cn(buttonVariants(), "mt-4 inline-block")}>
        돌아가기
      </Link>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────

export default async function ResultPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) return <NotFound message="분석 결과를 찾을 수 없습니다." />;

  // Supabase에서 결과 조회
  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) return <NotFound message="분석 데이터가 존재하지 않습니다." />;

  // price_analysis JSON 파싱
  const priceAnalysis = row.price_analysis as unknown as AnalyzeResult["priceAnalysis"] | null;
  const hasPrice = priceAnalysis && priceAnalysis.dataCount > 0;

  const totalCost = row.total_cost ?? row.bid_price;
  const acquisitionTax = row.acquisition_tax ?? 0;

  // 수익 계산 (결과 페이지에서 재계산)
  const calcProfit = (price: number) => price - totalCost;
  const calcROI = (profit: number) =>
    totalCost > 0 ? Math.round((profit / totalCost) * 1000) / 10 : 0;

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">{row.apartment_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          전용 {row.area}㎡ · {row.floor}/{row.total_floors}층 ·{" "}
          입찰가 {formatKoreanWon(row.bid_price)}
        </p>
      </div>

      {/* 최종 취득가 */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">최종 취득가 (예상)</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            {formatKoreanWon(totalCost)}
          </p>
        </CardContent>
      </Card>

      {/* 섹션 1: 시세 분석 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">층별 시세 분석</CardTitle>
          {hasPrice && (
            <p className="text-xs text-muted-foreground">
              최근 {priceAnalysis.period} · {priceAnalysis.dataCount}건 기준
            </p>
          )}
        </CardHeader>
        <CardContent>
          {hasPrice ? (
            <div className="flex gap-2">
              <FloorCard
                label="저층"
                marketPrice={priceAnalysis.low}
                totalCost={totalCost}
                profit={calcProfit(priceAnalysis.low)}
                roi={calcROI(calcProfit(priceAnalysis.low))}
              />
              <FloorCard
                label="중층"
                marketPrice={priceAnalysis.mid}
                totalCost={totalCost}
                profit={calcProfit(priceAnalysis.mid)}
                roi={calcROI(calcProfit(priceAnalysis.mid))}
              />
              <FloorCard
                label="RR층"
                marketPrice={priceAnalysis.high}
                totalCost={totalCost}
                profit={calcProfit(priceAnalysis.high)}
                roi={calcROI(calcProfit(priceAnalysis.high))}
              />
            </div>
          ) : (
            <p className="py-2 text-sm text-muted-foreground">
              해당 단지 최근 6개월 실거래 데이터가 없습니다.
            </p>
          )}
        </CardContent>
      </Card>

      {/* 섹션 2: 비용 상세 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">취득 비용 상세</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>입찰가</span>
            <span className="font-medium">{formatManwon(row.bid_price)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span>취득세 합계</span>
            <span>{formatManwon(acquisitionTax)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>법무사 비용</span>
            <span>{formatManwon(row.legal_fee ?? 0)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>명도비용</span>
            <span>{formatManwon(row.eviction_cost ?? 0)}</span>
          </div>
          {(row.unpaid_maintenance ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span>미납관리비</span>
              <span>{formatManwon(row.unpaid_maintenance ?? 0)}</span>
            </div>
          )}
          {(row.loan_interest ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span>대출이자</span>
              <span>{formatManwon(row.loan_interest ?? 0)}</span>
            </div>
          )}
          {(row.enforcement_cost ?? 0) > 0 && (
            <div className="flex justify-between text-sm">
              <span>강제집행 비용</span>
              <span>{formatManwon(row.enforcement_cost ?? 0)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-base font-bold">
            <span>최종 취득가</span>
            <span>{formatManwon(totalCost)}</span>
          </div>
        </CardContent>
      </Card>

      <Link
        href="/analyze"
        className={cn(buttonVariants({ variant: "outline" }), "w-full text-center")}
      >
        다시 분석하기
      </Link>
    </div>
  );
}
