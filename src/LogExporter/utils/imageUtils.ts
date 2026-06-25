// imageUtils.ts — v3.0 기반
// iframe CSP: connect-src 'none' 으로 인해 iframe 내부 fetch가 완전 차단됩니다.
// 따라서 이미지를 blob URL이 아닌 data URL(base64)로 변환하여 <img src="data:...">로
// 사용해야 합니다. data URL은 fetch 없이 로드 가능하고 CSP img-src data:에 허용됩니다.
//
// 변환 흐름: 원본 URL → Risuai.nativeFetch(메인 측 동일 출처, CORS 회피) → blob → data URL
// 이렇게 하면 html-to-image / html2canvas가 캡처 시 fetch/CORS 이슈 없이 동작합니다.

const dataUrlCache = new Map<string, string>()

// Blob → data URL (base64)
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('FileReader failed'))
    reader.readAsDataURL(blob)
  })
}

// 네이티브 fetch → blob (메인 측 동일 출처, CORS 회피)
// 주의: Risuai.nativeFetch(url, options)는 내부적으로 fetchNative(url, arg)를 호출하며,
// arg가 undefined면 arg.interceptor 접근 시 크래시하므로 반드시 { method: 'GET' }을 전달합니다.
async function fetchToBlobNative(url: string): Promise<Blob> {
  const res = await Risuai.nativeFetch(url, { method: 'GET' } as any)
  if (!res.ok) throw new Error(`nativeFetch failed: ${res.status} ${res.statusText} for ${url}`)
  return await res.blob()
}

/**
 * 이미지 URL을 data URL(base64)로 변환합니다.
 * iframe CSP connect-src 'none' 환경에서 blob URL은 fetch가 필요하지만
 * data URL은 fetch 없이 <img>로 로드 가능하여 캡처 라이브러리가 정상 동작합니다.
 *
 * @returns data URL 문자열. 실패 시 원본 URL 반환.
 */
export const imageUrlToBlob = async (url: string): Promise<string> => {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url
  }
  if (dataUrlCache.has(url)) {
    return dataUrlCache.get(url)!
  }

  try {
    const blob = await fetchToBlobNative(url)
    const dataUrl = await blobToDataUrl(blob)
    dataUrlCache.set(url, dataUrl)
    return dataUrl
  } catch (error) {
    console.warn('[log plugin] imageUrlToBlob nativeFetch failed, using original:', url, error)
    return url
  }
}

export const clearBlobUrlCache = () => {
  // data URL은 revoke 불필요. 캐시만 비움.
  dataUrlCache.clear()
  console.log('[log plugin] Data URL cache cleared.')
}