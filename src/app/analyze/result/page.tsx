import type { Metadata } from "next";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { calculateTotalCost } from "@/lib/calculator/total-cost";
import { cn, formatManwon, formatKoreanWon } from "@/lib/utils";
import type { AuctionInput } from "@/types/auction";

export const metadata: Metadata = {
  title: "분석 결과 | 경매 분석기",
};

interface Props {
  searchParams: Promise<{ data?: string }>;
}

export default async function ResultPage({ searchParams }: Props) {
  const { data } = await searchParams;

  if (!data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-muted-foreground">분석 데이터가 없습니다.</p>
        <Link href="/analyze" className={cn(buttonVariants(), "mt-4")}>
          돌아가기
        </Link>
      </div>
    );
  }

  let input: AuctionInput;
  try {
    input = JSON.parse(decodeURIComponent(atob(data))) as AuctionInput;
  } catch {
    return (
      <div className="mx-auto max-w-lg px-4 py-10 text-center">
        <p className="text-muted-foreground">잘못된 데이터입니다.</p>
        <Link href="/analyze" className={cn(buttonVariants(), "mt-4")}>
          돌아가기
        </Link>
      </div>
    );
  }

  const result = calculateTotalCost(input);

  return (
    <div className="mx-auto max-w-lg px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">
          {input.apartmentName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          전용 {input.area}㎡ · {input.floor}/{input.totalFloors}층
        </p>
      </div>

      <Card className="mb-4">
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">최종 취득가 (예상)</p>
          <p className="mt-1 text-4xl font-bold tracking-tight">
            {formatKoreanWon(result.grandTotal)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">비용 상세</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>입찰가</span>
            <span className="font-medium">{formatManwon(result.bidPrice)}</span>
          </div>
          <Separator />
          <div className="flex justify-between text-sm">
            <span>취득세</span>
            <span>{formatManwon(result.acquisitionTax.acquisitionTax)}</span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className="pl-3">└ 지방교육세</span>
            <span>{formatManwon(result.acquisitionTax.educationTax)}</span>
          </div>
          {result.acquisitionTax.ruralTax > 0 && (
            <div className="flex justify-between text-sm text-muted-foreground">
              <span className="pl-3">└ 농어촌특별세</span>
              <span>{formatManwon(result.acquisitionTax.ruralTax)}</span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between text-sm">
            <span>법무사 비용</span>
            <span>{formatManwon(result.additionalCosts.legalFee)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>명도비용</span>
            <span>{formatManwon(result.additionalCosts.evictionFee)}</span>
          </div>
          {result.additionalCosts.unpaidMaintenance > 0 && (
            <div className="flex justify-between text-sm">
              <span>미납관리비</span>
              <span>
                {formatManwon(result.additionalCosts.unpaidMaintenance)}
              </span>
            </div>
          )}
          {result.additionalCosts.loanInterest > 0 && (
            <div className="flex justify-between text-sm">
              <span>대출이자</span>
              <span>{formatManwon(result.additionalCosts.loanInterest)}</span>
            </div>
          )}
          {result.additionalCosts.enforcementFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>강제집행 비용</span>
              <span>
                {formatManwon(result.additionalCosts.enforcementFee)}
              </span>
            </div>
          )}
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>합계</span>
            <span>{formatManwon(result.grandTotal)}</span>
          </div>
        </CardContent>
      </Card>

      <Link
        href="/analyze"
        className={cn(buttonVariants({ variant: "outline" }), "mt-6 w-full")}
      >
        다시 분석하기
      </Link>
    </div>
  );
}
