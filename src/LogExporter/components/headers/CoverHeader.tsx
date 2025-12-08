
import React, { useState, useEffect } from 'react';
import type { CharInfo, ColorPalette } from '../../../types';
import { imageUrlToBlob } from '../../utils/imageUtils';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  embedImagesAsBlob: boolean;
  showHeaderIcon?: boolean;
  headerTags?: string;
  headerBannerUrl?: string;
  headerBannerBlur?: boolean;
}

const CoverHeader: React.FC<LogHeaderProps> = ({ 
    charInfo, 
    color, 
    embedImagesAsBlob, 
    showHeaderIcon, 
    headerTags, 
    headerBannerUrl,
    headerBannerBlur 
}) => {
  const [avatarSrc, setAvatarSrc] = useState(charInfo.avatarUrl);
  const [bannerSrc, setBannerSrc] = useState<string | null>(headerBannerUrl || null);

  useEffect(() => {
    const convertImages = async () => {
        if (embedImagesAsBlob) {
            // 아바타 변환
            if (charInfo.avatarUrl) {
                try {
                    const blobUrl = await imageUrlToBlob(charInfo.avatarUrl);
                    setAvatarSrc(blobUrl);
                } catch (e) { /* ignore */ }
            }
            // 배너 변환
            if (headerBannerUrl) {
                try {
                    const blobUrl = await imageUrlToBlob(headerBannerUrl);
                    setBannerSrc(blobUrl);
                } catch (e) { /* ignore */ }
            }
        }
    };
    convertImages();
  }, [charInfo.avatarUrl, headerBannerUrl, embedImagesAsBlob]);

  // 태그 처리
  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  // 배경 스타일 결정 (블러 효과 옵션 적용, 기본값은 없음)
  const backgroundStyle: React.CSSProperties = {
      backgroundImage: `url(${bannerSrc || avatarSrc})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      filter: headerBannerBlur ? 'blur(8px)' : 'none', // 기본 블러 제거
      opacity: 0.9, // 약간 어둡게 처리할 수도 있음
  };

  return (
    <header style={{
        marginBottom: '4em',
        position: 'relative',
        backgroundColor: color.background,
    }}>
        {/* 1. 상단 커버 영역 */}
        <div style={{
            height: '280px', // 높이 약간 증가
            width: '100%',
            position: 'relative',
            overflow: 'hidden',
            backgroundColor: '#333',
        }}>
             <div style={{
                 position: 'absolute',
                 top: 0, left: 0, right: 0, bottom: 0,
                 ...backgroundStyle
             }} />
             {/* 하단 그라데이션 강화 (텍스트 가독성용) */}
             <div style={{
                 position: 'absolute',
                 top: 0, left: 0, right: 0, bottom: 0,
                 background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.6) 100%)'
             }} />
        </div>

        {/* 2. 하단 정보 영역 (좌측 정렬 + 경계선 걸치기) */}
        <div style={{
            maxWidth: '900px',
            margin: '0 auto',
            position: 'relative',
            padding: '0 32px', // 좌우 여백
            display: 'flex',
            alignItems: 'flex-end', // 바닥 정렬
            gap: '24px',
            marginTop: '-50px', // 커버 위로 올리기
            pointerEvents: 'none' // 텍스트 선택 용이하게
        }}>
            {/* 프로필 이미지 (좌측 하단) */}
            {showHeaderIcon !== false && (
                <div style={{
                    flexShrink: 0,
                    position: 'relative',
                    pointerEvents: 'auto'
                }}>
                    <img 
                        src={avatarSrc} 
                        data-log-exporter-avatar="true" 
                        style={{ 
                            width: '160px', 
                            height: '160px', 
                            borderRadius: '16px', // 원형 대신 둥근 사각형 (페이스북 스타일)
                            objectFit: 'cover', 
                            border: `5px solid ${color.background}`, 
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                            backgroundColor: color.cardBg
                        }} 
                    />
                </div>
            )}

            {/* 텍스트 정보 (프로필 옆) */}
            <div style={{ 
                flex: 1, 
                paddingBottom: '16px', 
                pointerEvents: 'auto',
                display: 'flex',
                alignItems: 'flex-end', // 이름과 소제목을 바닥선에 맞춤
                justifyContent: 'space-between', // 양 끝 정렬
                gap: '20px',
                flexWrap: 'wrap'
            }}>
                {/* 이름 (좌측) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: '2.2em', 
                        fontWeight: 800, 
                        color: color.text,
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        lineHeight: 1,
                        position: 'relative',
                        zIndex: 1
                    }}>
                        {charInfo.name}
                        {/* 이름 밑줄 디자인 포인트 */}
                        <span style={{
                            position: 'absolute',
                            bottom: '2px',
                            left: 0,
                            width: '100%',
                            height: '8px',
                            background: color.nameColor,
                            opacity: 0.3,
                            zIndex: -1,
                            borderRadius: '4px'
                        }} />
                    </h1>
                </div>
                
                {/* 소제목 및 태그 (우측) */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'flex-end', 
                    gap: '6px' 
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* 소제목 디자인 포인트: 뱃지 스타일 */}
                        <p style={{ 
                            margin: 0, 
                            fontSize: '0.95em', 
                            color: color.cardBg, // 뱃지 텍스트는 배경색과 대비되게
                            fontWeight: 700,
                            background: color.textSecondary, // 뱃지 배경
                            padding: '4px 12px',
                            borderRadius: '100px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                        }}>
                            {charInfo.chatName}
                        </p>
                    </div>

                    {tags.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            {tags.map((tag, index) => (
                                <span key={index} style={{ 
                                    fontSize: '0.75em', 
                                    padding: '2px 8px', 
                                    borderRadius: '4px', 
                                    border: `1px solid ${color.border}`,
                                    color: color.textSecondary,
                                    opacity: 0.8
                                }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </header>
  );
};

export default CoverHeader;
