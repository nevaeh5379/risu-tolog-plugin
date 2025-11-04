
import React from 'react';
import { AVATAR_ATTR } from './constants';

interface AvatarProps {
  avatarSrc?: string;
  name: string;
  isUser: boolean;
  isForArca: boolean;
  showAvatar: boolean;
  baseStyle: React.CSSProperties;
  marginStyle: React.CSSProperties;
}

const Avatar: React.FC<AvatarProps> = ({ avatarSrc, name, isUser, isForArca, showAvatar, baseStyle, marginStyle }) => {
  if (!showAvatar) return null;

  const fullStyle = { ...baseStyle, ...marginStyle };

  if (isForArca) {
    return <img {...{ [AVATAR_ATTR]: '' }} data-user={isUser} style={fullStyle} src={avatarSrc} />;
  }

  if (avatarSrc) {
    return <div {...{ [AVATAR_ATTR]: '' }} style={{ ...fullStyle, backgroundImage: `url('${avatarSrc}')`, backgroundSize: 'cover', backgroundPosition: 'center' }} />;
  } else {
    const letter = isUser ? 'U' : name.charAt(0).toUpperCase();
    return (
      <div {...{ [AVATAR_ATTR]: '' }} style={{ ...fullStyle, backgroundColor: '#ccc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '1.2em' }}>{letter}</span>
      </div>
    );
  }
};

export default Avatar;
