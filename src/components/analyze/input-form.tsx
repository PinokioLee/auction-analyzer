"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Search, Check } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

// ── 타입 ──────────────────────────────────────────

interface Region { code: string; name: string }
interface AptResult { name: string; count: number }
interface AreaOption { exclusive_area: number; label: string }

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

// ── 자동완성 컴포넌트 ─────────────────────────────

function Autocomplete({
  label,
  placeholder,
  disabled,
  onSelect,
  fetcher,
}: {
  label: string;
  placeholder: string;
  disabled?: boolean;
  onSelect: (value: string) => void;
  fetcher: (q: string) => Promise<AptResult[]>;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AptResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  async function handleChange(value: string) {
    setQuery(value);
    setSelected("");
    if (debounce.current) clearTimeout(debounce.current);
    if (value.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await fetcher(value.trim());
        setResults(data);
        setOpen(data.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }

  function handleSelect(name: string) {
    setQuery(name);
    setSelected(name);
    setOpen(false);
    onSelect(name);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div ref={containerRef} className="relative">
        <div className="relative">
          <Input
            placeholder={placeholder}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            disabled={disabled}
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        {open && (
          <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-md">
            <ul className="max-h-60 overflow-y-auto py-1">
              {results.map((r) => (
                <li key={r.name}>
                  <button
                    type="button"
                    className={cn(
                      "flex w-full items-center justify-between px-3 py-2 text-sm hover:bg-accent",
                      selected === r.name && "bg-accent"
                    )}
                    onClick={() => handleSelect(r.name)}
                  >
                    <span>{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.count}건
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Select 래퍼 ───────────────────────────────────

function NativeSelect({
  label,
  value,
  onChange,
  disabled,
  placeholder,
  children,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className={cn(
          "flex h-9 w-full rounded-lg border border-input bg-transparent px-3 py-1 text-sm",
          "outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {children}
      </select>
    </div>
  );
}

// ── 메인 폼 ───────────────────────────────────────

export function AuctionInputForm() {
  const router = useRouter();

  // 지역
  const [regionsData, setRegionsData] = useState<Record<string, Region[]>>({});
  const [sido, setSido] = useState("");
  const [lawdCd, setLawdCd] = useState("");

  // 아파트
  const [aptName, setAptName] = useState("");

  // 평형
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [selectedArea, setSelectedArea] = useState("");

  // 입력값
  const [floor, setFloor] = useState("");
  const [totalFloors, setTotalFloors] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [costs, setCosts] = useState<CostState>(DEFAULT_COSTS);
  const [showCosts, setShowCosts] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // ── 지역 데이터 로드 ─────────────────────────────

  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegionsData)
      .catch(() => {});
  }, []);

  // 시도 변경 → 시군구 초기화
  function handleSidoChange(newSido: string) {
    setSido(newSido);
    setLawdCd("");
    setAptName("");
    setAreas([]);
    setSelectedArea("");
  }

  // 시군구 변경 → 아파트/평형 초기화
  function handleLawdCdChange(code: string) {
    setLawdCd(code);
    setAptName("");
    setAreas([]);
    setSelectedArea("");
  }

  // ── 아파트 선택 → 평형 자동 로드 ─────────────────

  async function handleAptSelect(name: string) {
    setAptName(name);
    setAreas([]);
    setSelectedArea("");
    if (!name || !lawdCd) return;

    setLoadingAreas(true);
    try {
      const res = await fetch(
        `/api/areas?lawdCd=${lawdCd}&aptName=${encodeURIComponent(name)}`
      );
      const data: AreaOption[] = await res.json();
      if (data.length === 0) {
        toast.info("등록된 평형 데이터가 없습니다.");
      } else {
        setAreas(data);
      }
    } catch {
      toast.error("평형 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingAreas(false);
    }
  }

  // ── 아파트 자동완성 fetcher ───────────────────────

  async function fetchApartments(q: string): Promise<AptResult[]> {
    if (!lawdCd) return [];
    const res = await fetch(
      `/api/apartments?lawdCd=${lawdCd}&q=${encodeURIComponent(q)}`
    );
    return res.json();
  }

  // ── 제출 ─────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!lawdCd) { toast.error("시/군/구를 선택해주세요."); return; }
    if (!aptName) { toast.error("아파트명을 입력해주세요."); return; }
    if (!selectedArea) { toast.error("평형을 선택해주세요."); return; }
    if (!bidPrice || Number(bidPrice) <= 0) { toast.error("입찰 희망가를 입력해주세요."); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lawdCd,
          aptName,
          exclusiveArea: Number(selectedArea),
          floor: Number(floor) || 1,
          totalFloors: Number(totalFloors) || 20,
          bidPrice: Number(bidPrice),
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

  // ── UI 헬퍼 ──────────────────────────────────────

  const bidNum = Number(bidPrice);
  const bidPreview =
    bidPrice && bidNum > 0
      ? bidNum >= 10000
        ? `${Math.floor(bidNum / 10000)}억${bidNum % 10000 > 0 ? ` ${(bidNum % 10000).toLocaleString()}만원` : ""}`
        : `${bidNum.toLocaleString()}만원`
      : null;

  const sidoList = Object.keys(regionsData).sort();
  const sigungus: Region[] = sido ? (regionsData[sido] ?? []) : [];
  const showAreaStep = aptName.length > 0;
  const showDetailStep = !!selectedArea;

  // ── 렌더 ─────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>경매 물건 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* Step 1: 시/도 */}
          <NativeSelect
            label="시/도"
            value={sido}
            onChange={handleSidoChange}
            placeholder="시/도 선택"
            disabled={sidoList.length === 0}
          >
            {sidoList.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </NativeSelect>

          {/* Step 2: 시/군/구 */}
          <NativeSelect
            label="시/군/구"
            value={lawdCd}
            onChange={handleLawdCdChange}
            placeholder="시/군/구 선택"
            disabled={!sido}
          >
            {sigungus.map((r) => (
              <option key={r.code} value={r.code}>{r.name}</option>
            ))}
          </NativeSelect>

          {/* Step 3: 아파트명 자동완성 */}
          {lawdCd && (
            <Autocomplete
              label="아파트명"
              placeholder="아파트명 검색 (예: 래미안)"
              disabled={!lawdCd}
              fetcher={fetchApartments}
              onSelect={handleAptSelect}
            />
          )}

          {/* Step 4: 평형 */}
          {showAreaStep && (
            <div className="space-y-2">
              <Label>
                평형
                {loadingAreas && (
                  <Loader2 className="ml-2 inline h-3 w-3 animate-spin" />
                )}
              </Label>
              {areas.length > 0 ? (
                <NativeSelect
                  label=""
                  value={selectedArea}
                  onChange={setSelectedArea}
                  placeholder="평형 선택"
                >
                  {areas.map((a) => (
                    <option key={a.exclusive_area} value={a.exclusive_area}>
                      {a.label}
                    </option>
                  ))}
                </NativeSelect>
              ) : !loadingAreas ? (
                <div className="space-y-1">
                  <Input
                    type="number"
                    placeholder="전용면적 직접 입력 (㎡)"
                    min={1}
                    step="0.01"
                    value={selectedArea}
                    onChange={(e) => setSelectedArea(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    해당 구에 거래 데이터가 없으면 직접 입력해주세요.
                  </p>
                </div>
              ) : null}
              {selectedArea && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3" />
                  전용 {selectedArea}㎡ (약 {Math.round(Number(selectedArea) * 0.3025)}평)
                </p>
              )}
            </div>
          )}

          {/* Step 5: 층수 + 입찰가 + 비용 */}
          {showDetailStep && (
            <>
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
            </>
          )}
        </CardContent>
      </Card>
    </form>
  );
}
