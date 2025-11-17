import React, { useEffect, useState } from 'react';
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
  headerBannerAlign?: number;
  isForExport?: boolean;
}

const BannerHeader: React.FC<LogHeaderProps> = ({ 
  charInfo, 
  color, 
  embedImagesAsBlob, 
  showHeaderIcon, 
  headerTags, 
  headerBannerUrl,
  headerBannerBlur = true,
  headerBannerAlign = 50,
  isForExport
}) => {
  const [avatarSrc, setAvatarSrc] = useState(charInfo.avatarUrl);
  const [bannerSrc, setBannerSrc] = useState(headerBannerUrl || charInfo.avatarUrl);

  useEffect(() => {
    const convertImages = async () => {
      if (embedImagesAsBlob) {
        if (charInfo.avatarUrl) {
          try {
            const blobUrl = await imageUrlToBlob(charInfo.avatarUrl);
            setAvatarSrc(blobUrl);
          } catch (e) { /* ignore */ }
        }
        
        const sourceUrl = headerBannerUrl || charInfo.avatarUrl;
        if (sourceUrl) {
          try {
            const blobUrl = await imageUrlToBlob(sourceUrl);
            setBannerSrc(blobUrl);
          } catch (e) { /* ignore */ }
        }
      }
    };
    convertImages();
  }, [charInfo.avatarUrl, headerBannerUrl, embedImagesAsBlob]);

  useEffect(() => {
    // Update bannerSrc when the prop changes, without waiting for image conversion
    setBannerSrc(headerBannerUrl || charInfo.avatarUrl);
  }, [headerBannerUrl, charInfo.avatarUrl]);

  const headerStyles: React.CSSProperties = {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    padding: '20px',
    marginBottom: '2em',
    borderRadius: '8px',
    color: '#fff',
    overflow: 'hidden',
  };

  const finalBannerSrc = embedImagesAsBlob ? bannerSrc : (headerBannerUrl || charInfo.avatarUrl);

  const bannerContainerStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
    transform: 'scale(1.1)',
  };

  const bannerImageStyles: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    objectPosition: `center ${headerBannerAlign}%`,
    filter: headerBannerBlur ? 'blur(3px) brightness(0.6)' : 'brightness(0.7)',
  };

  const contentStyles: React.CSSProperties = {
    position: 'relative',
    zIndex: 2,
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    width: '100%',
  };

  const textContainerStyles: React.CSSProperties = {
    textAlign: 'left',
  };

  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <header style={headerStyles}>
      <div style={bannerContainerStyles}>
        {isForExport && finalBannerSrc ? (
          <img src={finalBannerSrc} style={bannerImageStyles} alt="Banner" />
        ) : (
          <div style={{
            ...bannerImageStyles, 
            backgroundImage: finalBannerSrc ? `url(${finalBannerSrc})` : `linear-gradient(45deg, ${color.cardBg}, ${color.background})`,
            backgroundSize: 'cover',
            backgroundPosition: `center ${headerBannerAlign}%`
          }}></div>
        )}
      </div>
      <div style={contentStyles}>
        {showHeaderIcon !== false && (
          <img src={avatarSrc} data-log-exporter-avatar="true" style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: `4px solid ${color.avatarBorder}`, boxShadow: '0 2px 10px rgba(0,0,0,0.5)', flexShrink: 0 }} alt="Avatar" />
        )}
        <div style={textContainerStyles}>
          <h1 style={{ color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.8)', margin: '0 0 0.2em 0', fontSize: '2em' }}>{charInfo.name}</h1>
          <p style={{ opacity: 0.9, margin: '0 0 1em 0', fontSize: '1em' }}>{charInfo.chatName}</p>
          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {tags.map((tag, index) => (
                <span key={index} style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', padding: '5px 12px', borderRadius: '15px', fontSize: '0.8em', border: '1px solid rgba(255,255,255,0.3)' }}>
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

export default BannerHeader;