
import React, { useEffect, useState } from 'react';
import type { CharInfo, ColorPalette } from '../../types';
import { imageUrlToBlob, imageUrlToBase64 } from '../utils/imageUtils';

interface LogHeaderProps {
  charInfo: CharInfo;
  color: ColorPalette;
  embedImagesAsBase64: boolean;
}

const LogHeader: React.FC<LogHeaderProps> = ({ charInfo, color, embedImagesAsBase64 }) => {
  const [avatarSrc, setAvatarSrc] = useState(charInfo.avatarUrl);

  useEffect(() => {
    const convertAvatar = async () => {
      if (!embedImagesAsBase64) {
        setAvatarSrc(await imageUrlToBlob(charInfo.avatarUrl));
      } else if (embedImagesAsBase64) {
        setAvatarSrc(await imageUrlToBase64(charInfo.avatarUrl));
      }
    };
    convertAvatar();
  }, [charInfo.avatarUrl, embedImagesAsBase64]);

  const headerStyles: React.CSSProperties = {
    textAlign: 'center',
    paddingBottom: '1.5em',
    marginBottom: '2em',
    borderBottom: `2px solid ${color.border}`,
  };

  return (
    <header style={headerStyles}>
      <img src={avatarSrc} style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover', margin: '0 auto 1em', display: 'block', border: `3px solid ${color.avatarBorder}`, boxShadow: color.shadow }} />
      <h1 style={{ color: color.nameColor, margin: '0 0 0.25em 0', fontSize: '1.8em', letterSpacing: '1px' }}>{charInfo.name}</h1>
      <p style={{ color: color.text, opacity: 0.8, margin: 0, fontSize: '0.9em' }}>{charInfo.chatName}</p>
    </header>
  );
};

export default LogHeader;
