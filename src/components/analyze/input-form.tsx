"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ── 타입 ──────────────────────────────────────────

interface Region { code: string; name: string }
interface AptResult { name: string; count: number }
interface AreaOption { exclusive_area: number; label: string }

interface CostState {
  legalFee: number;              // 법무사 비용 만원 (기본 80)
  evictionCost: number;          // 명도비용 만원
  unpaidMaintenance: number;     // 미납관리비 만원 (기본 100)
  interiorCost: number;          // 인테리어 비용 만원 (기본 0)
  loanLtv: number;               // 대출 LTV % (기본 70)
  loanRate: number;              // 대출 금리 % (기본 4.8)
  loanFeeRate: number;           // 대출수수료 % (기본 0.7)
  prepaymentRate: number;        // 중도상환수수료 % (기본 1.4)
}

const DEFAULT_COSTS: CostState = {
  legalFee: 0,
  evictionCost: 0,
  unpaidMaintenance: 0,
  interiorCost: 0,
  loanLtv: 0,
  loanRate: 0,
  loanFeeRate: 0,
  prepaymentRate: 0,
};

// ── 공통 UI 컴포넌트 ──────────────────────────────

function FormLabel({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-zinc-600"
    >
      {children}
    </label>
  );
}

function FormInput({
  id,
  type = "text",
  placeholder,
  value,
  onChange,
  onKeyDown,
  onFocus,
  disabled,
  autoComplete,
  min,
  step,
  suffix,
  inputRef,
}: {
  id?: string;
  type?: string;
  placeholder?: string;
  value: string | number;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  disabled?: boolean;
  autoComplete?: string;
  min?: number;
  step?: string;
  suffix?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="relative flex items-center">
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        id={id}
        type={type}
        placeholder={placeholder}
        value={type === "number" && value === 0 ? "" : value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        disabled={disabled}
        autoComplete={autoComplete}
        min={min}
        step={step}
        className={cn(
          "h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 text-[15px] text-zinc-900 outline-none",
          "placeholder:text-zinc-400",
          "transition-all duration-150",
          "focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/8",
          "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400",
          suffix && "pr-14",
          type === "number" && "tabular-nums"
        )}
      />
      {suffix && (
        <span className="pointer-events-none absolute right-4 text-sm text-zinc-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

function NativeSelect({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  children,
}: {
  id?: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <select
      id={id}
      className={cn(
        "h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 text-[15px] text-zinc-900 outline-none",
        "appearance-none bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23a1a1aa' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")] bg-[right_12px_center] bg-no-repeat",
        "transition-all duration-150",
        "focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/8",
        "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
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
  const [activeIdx, setActiveIdx] = useState(-1);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef   = useRef<AbortController | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setQuery(""); setSelected(""); setResults([]); setOpen(false);
    abortRef.current?.abort();
  }, [lawdCd]);

  const search = useCallback(async (q: string) => {
    if (!lawdCd || q.trim().length < 1) { setResults([]); setOpen(false); return; }

    // 이전 요청 취소 (race condition 방지)
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/apartments?lawdCd=${lawdCd}&q=${encodeURIComponent(q.trim())}`,
        { signal: controller.signal }
      );
      const data: AptResult[] = await res.json();
      setResults(data);
      setOpen(data.length > 0);
      setActiveIdx(-1);
    } catch (err) {
      // AbortError는 의도적 취소 — 상태 변경 금지
      if (err instanceof Error && err.name === "AbortError") return;
      setResults([]); setOpen(false);
    } finally {
      setLoading(false);
    }
  }, [lawdCd]);

  function handleChange(value: string) {
    setQuery(value);
    setSelected("");
    onSelect("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 150);
  }

  function handleSelect(name: string) {
    setQuery(name); setSelected(name); setOpen(false); onSelect(name);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx].name); }
    else if (e.key === "Escape") setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          placeholder={lawdCd ? "아파트명 검색 (예: 래미안)" : "시/군/구를 먼저 선택하세요"}
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => results.length > 0 && setOpen(true)}
          disabled={!lawdCd}
          autoComplete="off"
          className={cn(
            "h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 pr-10 text-[15px] text-zinc-900 outline-none",
            "placeholder:text-zinc-400",
            "transition-all duration-150",
            "focus:border-zinc-900 focus:ring-4 focus:ring-zinc-900/8",
            "disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400"
          )}
        />
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          {loading && <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />}
          {selected && !loading && <Check className="h-4 w-4 text-emerald-500" />}
        </div>
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg">
          <ul className="max-h-60 overflow-y-auto py-1" role="listbox">
            {results.map((r, idx) => (
              <li key={r.name} role="option" aria-selected={selected === r.name}>
                <button
                  type="button"
                  className={cn(
                    "flex w-full items-center justify-between px-4 py-2.5 text-sm transition-colors duration-100",
                    "hover:bg-zinc-50",
                    activeIdx === idx && "bg-zinc-50",
                    selected === r.name && "font-medium text-zinc-900"
                  )}
                  onClick={() => handleSelect(r.name)}
                  onMouseEnter={() => setActiveIdx(idx)}
                >
                  <span className="text-zinc-800">{r.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── 메인 폼 ───────────────────────────────────────

export function AuctionInputForm() {
  const router = useRouter();

  const [regionsData, setRegionsData] = useState<Record<string, Region[]>>({});
  const [sido, setSido] = useState("");
  const [lawdCd, setLawdCd] = useState("");
  const [aptName, setAptName] = useState("");
  const [areas, setAreas] = useState<AreaOption[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [selectedArea, setSelectedArea] = useState("");
  const [bidPrice, setBidPrice] = useState("");
  const [holdMonths, setHoldMonths] = useState("12"); // 매도 희망일 (개월)
  const [costs, setCosts] = useState<CostState>(DEFAULT_COSTS);
  const [showCosts, setShowCosts] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch("/api/regions").then((r) => r.json()).then(setRegionsData).catch(() => {});
  }, []);

  function handleSidoChange(newSido: string) {
    setSido(newSido); setLawdCd(""); setAptName(""); setAreas([]); setSelectedArea("");
  }

  function handleLawdCdChange(code: string) {
    setLawdCd(code); setAptName(""); setAreas([]); setSelectedArea("");
  }

  async function handleAptSelect(name: string) {
    setAptName(name); setAreas([]); setSelectedArea("");
    if (!name || !lawdCd) return;
    setLoadingAreas(true);
    try {
      const res = await fetch(`/api/areas?lawdCd=${lawdCd}&aptName=${encodeURIComponent(name)}`);
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
    if (!bidPrice || Number(bidPrice) <= 0) { toast.error("입찰가를 입력해주세요."); return; }

    const bid = Number(bidPrice);
    const months = Math.max(1, Number(holdMonths) || 12);
    const areaPyeong = Number(selectedArea) * 0.3025;
    const loanPrincipal = bid * (costs.loanLtv / 100);

    // 파생 계산값
    const evictionCost    = costs.evictionCost;
    const loanAmount      = Math.round(loanPrincipal); // 대출 원금 (만원)
    const loanInterest    = Math.round(loanPrincipal * (costs.loanRate / 100) * (months / 12)); // 보유 개월 기준
    const loanFee         = Math.round(loanPrincipal * (costs.loanFeeRate / 100));
    const prepaymentPenalty = Math.round(loanPrincipal * (costs.prepaymentRate / 100));

    setSubmitting(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lawdCd,
          aptName,
          exclusiveArea: Number(selectedArea),
          // TODO: 국토부 단지 데이터 수집 완료 후 층수 입력 필드 복원
          floor: 1,
          totalFloors: 20,
          bidPrice: bid,
          legalFee: costs.legalFee,
          evictionCost,
          unpaidMaintenance: costs.unpaidMaintenance,
          interiorCost: costs.interiorCost,
          loanAmount,
          loanInterest,
          loanFee,
          prepaymentPenalty,
          enforcementCost: 0,
          holdMonths: months,       // 대출이자 breakdown 표시용
          loanRate: costs.loanRate, // 대출이자 breakdown 표시용
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

  // 입찰가 미리보기
  const bidNum = Number(bidPrice);
  const bidPreview =
    bidPrice && bidNum > 0
      ? bidNum >= 10000
        ? `${Math.floor(bidNum / 10000)}억${bidNum % 10000 > 0 ? ` ${(bidNum % 10000).toLocaleString()}만원` : ""}`
        : `${bidNum.toLocaleString()}만원`
      : null;

  const sidoList = Object.keys(regionsData).sort();
  const sigungus: Region[] = sido ? (regionsData[sido] ?? []) : [];

  // 부대비용 미리보기 (합계)
  const bid = Number(bidPrice) || 0;
  const months = Math.max(1, Number(holdMonths) || 12);
  const areaPyeong = Number(selectedArea) * 0.3025;
  const loanPrincipal = bid * (costs.loanLtv / 100);
  const totalAdditional =
    costs.legalFee +
    costs.evictionCost +
    costs.unpaidMaintenance +
    costs.interiorCost +
    Math.round(loanPrincipal * (costs.loanRate / 100) * (months / 12)) +
    Math.round(loanPrincipal * (costs.loanFeeRate / 100)) +
    Math.round(loanPrincipal * (costs.prepaymentRate / 100));

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-md sm:p-8">
        <div className="space-y-6">

          {/* 지역 */}
          <div>
            <p className="mb-3 text-sm font-semibold text-zinc-900">지역</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FormLabel htmlFor="sido">시/도</FormLabel>
                <NativeSelect
                  id="sido"
                  value={sido}
                  onChange={handleSidoChange}
                  placeholder="선택"
                  disabled={sidoList.length === 0}
                >
                  {sidoList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <FormLabel htmlFor="sigungu">시/군/구</FormLabel>
                <NativeSelect
                  id="sigungu"
                  value={lawdCd}
                  onChange={handleLawdCdChange}
                  placeholder="선택"
                  disabled={!sido}
                >
                  {sigungus.map((r) => (
                    <option key={r.code} value={r.code}>{r.name}</option>
                  ))}
                </NativeSelect>
              </div>
            </div>
          </div>

          {/* 아파트명 */}
          <div>
            <FormLabel>아파트명</FormLabel>
            <AptAutocomplete lawdCd={lawdCd} onSelect={handleAptSelect} />
          </div>

          {/* 전용면적 */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-600">전용면적 (평형)</span>
              {loadingAreas && <Loader2 className="h-3 w-3 animate-spin text-zinc-400" />}
            </div>
            {areas.length > 0 ? (
              <div className="space-y-2">
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
                  <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Check className="h-3 w-3 text-emerald-500" />
                    {areas.find((a) => String(a.exclusive_area) === selectedArea)?.label ?? `전용 ${selectedArea}㎡`}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <FormInput
                  type="number"
                  placeholder={aptName ? "전용면적 직접 입력 (㎡)" : "아파트를 먼저 선택하세요"}
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  disabled={!aptName || loadingAreas}
                  min={1}
                  step="0.01"
                  suffix="㎡"
                />
                {aptName && !loadingAreas && (
                  <p className="text-xs text-zinc-400">DB에 평형 데이터가 없으면 직접 입력해주세요.</p>
                )}
              </div>
            )}
          </div>

          {/* 구분선 */}
          <div className="border-t border-zinc-100" />

          {/* 입찰가 + 매도 희망일 */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FormLabel htmlFor="bidPrice">입찰가</FormLabel>
              <FormInput
                id="bidPrice"
                type="number"
                placeholder="50000"
                value={bidPrice}
                onChange={(e) => setBidPrice(e.target.value)}
                min={1}
                suffix="만원"
              />
              {bidPreview && (
                <p className="mt-1.5 text-xs tabular-nums text-zinc-500">
                  = {bidPreview}
                </p>
              )}
            </div>
            <div>
              <FormLabel htmlFor="holdMonths">매도 희망일</FormLabel>
              <FormInput
                id="holdMonths"
                type="number"
                placeholder="12"
                value={holdMonths}
                onChange={(e) => setHoldMonths(e.target.value)}
                min={1}
                suffix="개월"
              />
              {holdMonths && Number(holdMonths) > 0 && (
                <p className="mt-1.5 text-xs text-zinc-500">
                  {Number(holdMonths) >= 12
                    ? `${Math.floor(Number(holdMonths) / 12)}년${Number(holdMonths) % 12 > 0 ? ` ${Number(holdMonths) % 12}개월` : ""} 보유 기준 이자 계산`
                    : `${holdMonths}개월 보유 기준 이자 계산`}
                </p>
              )}
            </div>
          </div>

          {/* 부대비용 */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-900">부대비용 상세 설정</p>
              {bid > 0 && (
                <span className="tabular-nums text-xs text-zinc-400">
                  합계 약 {totalAdditional.toLocaleString()}만원
                </span>
              )}
            </div>

            <div>
              <div className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {/* 법무사 비용 */}
                  <div>
                    <FormLabel htmlFor="legalFee">법무사 비용</FormLabel>
                    <FormInput
                      id="legalFee"
                      type="number"
                      value={costs.legalFee}
                      onChange={(e) => setCosts((c) => ({ ...c, legalFee: Number(e.target.value) || 0 }))}
                      min={0}
                      suffix="만원"
                    />
                  </div>
                  {/* 명도비용 */}
                  <div>
                    <FormLabel htmlFor="eviction">명도비용</FormLabel>
                    <FormInput
                      id="eviction"
                      type="number"
                      value={costs.evictionCost}
                      onChange={(e) => setCosts((c) => ({ ...c, evictionCost: Number(e.target.value) || 0 }))}
                      min={0}
                      suffix="만원"
                    />
                  </div>
                  {/* 미납관리비 */}
                  <div>
                    <FormLabel htmlFor="maintenance">미납관리비</FormLabel>
                    <FormInput
                      id="maintenance"
                      type="number"
                      value={costs.unpaidMaintenance}
                      onChange={(e) => setCosts((c) => ({ ...c, unpaidMaintenance: Number(e.target.value) || 0 }))}
                      min={0}
                      suffix="만원"
                    />
                  </div>
                  {/* 인테리어 비용 */}
                  <div>
                    <FormLabel htmlFor="interior">인테리어 비용</FormLabel>
                    <FormInput
                      id="interior"
                      type="number"
                      value={costs.interiorCost}
                      onChange={(e) => setCosts((c) => ({ ...c, interiorCost: Number(e.target.value) || 0 }))}
                      min={0}
                      suffix="만원"
                    />
                  </div>
                  {/* 대출 LTV */}
                  <div>
                    <FormLabel htmlFor="ltv">대출 LTV</FormLabel>
                    <FormInput
                      id="ltv"
                      type="number"
                      value={costs.loanLtv}
                      onChange={(e) => setCosts((c) => ({ ...c, loanLtv: Number(e.target.value) || 0 }))}
                      min={0}
                      step="1"
                      suffix="%"
                    />
                  </div>
                  {/* 대출 금리 */}
                  <div>
                    <FormLabel htmlFor="rate">대출 금리 (연)</FormLabel>
                    <FormInput
                      id="rate"
                      type="number"
                      value={costs.loanRate}
                      onChange={(e) => setCosts((c) => ({ ...c, loanRate: Number(e.target.value) || 0 }))}
                      min={0}
                      step="0.1"
                      suffix="%"
                    />
                  </div>
                  {/* 대출수수료 */}
                  <div>
                    <FormLabel htmlFor="loanFee">대출수수료</FormLabel>
                    <FormInput
                      id="loanFee"
                      type="number"
                      value={costs.loanFeeRate}
                      onChange={(e) => setCosts((c) => ({ ...c, loanFeeRate: Number(e.target.value) || 0 }))}
                      min={0}
                      step="0.1"
                      suffix="%"
                    />
                  </div>
                  {/* 중도상환 수수료 */}
                  <div>
                    <FormLabel htmlFor="prepayment">중도상환 수수료</FormLabel>
                    <FormInput
                      id="prepayment"
                      type="number"
                      value={costs.prepaymentRate}
                      onChange={(e) => setCosts((c) => ({ ...c, prepaymentRate: Number(e.target.value) || 0 }))}
                      min={0}
                      step="0.1"
                      suffix="%"
                    />
                  </div>
                </div>

                {/* 대출 원금 계산 미리보기 */}
                {bid > 0 && costs.loanLtv > 0 && (
                  <div className="mt-4 rounded-lg border border-zinc-200 bg-white p-3">
                    <p className="text-xs font-medium text-zinc-500">대출 원금 기준</p>
                    <p className="tabular-nums mt-0.5 text-sm text-zinc-700">
                      {bid.toLocaleString()}만원 × {costs.loanLtv}% = <strong>{loanPrincipal.toLocaleString()}만원</strong>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={submitting}
            className={cn(
              "btn-lift flex h-[52px] w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 text-[15px] font-semibold text-white shadow-md",
              "disabled:cursor-not-allowed disabled:opacity-60"
            )}
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                분석 중...
              </>
            ) : (
              "분석하기"
            )}
          </button>

        </div>
      </div>
    </form>
  );
}
