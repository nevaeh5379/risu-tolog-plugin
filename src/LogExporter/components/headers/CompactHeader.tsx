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

const CompactHeader: React.FC<LogHeaderProps> = ({ charInfo, color, embedImagesAsBlob, showHeaderIcon, headerTags }) => {
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
    paddingBottom: '1em',
    marginBottom: '1.5em',
    borderBottom: `1px solid ${color.border}`,
  };

  const tags = headerTags ? headerTags.split(',').map(tag => tag.trim()).filter(Boolean) : [];

  return (
    <header style={headerStyles}>
      <div style={{textAlign:'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1em'}}>
        {showHeaderIcon !== false && (
          <img src={avatarSrc} data-log-exporter-avatar="true" style={{ width: '50px', height: '50px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color.avatarBorder}`, boxShadow: color.shadow }} />
        )}
        <div style={{textAlign: 'left'}}>
            <h1 style={{ color: color.nameColor, margin: '0', fontSize: '1.4em' }}>{charInfo.name}</h1>
            <p style={{ color: color.text, opacity: 0.8, margin: '0', fontSize: '0.8em' }}>{charInfo.chatName}</p>
        </div>
      </div>
      {tags.length > 0 && (
        <div style={{ marginTop: '1em', display: 'flex', justifyContent: 'center', gap: '6px', flexWrap: 'wrap' }}>
          {tags.map((tag, index) => (
            <span key={index} style={{ background: color.cardBg, color: color.text, padding: '3px 8px', borderRadius: '10px', fontSize: '0.7em', border: `1px solid ${color.border}` }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </header>
  );
};

export default CompactHeader;
