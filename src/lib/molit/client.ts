export interface MolitTransaction {
  aptNm: string;
  excluUseAr: string;
  dealAmount: string;
  floor: string;
  dealYear: string;
  dealMonth: string;
  dealDay: string;
}

export interface MolitApiParams {
  LAWD_CD: string;
  DEAL_YMD: string;
  pageNo?: number;
  numOfRows?: number;
}

export async function fetchApartmentTransactions(
  _params: MolitApiParams
): Promise<MolitTransaction[]> {
  throw new Error("국토부 API 연동 미구현. MOLIT_API_KEY 설정 후 구현 필요.");
}
