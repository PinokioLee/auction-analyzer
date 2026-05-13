"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

// ── 타입 ──────────────────────────────────────────

interface CostState {
  legalFee: number;
  evictionCost: number;
  unpaidMaintenance: number;
  loanInterest: number;
  enforcementCost: number;
}

const DEFAULT_COSTS: CostState = {
  legalFee: 50,
  evictionCost: 300,
  unpaidMaintenance: 0,
  loanInterest: 0,
  enforcementCost: 0,
};

// ── 컴포넌트 ──────────────────────────────────────

export function AuctionInputForm() {
  const router = useRouter();

  const [apartmentName, setApartmentName] = useState("");
  const [area, setArea] = useState("");
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [expectedPrice, setExpectedPrice] = useState(""); // 참고 시세 (선택)

  const [costs, setCosts] = useState<CostState>(DEFAULT_COSTS);
  const [showCosts, setShowCosts] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── 제출 ──────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!apartmentName.trim()) {
      toast.error("아파트명을 입력해주세요.");
      return;
    }
    if (!area || Number(area) <= 0) {
      toast.error("전용면적을 입력해주세요.");
      return;
    }
    if (!bidPrice || Number(bidPrice) <= 0) {
      toast.error("입찰 희망가를 입력해주세요.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentName: apartmentName.trim(),
          area: Number(area),
          floor: Number(floor) || 1,
          totalFloors: Number(totalFloors) || 1,
          bidPrice: Number(bidPrice),
          expectedPrice: Number(expectedPrice) || 0,
          ...costs,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "분석 실패" }));
        toast.error(err.error ?? "분석에 실패했습니다.");
        return;
      }

      const data = await res.json();
      if (data.historyId) {
        router.push(`/analyze/result?id=${data.historyId}`);
      } else {
        toast.error("결과 저장에 실패했습니다.");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  // ── UI 헬퍼 ───────────────────────────────────────

  const bidNum = Number(bidPrice);
  const bidPreview =
    bidPrice && bidNum > 0
      ? bidNum >= 10000
        ? `${Math.floor(bidNum / 10000)}억${bidNum % 10000 > 0 ? ` ${(bidNum % 10000).toLocaleString()}만원` : ""}`
        : `${bidNum.toLocaleString()}만원`
      : null;

  const priceNum = Number(expectedPrice);
  const pricePreview =
    expectedPrice && priceNum > 0
      ? priceNum >= 10000
        ? `${Math.floor(priceNum / 10000)}억${priceNum % 10000 > 0 ? ` ${(priceNum % 10000).toLocaleString()}만원` : ""}`
        : `${priceNum.toLocaleString()}만원`
      : null;

  // ── 렌더 ──────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>경매 물건 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* ① 아파트명 */}
          <div className="space-y-2">
            <Label htmlFor="apartmentName">아파트명</Label>
            <Input
              id="apartmentName"
              placeholder="예: 래미안 퍼스티지"
              value={apartmentName}
              onChange={(e) => setApartmentName(e.target.value)}
              required
            />
          </div>

          {/* ② 전용면적 */}
          <div className="space-y-2">
            <Label htmlFor="area">전용면적 (㎡)</Label>
            <Input
              id="area"
              type="number"
              placeholder="84.99"
              min={1}
              step="0.01"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              required
            />
            {area && Number(area) > 0 && (
              <p className="text-xs text-muted-foreground">
                약 {Math.round(Number(area) * 0.3025)}평
              </p>
            )}
          </div>

          {/* ③ 층수 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="floor">해당 층수</Label>
              <Input
                id="floor"
                type="number"
                placeholder="10"
                min={1}
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalFloors">총 층수</Label>
              <Input
                id="totalFloors"
                type="number"
                placeholder="25"
                min={1}
                value={totalFloors}
                onChange={(e) => setTotalFloors(e.target.value)}
              />
            </div>
          </div>

          {/* ④ 입찰가 */}
          <div className="space-y-2">
            <Label htmlFor="bidPrice">입찰 희망가 (만원)</Label>
            <Input
              id="bidPrice"
              type="number"
              placeholder="50000"
              min={1}
              value={bidPrice}
              onChange={(e) => setBidPrice(e.target.value)}
              required
            />
            {bidPreview && (
              <p className="text-xs text-muted-foreground">{bidPreview}</p>
            )}
          </div>

          <Separator />

          {/* ⑤ 참고 시세 (선택, 아코디언) */}
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => setShowPrice((v) => !v)}
            aria-expanded={showPrice}
          >
            <span>
              참고 시세 입력
              <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                (선택 — 손익 계산에 사용)
              </span>
            </span>
            {showPrice ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showPrice && (
            <div className="space-y-2 rounded-lg bg-muted/50 p-4">
              <p className="text-xs text-muted-foreground">
                네이버 부동산·KB부동산 등에서 확인한 현재 시세를 입력하면
                손익과 수익률을 계산해 드립니다.
              </p>
              <Label htmlFor="expectedPrice">현재 시세 (만원)</Label>
              <Input
                id="expectedPrice"
                type="number"
                placeholder="65000"
                min={1}
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
              />
              {pricePreview && (
                <p className="text-xs text-muted-foreground">{pricePreview}</p>
              )}
            </div>
          )}

          {/* ⑥ 부대비용 (아코디언) */}
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => setShowCosts((v) => !v)}
            aria-expanded={showCosts}
          >
            <span>부대비용 상세 설정</span>
            {showCosts ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showCosts && (
            <div className="space-y-4 rounded-lg bg-muted/50 p-4">
              {(
                [
                  { key: "legalFee", label: "법무사 비용 (만원)" },
                  { key: "evictionCost", label: "명도비용 (만원)" },
                  { key: "unpaidMaintenance", label: "미납관리비 (만원)" },
                  { key: "loanInterest", label: "대출이자 (만원)" },
                  { key: "enforcementCost", label: "강제집행 비용 (만원)" },
                ] as { key: keyof CostState; label: string }[]
              ).map(({ key, label }) => (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor={key}>{label}</Label>
                  <Input
                    id={key}
                    type="number"
                    min={0}
                    value={costs[key]}
                    onChange={(e) =>
                      setCosts((c) => ({ ...c, [key]: Number(e.target.value) }))
                    }
                  />
                </div>
              ))}
            </div>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              "분석하기"
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
