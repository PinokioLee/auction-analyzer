import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatKoreanWon(manwon: number): string {
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000);
    const remainder = manwon % 10000;
    if (remainder === 0) return `${eok}억`;
    return `${eok}억 ${remainder.toLocaleString("ko-KR")}만`;
  }
  return `${manwon.toLocaleString("ko-KR")}만`;
}

export function formatManwon(manwon: number): string {
  return `${manwon.toLocaleString("ko-KR")}만원`;
}
