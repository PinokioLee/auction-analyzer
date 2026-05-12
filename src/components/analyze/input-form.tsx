"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Search, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── 타입 ──────────────────────────────────────────

interface Complex {
  complexNo: string;
  complexName: string;
  address: string;
}

interface Pyeong {
  pyeongNo: string;
  pyeongName: string;
  supplyArea: number;
  exclusiveArea: number;
  displayLabel: string;
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

// ── 컴포넌트 ──────────────────────────────────────

export function AuctionInputForm() {
  const router = useRouter();

  // 검색 단계
  const [keyword, setKeyword] = useState("");
  const [searching, setSearching] = useState(false);
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [selectedComplex, setSelectedComplex] = useState<Complex | null>(null);

  // 평형 단계
  const [pyeongs, setPyeongs] = useState<Pyeong[]>([]);
  const [loadingPyeong, setLoadingPyeong] = useState(false);
  const [selectedPyeong, setSelectedPyeong] = useState<Pyeong | null>(null);
  const [manualArea, setManualArea] = useState(""); // 폴백: 수동 입력
  const [naverBlocked, setNaverBlocked] = useState(false);

  // 기타 입력
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [costs, setCosts] = useState<CostState>(DEFAULT_COSTS);
  const [showAdditional, setShowAdditional] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── 단지 검색 ────────────────────────────────────

  async function handleSearch() {
    const q = keyword.trim();
    if (q.length < 2) {
      toast.error("검색어를 2자 이상 입력해주세요.");
      return;
    }
    setSearching(true);
    setComplexes([]);
    setSelectedComplex(null);
    setPyeongs([]);
    setSelectedPyeong(null);
    setNaverBlocked(false);

    try {
      const res = await fetch(`/api/complex/search?keyword=${encodeURIComponent(q)}`);
      if (!res.ok) throw new Error("검색 오류");
      const data: Complex[] = await res.json();
      if (data.length === 0) {
        toast.info("검색 결과가 없습니다.");
      } else {
        setComplexes(data);
      }
    } catch {
      toast.error("단지 검색에 실패했습니다.");
    } finally {
      setSearching(false);
    }
  }

  // ── 단지 선택 → 평형 자동 로드 ───────────────────

  async function handleSelectComplex(complexNo: string | null) {
    if (!complexNo) return;
    const complex = complexes.find((c) => c.complexNo === complexNo);
    if (!complex) return;

    setSelectedComplex(complex);
    setPyeongs([]);
    setSelectedPyeong(null);
    setNaverBlocked(false);
    setLoadingPyeong(true);

    try {
      const url = `/api/complex/${complexNo}/pyeongs?complexName=${encodeURIComponent(complex.complexName)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (!res.ok || data?.error === "NAVER_BLOCKED") {
        setNaverBlocked(true);
        toast.warning("네이버 API를 불러올 수 없습니다. 전용면적을 직접 입력해주세요.");
        return;
      }

      const list: Pyeong[] = Array.isArray(data) ? data : [];
      if (list.length === 0) {
        setNaverBlocked(true);
        toast.info("평형 정보가 없습니다. 직접 입력해주세요.");
      } else {
        setPyeongs(list);
      }
    } catch {
      setNaverBlocked(true);
      toast.warning("평형 정보를 불러오지 못했습니다. 직접 입력해주세요.");
    } finally {
      setLoadingPyeong(false);
    }
  }

  // ── 평형 선택 ─────────────────────────────────────

  function handleSelectPyeong(pyeongNo: string | null) {
    const p = pyeongs.find((py) => py.pyeongNo === (pyeongNo ?? "")) ?? null;
    setSelectedPyeong(p);
  }

  // ── 제출 ──────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const area = naverBlocked
      ? Number(manualArea)
      : selectedPyeong?.exclusiveArea ?? 0;

    if (!selectedComplex) {
      toast.error("단지를 검색하고 선택해주세요.");
      return;
    }
    if (area <= 0) {
      toast.error("전용면적을 선택하거나 입력해주세요.");
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
          apartmentName: selectedComplex.complexName,
          area,
          floor: Number(floor) || 1,
          totalFloors: Number(totalFloors) || 1,
          bidPrice: Number(bidPrice),
          complexNo: selectedComplex.complexNo,
          pyeongNo: selectedPyeong?.pyeongNo ?? "",
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

  const effectiveArea = naverBlocked
    ? Number(manualArea) || 0
    : selectedPyeong?.exclusiveArea ?? 0;

  // ── 렌더 ──────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>경매 물건 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* ① 아파트 검색 */}
          <div className="space-y-2">
            <Label htmlFor="keyword">아파트명</Label>
            <div className="flex gap-2">
              <Input
                id="keyword"
                placeholder="예: 래미안 퍼스티지"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleSearch())}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSearch}
                disabled={searching}
                aria-label="단지 검색"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* ② 단지 선택 드롭다운 */}
          {complexes.length > 0 && (
            <div className="space-y-2">
              <Label>단지 선택</Label>
              <Select
                value={selectedComplex?.complexNo ?? ""}
                onValueChange={handleSelectComplex}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="단지를 선택하세요" />
                </SelectTrigger>
                <SelectContent>
                  {complexes.map((c) => (
                    <SelectItem key={c.complexNo} value={c.complexNo}>
                      {c.complexName}
                      {c.address && (
                        <span className="ml-1.5 text-xs text-muted-foreground">
                          {c.address}
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* ③ 평형 선택 드롭다운 or 수동 입력 */}
          {selectedComplex && (
            <div className="space-y-2">
              <Label>
                전용면적
                {loadingPyeong && (
                  <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
                )}
              </Label>

              {naverBlocked ? (
                /* 폴백: 수동 입력 */
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="전용면적 직접 입력 (㎡)"
                    min={1}
                    value={manualArea}
                    onChange={(e) => setManualArea(e.target.value)}
                  />
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ExternalLink className="h-3 w-3" />
                    <a
                      href="https://new.land.naver.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline underline-offset-2"
                    >
                      네이버 부동산
                    </a>
                    에서 확인 후 입력
                  </p>
                </div>
              ) : pyeongs.length > 0 ? (
                /* 평형 드롭다운 */
                <Select
                  value={selectedPyeong?.pyeongNo ?? ""}
                  onValueChange={handleSelectPyeong}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="평형을 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {pyeongs.map((p) => (
                      <SelectItem key={p.pyeongNo} value={p.pyeongNo}>
                        {p.displayLabel}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : !loadingPyeong ? null : null}

              {/* 선택된 전용면적 표시 */}
              {effectiveArea > 0 && (
                <p className="text-xs text-muted-foreground">
                  전용 {effectiveArea}㎡
                </p>
              )}
            </div>
          )}

          {/* 이후 필드는 단지+평형 선택 후 표시 */}
          {selectedComplex && (effectiveArea > 0 || naverBlocked) && (
            <>
              {/* 층수 */}
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

              {/* 입찰가 */}
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
            </>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
