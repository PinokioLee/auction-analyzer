import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/server";
import { cn, formatManwon, formatKoreanWon } from "@/lib/utils";

export const metadata: Metadata = {
  title: "분석 결과 | 경매 분석기",
};

interface Props {
  searchParams: Promise<{ id?: string }>;
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

// ── 손익 배지 ─────────────────────────────────────

function ProfitBadge({ profit, roi }: { profit: number; roi: number }) {
  const positive = profit >= 0;
  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={positive ? "default" : "destructive"}
        className="text-sm px-3 py-1"
      >
        {positive ? "+" : ""}
        {formatManwon(profit)}
      </Badge>
      <span className="text-sm text-muted-foreground">
        {positive ? "▲" : "▼"} {Math.abs(roi)}%
      </span>
    </div>
  );
}

// ── 페이지 ────────────────────────────────────────

export default async function ResultPage({ searchParams }: Props) {
  const { id } = await searchParams;

  if (!id) return <NotFound message="분석 결과를 찾을 수 없습니다." />;

  const supabase = await createClient();
  const { data: row, error } = await supabase
    .from("analysis_history")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !row) return <NotFound message="분석 데이터가 존재하지 않습니다." />;

  const priceAnalysis = row.price_analysis as {
    low: number;
    mid: number;
    high: number;
    dataCount: number;
    period: string;
    dataSource?: string;
  } | null;

  const totalCost = row.total_cost ?? row.bid_price;
  const acquisitionTax = row.acquisition_tax ?? 0;

  const hasPrice =
    priceAnalysis &&
    priceAnalysis.dataCount > 0 &&
    priceAnalysis.mid > 0;

  const profit = hasPrice ? priceAnalysis.mid - totalCost : null;
  const roi =
    profit !== null && totalCost > 0
      ? Math.round((profit / totalCost) * 1000) / 10
      : null;

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

      {/* 손익 분석 */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="text-base">손익 분석</CardTitle>
          {hasPrice && priceAnalysis.period && (
            <p className="text-xs text-muted-foreground">
              기준: {priceAnalysis.period}
            </p>
          )}
        </CardHeader>
        <CardContent>
          {hasPrice && profit !== null && roi !== null ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">참고 시세</span>
                <span className="font-semibold">{formatKoreanWon(priceAnalysis.mid)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">최종 취득가</span>
                <span className="font-semibold">{formatKoreanWon(totalCost)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">예상 손익</span>
                <ProfitBadge profit={profit} roi={roi} />
              </div>
            </div>
          ) : (
            <div className="space-y-2 py-2">
              <p className="text-sm text-muted-foreground">
                참고 시세를 입력하지 않았습니다.
              </p>
              <p className="text-xs text-muted-foreground">
                네이버 부동산·KB부동산 등에서 현재 시세를 확인 후,{" "}
                <Link href="/analyze" className="underline underline-offset-2">
                  다시 분석
                </Link>
                할 때 입력해보세요.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 취득 비용 상세 */}
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
