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

interface FormState {
  apartmentName: string;
  area: string;
  floor: string;
  totalFloors: string;
  bidPrice: string;
  regionCode: string;
}

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

export function AuctionInputForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);
  const [form, setForm] = useState<FormState>({
    apartmentName: "",
    area: "",
    floor: "",
    totalFloors: "",
    bidPrice: "",
    regionCode: "",
  });
  const [costs, setCosts] = useState<CostState>(DEFAULT_COSTS);

  function setField(field: keyof FormState, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.apartmentName.trim()) {
      toast.error("아파트명을 입력해주세요.");
      return;
    }
    if (!form.area || Number(form.area) <= 0) {
      toast.error("전용면적을 올바르게 입력해주세요.");
      return;
    }
    if (!form.bidPrice || Number(form.bidPrice) <= 0) {
      toast.error("입찰 희망가를 올바르게 입력해주세요.");
      return;
    }
    if (!form.regionCode || form.regionCode.length !== 5) {
      toast.error("법정동코드 5자리를 입력해주세요. (예: 11110 = 서울 종로구)");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apartmentName: form.apartmentName.trim(),
          area: Number(form.area),
          floor: Number(form.floor) || 1,
          totalFloors: Number(form.totalFloors) || 1,
          bidPrice: Number(form.bidPrice),
          regionCode: form.regionCode,
          ...costs,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "분석에 실패했습니다." }));
        toast.error(err.error ?? "분석에 실패했습니다.");
        return;
      }

      const data = await res.json();

      if (data.historyId) {
        router.push(`/analyze/result?id=${data.historyId}`);
      } else {
        toast.error("결과 저장에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      toast.error("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  const bidNum = Number(form.bidPrice);
  const bidPreview =
    form.bidPrice && bidNum > 0
      ? bidNum >= 10000
        ? `${Math.floor(bidNum / 10000)}억${bidNum % 10000 > 0 ? ` ${(bidNum % 10000).toLocaleString()}만원` : ""}`
        : `${bidNum.toLocaleString()}만원`
      : null;

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>경매 물건 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* 아파트명 */}
          <div className="space-y-2">
            <Label htmlFor="apartmentName">아파트명</Label>
            <Input
              id="apartmentName"
              placeholder="예: 래미안 퍼스티지"
              value={form.apartmentName}
              onChange={(e) => setField("apartmentName", e.target.value)}
              required
            />
          </div>

          {/* 전용면적 */}
          <div className="space-y-2">
            <Label htmlFor="area">전용면적 (㎡)</Label>
            <Input
              id="area"
              type="number"
              placeholder="84"
              min={1}
              value={form.area}
              onChange={(e) => setField("area", e.target.value)}
              required
            />
          </div>

          {/* 층수 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="floor">해당 층수</Label>
              <Input
                id="floor"
                type="number"
                placeholder="10"
                min={1}
                value={form.floor}
                onChange={(e) => setField("floor", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalFloors">총 층수</Label>
              <Input
                id="totalFloors"
                type="number"
                placeholder="25"
                min={1}
                value={form.totalFloors}
                onChange={(e) => setField("totalFloors", e.target.value)}
              />
            </div>
          </div>

          {/* 입찰가 */}
          <div className="space-y-2">
            <Label htmlFor="bidPrice">입찰 희망가 (만원)</Label>
            <Input
              id="bidPrice"
              type="number"
              placeholder="50000"
              min={1}
              value={form.bidPrice}
              onChange={(e) => setField("bidPrice", e.target.value)}
              required
            />
            {bidPreview && (
              <p className="text-xs text-muted-foreground">{bidPreview}</p>
            )}
          </div>

          {/* 법정동코드 */}
          <div className="space-y-2">
            <Label htmlFor="regionCode">
              법정동코드{" "}
              <span className="font-normal text-muted-foreground">(5자리)</span>
            </Label>
            <Input
              id="regionCode"
              placeholder="예: 11440 (서울 마포구)"
              maxLength={5}
              value={form.regionCode}
              onChange={(e) =>
                setField("regionCode", e.target.value.replace(/\D/g, "").slice(0, 5))
              }
              required
            />
            <p className="text-xs text-muted-foreground">
              법정동코드 조회:{" "}
              <a
                href="https://www.code.go.kr/stdcodesearch.do"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2"
              >
                code.go.kr
              </a>
            </p>
          </div>

          <Separator />

          {/* 부대비용 아코디언 */}
          <button
            type="button"
            className="flex w-full items-center justify-between text-sm font-medium"
            onClick={() => setShowAdditional((v) => !v)}
            aria-expanded={showAdditional}
          >
            <span>부대비용 상세 설정</span>
            {showAdditional ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {showAdditional && (
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

          <Button type="submit" className="w-full" size="lg" disabled={loading}>
            {loading ? (
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
