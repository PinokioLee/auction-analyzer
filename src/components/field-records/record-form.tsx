"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";

// ── 타입 ─────────────────────────────────────────────────
type RegionMap = Record<string, { code: string; name: string }[]>;

export interface Memo {
  atmosphere?: string;
  parking?: string;
  noise?: string;
  management?: string;
  repair?: string;
  call?: string;
  verdict?: string;
}

export interface RecordFormData {
  case_number?: string;
  bid_date?: string;
  lawd_cd?: string;
  apt_name?: string;
  exclusive_area?: number;
  memo?: Memo;
}

const MEMO_FIELDS: { key: keyof Memo; label: string; placeholder: string }[] = [
  { key: "atmosphere", label: "단지 분위기",  placeholder: "주변 환경, 주민 구성, 거주 분위기..." },
  { key: "parking",    label: "주차",          placeholder: "주차 공간 수, 혼잡도..." },
  { key: "noise",      label: "소음",          placeholder: "도로 소음, 층간소음, 주변 시설..." },
  { key: "management", label: "관리 상태",     placeholder: "청소, 엘리베이터, 공용공간 상태..." },
  { key: "repair",     label: "수리 필요",     placeholder: "도배/장판, 욕실/주방, 전체 상태..." },
  { key: "call",       label: "통화 내용",     placeholder: "중개사·주민·관리소 통화 내용..." },
  { key: "verdict",    label: "최종 판단",     placeholder: "입찰 여부, 적정 입찰가 의견..." },
];

// ── Props ─────────────────────────────────────────────────
interface Props {
  mode: "new" | "edit";
  recordId?: string;
  initialData?: RecordFormData;
}

// ── 컴포넌트 ──────────────────────────────────────────────
export function RecordForm({ mode, recordId, initialData }: Props) {
  const router = useRouter();

  // 기본 필드
  const [caseNumber, setCaseNumber] = useState(initialData?.case_number ?? "");
  const [bidDate,    setBidDate]    = useState(initialData?.bid_date    ?? "");
  const [aptName,    setAptName]    = useState(initialData?.apt_name    ?? "");
  const [area,       setArea]       = useState(
    initialData?.exclusive_area ? String(initialData.exclusive_area) : ""
  );
  const [lawdCd,     setLawdCd]     = useState(initialData?.lawd_cd ?? "");
  const [memo, setMemo] = useState<Memo>(initialData?.memo ?? {});

  // 지역 선택
  const [regionMap,  setRegionMap]  = useState<RegionMap>({});
  const [sidoList,   setSidoList]   = useState<string[]>([]);
  const [selectedSido,     setSelectedSido]     = useState("");
  const [sigunguList,      setSigunguList]       = useState<{ code: string; name: string }[]>([]);
  const [selectedSigungu,  setSelectedSigungu]   = useState("");

  // 아파트 자동완성
  const [aptSuggestions, setAptSuggestions] = useState<string[]>([]);
  const [aptFocused,     setAptFocused]     = useState(false);

  // 상태
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState("");

  // ── 지역 데이터 로드 ──────────────────────────────────
  useEffect(() => {
    fetch("/api/regions")
      .then((r) => r.json())
      .then((data: RegionMap) => {
        setRegionMap(data);
        setSidoList(Object.keys(data));

        // 편집 모드: lawdCd로 sido/sigungu 역탐색
        if (initialData?.lawd_cd) {
          for (const [sido, list] of Object.entries(data)) {
            const found = list.find((s) => s.code === initialData.lawd_cd);
            if (found) {
              setSelectedSido(sido);
              setSigunguList(list);
              setSelectedSigungu(found.code);
              break;
            }
          }
        }
      })
      .catch(() => {});
  }, [initialData?.lawd_cd]);

  // ── 시도 변경 ─────────────────────────────────────────
  function handleSidoChange(sido: string) {
    setSelectedSido(sido);
    const list = regionMap[sido] ?? [];
    setSigunguList(list);
    setSelectedSigungu("");
    setLawdCd("");
  }

  // ── 시군구 변경 ───────────────────────────────────────
  function handleSigunguChange(code: string) {
    setSelectedSigungu(code);
    setLawdCd(code);
  }

  // ── 아파트 자동완성 ───────────────────────────────────
  const fetchApts = useCallback(
    (() => {
      let timer: ReturnType<typeof setTimeout>;
      return (q: string) => {
        clearTimeout(timer);
        if (!lawdCd || q.length < 1) { setAptSuggestions([]); return; }
        timer = setTimeout(async () => {
          try {
            const res = await fetch(
              `/api/apartments?lawdCd=${lawdCd}&q=${encodeURIComponent(q)}`
            );
            const data = await res.json();
            setAptSuggestions((data as { apt_name: string }[]).map((d) => d.apt_name));
          } catch { setAptSuggestions([]); }
        }, 200);
      };
    })(),
    [lawdCd]
  );

  function handleAptChange(value: string) {
    setAptName(value);
    fetchApts(value);
  }

  function selectApt(name: string) {
    setAptName(name);
    setAptSuggestions([]);
    setAptFocused(false);
  }

  // ── 메모 업데이트 ─────────────────────────────────────
  function updateMemo(key: keyof Memo, value: string) {
    setMemo((prev) => ({ ...prev, [key]: value }));
  }

  // ── 제출 ─────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!aptName.trim()) { setError("아파트명을 입력해주세요."); return; }

    setSaving(true);
    setError("");

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setError("로그인이 필요합니다."); return; }

      const payload = {
        user_id:        user.id,
        case_number:    caseNumber   || null,
        bid_date:       bidDate      || null,
        lawd_cd:        lawdCd       || null,
        apt_name:       aptName.trim(),
        exclusive_area: area ? Number(area) : null,
        memo: memo as import("@/types/database").Json,
      };

      if (mode === "new") {
        const { error: err } = await supabase
          .from("field_records")
          .insert(payload);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from("field_records")
          .update(payload)
          .eq("id", recordId!);
        if (err) throw err;
      }

      router.push("/dashboard/field-records");
      router.refresh();
    } catch {
      setError("저장 중 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setSaving(false);
    }
  }

  // ── 렌더 ─────────────────────────────────────────────
  const inputCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 placeholder:text-zinc-400";
  const selectCls =
    "w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-zinc-400";
  const labelCls = "mb-1.5 block text-[12px] font-medium text-zinc-500";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">

      {/* ① 기본 정보 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-5 text-[14px] font-semibold text-zinc-700">기본 정보</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* 사건번호 */}
          <div>
            <label className={labelCls}>사건번호</label>
            <input
              className={inputCls}
              placeholder="예) 2024타경12345"
              value={caseNumber}
              onChange={(e) => setCaseNumber(e.target.value)}
            />
          </div>

          {/* 입찰기일 */}
          <div>
            <label className={labelCls}>입찰기일</label>
            <input
              type="date"
              className={inputCls}
              value={bidDate}
              onChange={(e) => setBidDate(e.target.value)}
            />
          </div>

          {/* 시도 */}
          <div>
            <label className={labelCls}>시도</label>
            <select
              className={selectCls}
              value={selectedSido}
              onChange={(e) => handleSidoChange(e.target.value)}
            >
              <option value="">시도 선택</option>
              {sidoList.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* 시군구 */}
          <div>
            <label className={labelCls}>시군구</label>
            <select
              className={selectCls}
              value={selectedSigungu}
              onChange={(e) => handleSigunguChange(e.target.value)}
              disabled={!selectedSido}
            >
              <option value="">시군구 선택</option>
              {sigunguList.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* 아파트명 */}
          <div className="relative sm:col-span-2">
            <label className={labelCls}>
              아파트명 <span className="text-red-400">*</span>
            </label>
            <input
              className={inputCls}
              placeholder="아파트명 입력"
              value={aptName}
              onChange={(e) => handleAptChange(e.target.value)}
              onFocus={() => setAptFocused(true)}
              onBlur={() => setTimeout(() => setAptFocused(false), 150)}
              autoComplete="off"
            />
            {aptFocused && aptSuggestions.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full rounded-lg border border-zinc-200 bg-white shadow-lg">
                {aptSuggestions.map((name) => (
                  <li
                    key={name}
                    onMouseDown={() => selectApt(name)}
                    className="cursor-pointer px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 전용면적 */}
          <div>
            <label className={labelCls}>전용면적 (㎡)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={inputCls}
              placeholder="예) 84.99"
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* ② 메모 그리드 */}
      <section className="rounded-2xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-5 text-[14px] font-semibold text-zinc-700">임장 메모</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {MEMO_FIELDS.map(({ key, label, placeholder }) => (
            <div
              key={key}
              className={key === "verdict" ? "sm:col-span-2" : ""}
            >
              <label className={labelCls}>{label}</label>
              <textarea
                rows={key === "verdict" ? 3 : 2}
                className={`${inputCls} resize-none`}
                placeholder={placeholder}
                value={memo[key] ?? ""}
                onChange={(e) => updateMemo(key, e.target.value)}
              />
            </div>
          ))}
        </div>
      </section>

      {/* 에러 */}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
      )}

      {/* 버튼 */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => router.back()}
          className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700 disabled:opacity-60"
        >
          {saving && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "new" ? "기록 저장" : "수정 저장"}
        </button>
      </div>
    </form>
  );
}
