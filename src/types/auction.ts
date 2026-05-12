export interface AuctionInput {
  apartmentName: string;
  area: number;
  floor: number;
  totalFloors: number;
  bidPrice: number;
  additionalCosts: AdditionalCosts;
}

export interface AdditionalCosts {
  legalFee: number;
  evictionFee: number;
  unpaidMaintenance: number;
  loanInterest: number;
  enforcementFee: number;
}

export interface AcquisitionTaxResult {
  acquisitionTax: number;
  educationTax: number;
  ruralTax: number;
  total: number;
}

export interface TotalCostResult {
  bidPrice: number;
  acquisitionTax: AcquisitionTaxResult;
  additionalCosts: AdditionalCosts;
  grandTotal: number;
}
