import React, { useEffect, useState } from 'react';
import type { CharInfo, ColorPalette } from '../../types';
import { imageUrlToBlob } from '../utils/imageUtils';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  embedImagesAsBlob: boolean;
}

const LogHeader: React.FC<LogHeaderProps> = ({ charInfo, color, embedImagesAsBlob }) => {
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

  return (
    <header style={headerStyles}>
      <div style={{textAlign:'center'}}>
        <img src={avatarSrc} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1em', display: 'block', border: `3px solid ${color.avatarBorder}`, boxShadow: color.shadow }} />
      <h1 style={{ color: color.nameColor, margin: '0 0 0.25em 0', fontSize: '1.8em', letterSpacing: '1px' }}>{charInfo.name}</h1>
      <p style={{ color: color.text, opacity: 0.8, margin: 0, fontSize: '0.9em' }}>{charInfo.chatName}</p>
      </div>
      
    </header>
  );
};

export default LogHeader;