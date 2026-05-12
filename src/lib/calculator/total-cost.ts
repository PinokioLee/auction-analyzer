import type { AuctionInput, TotalCostResult } from "@/types/auction";
import { calculateAcquisitionTax } from "./acquisition-tax";

export function calculateTotalCost(input: AuctionInput): TotalCostResult {
  const taxResult = calculateAcquisitionTax(input.bidPrice, input.area);

  const additionalSum =
    input.additionalCosts.legalFee +
    input.additionalCosts.evictionFee +
    input.additionalCosts.unpaidMaintenance +
    input.additionalCosts.loanInterest +
    input.additionalCosts.enforcementFee;

  const grandTotal = input.bidPrice + taxResult.total + additionalSum;

  return {
    bidPrice: input.bidPrice,
    acquisitionTax: taxResult,
    additionalCosts: input.additionalCosts,
    grandTotal,
  };
}
