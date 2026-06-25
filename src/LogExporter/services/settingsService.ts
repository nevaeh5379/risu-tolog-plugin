// settingsService.ts — API v3.0 기반
// localStorage → Risuai.pluginStorage / getLocalPluginStorage 로 마이그레이션
// 모든 메서드가 async가 됩니다.

const CHAR_SETTINGS_KEY = 'logExporterCharacterSettings'
const GLOBAL_SETTINGS_KEY = 'logExporterGlobalSettings'

const DEFAULT_PROFILE_CLASSES = ['x-risu-GH_VEX_ST_C', 'x-risu-GH_VEX_ST_U']
const DEFAULT_NAME_CLASSES = ['x-risu-GH_VEX_Head_C2', 'x-risu-GH_VEX_Head_U2']

/**
 * 모든 캐릭터의 설정을 불러옵니다. (세이브 파일 단위, 동기화 지원)
 */
export const loadAllCharSettings = async (): Promise<Record<string, any>> => {
  try {
    const raw = await Risuai.pluginStorage.getItem(CHAR_SETTINGS_KEY)
    return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {}
  } catch (e) {
    console.error('[log plugin] 설정 로드 실패:', e)
    return {}
  }
}

/**
 * 단일 캐릭터 설정을 저장합니다.
 */
export const saveCharSettings = async (charId: string, settings: any): Promise<void> => {
  try {
    const all = await loadAllCharSettings()
    all[charId] = { ...(all[charId] || {}), ...settings }
    await Risuai.pluginStorage.setItem(CHAR_SETTINGS_KEY, JSON.stringify(all))
  } catch (e) {
    console.error('[log plugin] 캐릭터 설정 저장 실패:', e)
  }
}

/**
 * 전역 설정을 불러옵니다.
 */
export const loadGlobalSettings = async (): Promise<any> => {
  try {
    const raw = await Risuai.pluginStorage.getItem(GLOBAL_SETTINGS_KEY)
    const parsed = raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : {}
    if (!Array.isArray(parsed.profileClasses)) parsed.profileClasses = []
    if (!Array.isArray(parsed.participantNameClasses)) parsed.participantNameClasses = []

    // 기본 클래스 자동 추가 (한 번만)
    if (!parsed.defaultClassesAdded) {
      parsed.profileClasses = [...new Set([...parsed.profileClasses, ...DEFAULT_PROFILE_CLASSES])]
      parsed.participantNameClasses = [
        ...new Set([...parsed.participantNameClasses, ...DEFAULT_NAME_CLASSES])
      ]
      parsed.defaultClassesAdded = true
      await Risuai.pluginStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(parsed))
    }

    return parsed
  } catch (e) {
    console.error('[log plugin] 전역 설정 로드 실패:', e)
    return { profileClasses: [], participantNameClasses: [] }
  }
}

/**
 * 전역 설정을 저장합니다.
 */
export const saveGlobalSettings = async (newSettings: any): Promise<void> => {
  try {
    const existing = await loadGlobalSettings()
    const merged = { ...existing, ...newSettings }
    await Risuai.pluginStorage.setItem(GLOBAL_SETTINGS_KEY, JSON.stringify(merged))
  } catch (e) {
    console.error('[log plugin] 전역 설정 저장 실패:', e)
  }
}