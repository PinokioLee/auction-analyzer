const NAVER_LAND_BASE  = "https://land.naver.com/search/";
const NAVER_MAP_BASE   = "https://map.naver.com/v5/search/";

export function naverLandUrl(aptName: string, regionName?: string): string {
  const q = regionName ? `${regionName} ${aptName}` : aptName;
  return `${NAVER_LAND_BASE}?query=${encodeURIComponent(q)}`;
}

export function naverMapUrl(aptName: string, regionName?: string): string {
  const q = regionName ? `${regionName} ${aptName}` : aptName;
  return `${NAVER_MAP_BASE}${encodeURIComponent(q)}`;
}

// 공인중개사 검색 (단지명 + 공인중개사)
export function naverAgentUrl(aptName: string, regionName?: string): string {
  const q = regionName
    ? `${regionName} ${aptName} 공인중개사`
    : `${aptName} 공인중개사`;
  return `${NAVER_MAP_BASE}${encodeURIComponent(q)}`;
}
