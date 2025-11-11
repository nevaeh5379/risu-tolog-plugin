import React, { useEffect, useState } from 'react';
import type { CharInfo, ColorPalette } from '../../types';
import { imageUrlToBlob } from '../utils/imageUtils';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  embedImagesAsBlob: boolean;
  showHeaderIcon?: boolean;
  headerTags?: string;
}

const LogHeader: React.FC<LogHeaderProps> = ({ charInfo, color, embedImagesAsBlob, showHeaderIcon, headerTags }) => {
  const [avatarSrc, setAvatarSrc] = useState(charInfo.avatarUrl);

  useEffect(() => {
    const convertAvatar = async () => {
      if (embedImagesAsBlob && charInfo.avatarUrl) {
        try {
            const blobUrl = await imageUrlToBlob(charInfo.avatarUrl);
            setAvatarSrc(blobUrl);
        } catch (e) {
            // ignore if conversion fails
        }
      }
    };
    convertAvatar();
  }, [charInfo.avatarUrl, embedImagesAsBlob]);

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    paddingBottom: '1.5em',
    marginBottom: '2em',
    borderBottom: `2px solid ${color.border}`,
  };

  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <header style={headerStyles}>
      <div style={{textAlign:'center'}}>
        {showHeaderIcon !== false && (
          <img src={avatarSrc} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1em', display: 'block', border: `3px solid ${color.avatarBorder}`, boxShadow: color.shadow }} />
        )}
        <h1 style={{ color: color.nameColor, margin: '0 0 0.25em 0', fontSize: '1.8em', letterSpacing: '1px' }}>{charInfo.name}</h1>
        <p style={{ color: color.text, opacity: 0.8, margin: 0, fontSize: '0.9em' }}>{charInfo.chatName}</p>
        {tags.length > 0 && (
          <div style={{ marginTop: '1em', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {tags.map((tag, index) => (
              <span key={index} style={{ background: color.cardBg, color: color.text, padding: '4px 10px', borderRadius: '12px', fontSize: '0.8em', border: `1px solid ${color.border}` }}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
      
    </header>
  );
};

export default LogHeader;