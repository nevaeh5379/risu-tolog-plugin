
import React, { useEffect, useState } from 'react';
import type { CharInfo, ColorPalette } from '../../../types';
import { imageUrlToBlob } from '../../utils/imageUtils';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  embedImagesAsBlob: boolean;
  showHeaderIcon?: boolean;
  headerTags?: string;
}

const SmartHeader: React.FC<LogHeaderProps> = ({ charInfo, color, embedImagesAsBlob, showHeaderIcon, headerTags }) => {
  const [avatarSrc, setAvatarSrc] = useState(charInfo.avatarUrl);

  useEffect(() => {
    const convertAvatar = async () => {
      if (embedImagesAsBlob && charInfo.avatarUrl) {
        try {
            const blobUrl = await imageUrlToBlob(charInfo.avatarUrl);
            setAvatarSrc(blobUrl);
        } catch (e) {
            // ignore
        }
      }
    };
    convertAvatar();
  }, [charInfo.avatarUrl, embedImagesAsBlob]);

  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <header style={{
        padding: '24px 0 40px', // 상단 여백, 하단 여백 넉넉히
        display: 'flex',
        justifyContent: 'center',
    }}>
        {/* 메인 글래스 카드 */}
        <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '24px 32px',
            background: color.cardBg, // 테마의 반투명 배경색 사용
            backdropFilter: 'blur(16px) saturate(180%)', // 강력한 블러와 채도 증가
            borderRadius: '24px',
            border: `1px solid ${color.border}`, // 은은한 테두리
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.25)', // 부드럽고 깊은 그림자
            maxWidth: '90%',
            width: 'auto',
            minWidth: '300px'
        }}>
            {/* 아바타 영역 */}
            {showHeaderIcon !== false && (
                <div style={{ position: 'relative', flexShrink: 0 }}>
                    {/* 아바타 뒤 은은한 글로우 효과 */}
                    <div style={{
                        position: 'absolute',
                        top: '10%', left: '10%', right: '10%', bottom: '10%',
                        background: color.nameColor,
                        filter: 'blur(20px)',
                        opacity: 0.4,
                        borderRadius: '50%',
                        zIndex: 0
                    }} />
                    <img 
                        src={avatarSrc} 
                        data-log-exporter-avatar="true" 
                        style={{ 
                            position: 'relative',
                            width: '84px', 
                            height: '84px', 
                            borderRadius: '20px', // 완전 원형 대신 둥근 사각형 (스마트함 강조)
                            objectFit: 'cover', 
                            display: 'block',
                            zIndex: 1,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }} 
                    />
                </div>
            )}

            {/* 텍스트 정보 영역 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: '1.8em', 
                        color: color.text, // 흰색 계열
                        fontWeight: 700,
                        letterSpacing: '-0.01em',
                        lineHeight: 1.2
                    }}>
                        {charInfo.name}
                    </h1>
                    {/* 장식용 점 */}
                    <span style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        background: color.nameColor,
                        opacity: 0.8
                    }} />
                </div>

                <p style={{ 
                    margin: 0, 
                    color: color.textSecondary, 
                    fontSize: '0.95em', 
                    fontWeight: 500 
                }}>
                    {charInfo.chatName}
                </p>

                {tags.length > 0 && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px', flexWrap: 'wrap' }}>
                        {tags.map((tag, index) => (
                            <span key={index} style={{ 
                                fontSize: '0.75em', 
                                color: color.nameColor,
                                background: color.quoteBg, // 테마의 인용구 배경색 활용 (연한 톤)
                                padding: '4px 10px',
                                borderRadius: '8px',
                                fontWeight: 600,
                                letterSpacing: '0.02em'
                            }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </div>
        </div>
    </header>
  );
};

export default SmartHeader;
