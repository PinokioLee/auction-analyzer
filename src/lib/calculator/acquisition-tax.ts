import type { AcquisitionTaxResult } from "@/types/auction";

export function calculateAcquisitionTax(
  priceManwon: number,
  areaSqm: number
): AcquisitionTaxResult {
  const priceWon = priceManwon * 10000;

  let taxRate: number;
  if (priceWon <= 600_000_000) {
    taxRate = 0.01;
  } else if (priceWon <= 900_000_000) {
    // 선형 누진: (가액/억 - 3) / 300
    taxRate = (priceWon / 100_000_000 - 3) / 300;
  } else {
    taxRate = 0.03;
  }

  const acquisitionTax = Math.floor(priceWon * taxRate);
  const educationTax = Math.floor(acquisitionTax * 0.1);
  const ruralTax = areaSqm > 85 ? Math.floor(acquisitionTax * 0.2) : 0;
  const total = acquisitionTax + educationTax + ruralTax;

  return {
    acquisitionTax: Math.round(acquisitionTax / 10000),
    educationTax: Math.round(educationTax / 10000),
    ruralTax: Math.round(ruralTax / 10000),
    total: Math.round(total / 10000),
  };
}
