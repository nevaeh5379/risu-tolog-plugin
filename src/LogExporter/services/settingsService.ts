// src/LogExporter/services/settingsService.ts

/**
 * 모든 캐릭터의 설정을 불러옵니다.
 * @returns {object} 모든 캐릭터의 설정이 담긴 객체.
 */
export const loadAllCharSettings = () => {
    try {
        const settings = localStorage.getItem('logExporterCharacterSettings');
        return settings ? JSON.parse(settings) : {};
    } catch (e) {
        console.error('[Log Exporter] 설정을 불러오는 데 실패했습니다:', e);
        return {};
    }
};

/**
 * 전역 설정을 불러옵니다.
 * @returns {object} 전역 설정 객체.
 */
export const loadGlobalSettings = () => {
    try {
        const settings = localStorage.getItem('logExporterGlobalSettings');
        const parsed = settings ? JSON.parse(settings) : {};
        // 기본 구조 보장
        if (!Array.isArray(parsed.profileClasses)) parsed.profileClasses = [];
        if (!Array.isArray(parsed.participantNameClasses)) parsed.participantNameClasses = [];
        
        // 기본 클래스 자동 추가 (한 번만)
        if (!parsed.defaultClassesAdded) {
            // RisuAI 기본 프로필 클래스들 (항상 추가)
            const defaultProfileClasses = ['x-risu-GH_VEX_ST_C', 'x-risu-GH_VEX_ST_U'];
            const defaultNameClasses = ['x-risu-GH_VEX_Head_C2', 'x-risu-GH_VEX_Head_U2'];
            
            parsed.profileClasses = [...new Set([...parsed.profileClasses, ...defaultProfileClasses])];
            parsed.participantNameClasses = [...new Set([...parsed.participantNameClasses, ...defaultNameClasses])];
            parsed.defaultClassesAdded = true;
            
            // 바로 저장
            localStorage.setItem('logExporterGlobalSettings', JSON.stringify(parsed));
        }
        
        return parsed;
    } catch (e) {
        console.error('[Log Exporter] 전역 설정을 불러오는 데 실패했습니다:', e);
        return { profileClasses: [], participantNameClasses: [] };
    }
};

/**
 * 전역 설정을 저장합니다.
 * @param {object} newSettings - 저장할 설정 객체.
 */
export const saveGlobalSettings = (newSettings: object) => {
    try {
        const existing = loadGlobalSettings();
        const merged = { ...existing, ...newSettings };
        localStorage.setItem('logExporterGlobalSettings', JSON.stringify(merged));
        console.log('[Log Exporter] 전역 설정 저장 완료:', merged);
    } catch (e) {
        console.error('[Log Exporter] 전역 설정 저장 실패:', e);
    }
};
