"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Loader2, Check } from "lucide-react";
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

// ── 아파트 자동완성 ────────────────────────────────

function AptAutocomplete({
  lawdCd,
  onSelect,
}: {
  lawdCd: string;
  onSelect: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AptResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // lawdCd 바뀌면 초기화
  useEffect(() => {
    setQuery("");
    setSelected("");
    setResults([]);
    setOpen(false);
  }, [lawdCd]);

  const search = useCallback(async (q: string) => {
    if (!lawdCd || q.trim().length < 1) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/apartments?lawdCd=${lawdCd}&q=${encodeURIComponent(q.trim())}`
      );
      const data: AptResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
    } catch {
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [lawdCd]);

  function handleChange(value: string) {
    setQuery(value);
    setSelected("");
    onSelect(""); // 선택 해제
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 150);
  }

  function handleSelect(name: string) {
    setQuery(name);
    setSelected(name);
    setOpen(false);
    onSelect(name);
  }

  // 키보드 탐색
  const [activeIdx, setActiveIdx] = useState(-1);
  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && activeIdx >= 0) {
      e.preventDefault();
      handleSelect(results[activeIdx].name);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          ref={inputRef}
          placeholder={lawdCd ? "아파트명 검색 (예: 래미안)" : "시/군/구를 먼저 선택하세요"}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={!lawdCd}
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {selected && !loading && (
          <Check className="absolute right-3 top-2.5 h-4 w-4 text-green-500" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-lg border bg-popover shadow-lg">
          <ul className="max-h-64 overflow-y-auto py-1" role="listbox">
            {results.map((r, idx) => (
              <li key={r.name} role="option" aria-selected={selected === r.name}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between px-3 py-2 text-sm transition-colors",
                    "hover:bg-accent hover:text-accent-foreground",
                    activeIdx === idx && "bg-accent text-accent-foreground",
                    selected === r.name && "font-medium"
                  )}
                  onClick={() => handleSelect(r.name)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <span>{r.name}</span>
                  <span className="ml-2 shrink-0 text-xs text-muted-foreground">
                    거래 {r.count.toLocaleString()}건
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Select 래퍼 ───────────────────────────────────

function NativeSelect({
  value,
  onChange,
  disabled,
  placeholder,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
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
      <option value="" disabled>{placeholder}</option>
      {children}
    </select>
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

  // 지역 데이터 로드
  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then(setRegionsData)
      .catch(() => {});
  }, []);

  function handleSidoChange(newSido: string) {
    setSido(newSido);
    setLawdCd("");
    setAptName("");
    setAreas([]);
    setSelectedArea("");
  }

  function handleLawdCdChange(code: string) {
    setLawdCd(code);
    setAptName("");
    setAreas([]);
    setSelectedArea("");
  }

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
      setAreas(data);
      if (data.length === 0) toast.info("등록된 평형 데이터가 없습니다.");
    } catch {
      toast.error("평형 정보를 불러오지 못했습니다.");
    } finally {
      setLoadingAreas(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lawdCd)       { toast.error("시/군/구를 선택해주세요."); return; }
    if (!aptName)      { toast.error("아파트명을 입력해주세요."); return; }
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

  // 입찰가 억 단위 변환
  const bidNum = Number(bidPrice);
  const bidPreview =
    bidPrice && bidNum > 0
      ? bidNum >= 10000
        ? `${Math.floor(bidNum / 10000)}억${bidNum % 10000 > 0 ? ` ${(bidNum % 10000).toLocaleString()}만원` : ""}`
        : `${bidNum.toLocaleString()}만원`
      : null;

  const sidoList = Object.keys(regionsData).sort();
  const sigungus: Region[] = sido ? (regionsData[sido] ?? []) : [];

  return (
    <form onSubmit={handleSubmit} noValidate>
      <Card>
        <CardHeader>
          <CardTitle>경매 물건 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">

          {/* 시/도 + 시/군/구 — 한 줄 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>시/도</Label>
              <NativeSelect
                value={sido}
                onChange={handleSidoChange}
                placeholder="시/도 선택"
                disabled={sidoList.length === 0}
              >
                {sidoList.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </NativeSelect>
            </div>

            <div className="space-y-2">
              <Label>시/군/구</Label>
              <NativeSelect
                value={lawdCd}
                onChange={handleLawdCdChange}
                placeholder="시/군/구 선택"
                disabled={!sido}
              >
                {sigungus.map((r) => (
                  <option key={r.code} value={r.code}>{r.name}</option>
                ))}
              </NativeSelect>
            </div>
          </div>

          {/* 아파트명 자동완성 */}
          <div className="space-y-2">
            <Label>아파트명</Label>
            <AptAutocomplete lawdCd={lawdCd} onSelect={handleAptSelect} />
          </div>

          {/* 평형 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              전용면적 (평형)
              {loadingAreas && <Loader2 className="h-3 w-3 animate-spin" />}
            </Label>
            {areas.length > 0 ? (
              <>
                <NativeSelect
                  value={selectedArea}
                  onChange={setSelectedArea}
                  placeholder="평형 선택"
                  disabled={!aptName}
                >
                  {areas.map((a) => (
                    <option key={a.exclusive_area} value={a.exclusive_area}>
                      {a.label}
                    </option>
                  ))}
                </NativeSelect>
                {selectedArea && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Check className="h-3 w-3 text-green-500" />
                    전용 {selectedArea}㎡ (약 {Math.round(Number(selectedArea) * 0.3025)}평)
                  </p>
                )}
              </>
            ) : (
              <div className="space-y-1">
                <Input
                  type="number"
                  placeholder={aptName ? "전용면적 직접 입력 (㎡)" : "아파트를 먼저 선택하세요"}
                  min={1}
                  step="0.01"
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  disabled={!aptName || loadingAreas}
                />
                {aptName && !loadingAreas && (
                  <p className="text-xs text-muted-foreground">
                    DB에 평형 데이터가 없으면 직접 입력해주세요.
                  </p>
                )}
              </div>
            )}
          </div>

          <Separator />

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

          {/* 입찰 희망가 */}
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

          {/* 부대비용 */}
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
                  { key: "legalFee",          label: "법무사 비용 (만원)" },
                  { key: "evictionCost",       label: "명도비용 (만원)" },
                  { key: "unpaidMaintenance",  label: "미납관리비 (만원)" },
                  { key: "loanInterest",       label: "대출이자 (만원)" },
                  { key: "enforcementCost",    label: "강제집행 비용 (만원)" },
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
