import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BarChart3, Calculator, Search } from "lucide-react";

const features = [
  {
    icon: Search,
    title: "시세 분석",
    description:
      "국토부 실거래가 데이터를 기반으로 동일 단지·면적 최근 거래 내역을 분석합니다.",
  },
  {
    icon: Calculator,
    title: "취득비용 계산",
    description:
      "취득세, 법무사 비용, 명도비용 등 실제 부담할 총 취득비용을 자동 계산합니다.",
  },
  {
    icon: BarChart3,
    title: "매물 비교",
    description:
      "동일 단지 현재 매물과 비교하여 경매 입찰의 가격 경쟁력을 한눈에 확인합니다.",
  },
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4">
      <section className="py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          경매 물건,
          <br />
          <span className="text-muted-foreground">숫자로 판단하세요</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground">
          아파트 경매 시세 분석 · 취득비용 계산 · 매물 비교를 한 번에
        </p>
        <div className="mt-10">
          <Link
            href="/analyze"
            className={cn(buttonVariants({ size: "lg" }), "px-8")}
          >
            분석 시작하기
          </Link>
        </div>
      </section>

      <section className="pb-20">
        <div className="grid gap-4 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <Card key={title} className="border-border/50">
              <CardHeader className="pb-3">
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
