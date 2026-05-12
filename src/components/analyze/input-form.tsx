"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import type { AuctionInput, AdditionalCosts } from "@/types/auction";

const DEFAULT_ADDITIONAL_COSTS: AdditionalCosts = {
  legalFee: 50,
  evictionFee: 300,
  unpaidMaintenance: 0,
  loanInterest: 0,
  enforcementFee: 0,
};

export function AuctionInputForm() {
  const router = useRouter();
  const [showAdditional, setShowAdditional] = useState(false);
  const [form, setForm] = useState({
    apartmentName: "",
    area: "",
    floor: "",
    totalFloors: "",
    bidPrice: "",
  });
  const [costs, setCosts] = useState<AdditionalCosts>(DEFAULT_ADDITIONAL_COSTS);

  function handleSubmit(e: React.FormEvent) {
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

    const input: AuctionInput = {
      apartmentName: form.apartmentName.trim(),
      area: Number(form.area),
      floor: Number(form.floor) || 1,
      totalFloors: Number(form.totalFloors) || 1,
      bidPrice: Number(form.bidPrice),
      additionalCosts: costs,
    };

    const params = new URLSearchParams({
      data: btoa(encodeURIComponent(JSON.stringify(input))),
    });
    router.push(`/analyze/result?${params.toString()}`);
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
          <div className="space-y-2">
            <Label htmlFor="apartmentName">아파트명</Label>
            <Input
              id="apartmentName"
              placeholder="예: 래미안 퍼스티지"
              value={form.apartmentName}
              onChange={(e) =>
                setForm((f) => ({ ...f, apartmentName: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="area">전용면적 (㎡)</Label>
            <Input
              id="area"
              type="number"
              placeholder="84"
              min={1}
              value={form.area}
              onChange={(e) => setForm((f) => ({ ...f, area: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="floor">해당 층수</Label>
              <Input
                id="floor"
                type="number"
                placeholder="10"
                min={1}
                value={form.floor}
                onChange={(e) =>
                  setForm((f) => ({ ...f, floor: e.target.value }))
                }
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
                onChange={(e) =>
                  setForm((f) => ({ ...f, totalFloors: e.target.value }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bidPrice">입찰 희망가 (만원)</Label>
            <Input
              id="bidPrice"
              type="number"
              placeholder="50000"
              min={1}
              value={form.bidPrice}
              onChange={(e) =>
                setForm((f) => ({ ...f, bidPrice: e.target.value }))
              }
              required
            />
            {bidPreview && (
              <p className="text-xs text-muted-foreground">{bidPreview}</p>
            )}
          </div>

          <Separator />

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
                  { key: "evictionFee", label: "명도비용 (만원)" },
                  { key: "unpaidMaintenance", label: "미납관리비 (만원)" },
                  { key: "loanInterest", label: "대출이자 (만원)" },
                  { key: "enforcementFee", label: "강제집행 비용 (만원)" },
                ] as { key: keyof AdditionalCosts; label: string }[]
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

          <Button type="submit" className="w-full" size="lg">
            분석하기
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
