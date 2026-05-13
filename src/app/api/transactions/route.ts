import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface TransactionRow {
  floor: number | null;
  deal_amount: number;
  deal_date: string;
}

function groupByFloorRange(
  data: TransactionRow[],
  totalFloors: number
): { low: number; mid: number; high: number } {
  if (data.length === 0) return { low: 0, mid: 0, high: 0 };

  const lowMax = Math.floor(totalFloors * 0.33);
  const midMax = Math.floor(totalFloors * 0.66);

  const avg = (items: TransactionRow[]) =>
    items.length === 0
      ? 0
      : Math.round(items.reduce((s, t) => s + t.deal_amount, 0) / items.length);

  const overall = avg(data);
  const low = avg(data.filter((t) => (t.floor ?? 0) <= lowMax)) || overall;
  const mid =
    avg(
      data.filter(
        (t) => (t.floor ?? 0) > lowMax && (t.floor ?? 0) <= midMax
      )
    ) || overall;
  const high = avg(data.filter((t) => (t.floor ?? 0) > midMax)) || overall;

  return { low, mid, high };
}

export async function GET(req: NextRequest) {
  const lawdCd = req.nextUrl.searchParams.get("lawdCd");
  const aptName = req.nextUrl.searchParams.get("aptName");
  const area = req.nextUrl.searchParams.get("area");
  const totalFloors = parseInt(req.nextUrl.searchParams.get("totalFloors") ?? "0");

  if (!lawdCd || !aptName || !area) {
    return NextResponse.json(
      { error: "lawdCd, aptName, area 필수" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const cutoff = sixMonthsAgo.toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("apt_transactions")
    .select("floor, deal_amount, deal_date")
    .eq("lawd_cd", lawdCd)
    .eq("apt_name", aptName)
    .eq("exclusive_area", parseFloat(area))
    .gte("deal_date", cutoff)
    .order("deal_date", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = (data ?? []) as TransactionRow[];
  const byFloor = groupByFloorRange(rows, totalFloors || 20);

  const amounts = rows.map((r) => r.deal_amount);
  const stats = {
    count: rows.length,
    avg_price:
      rows.length > 0
        ? Math.round(amounts.reduce((a, b) => a + b, 0) / amounts.length)
        : 0,
    max_price: amounts.length > 0 ? Math.max(...amounts) : 0,
    min_price: amounts.length > 0 ? Math.min(...amounts) : 0,
    by_floor: byFloor,
    period: rows.length > 0
      ? `${rows[rows.length - 1].deal_date.slice(0, 7)} ~ ${rows[0].deal_date.slice(0, 7)}`
      : "",
  };

  return NextResponse.json({ transactions: rows, stats });
}
