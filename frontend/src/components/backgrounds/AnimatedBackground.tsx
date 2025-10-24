import React from 'react';
import { colors } from '../../styles/design-tokens';

interface AnimatedBackgroundProps {
  variant?: 'default' | 'hero' | 'minimal';
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ variant = 'default' }) => {
  const containerStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
    pointerEvents: 'none',
    overflow: 'hidden',
  };

  const baseGradientStyles: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(180deg, #f0f0f3 0%, #e4e4e8 50%, #f0f0f3 100%)',
  };

  // Ambient light glows
  const ambientLight1Styles: React.CSSProperties = {
    position: 'absolute',
    top: '-10%',
    left: '-5%',
    width: '50%',
    height: '50%',
    background: `radial-gradient(circle, ${colors.brand.secondary}15 0%, transparent 70%)`,
    animation: 'ambientFloat1 12s ease-in-out infinite',
    filter: 'blur(60px)',
  };

  const ambientLight2Styles: React.CSSProperties = {
    position: 'absolute',
    bottom: '-10%',
    right: '-5%',
    width: '60%',
    height: '60%',
    background: `radial-gradient(circle, ${colors.brand.primary}12 0%, transparent 70%)`,
    animation: 'ambientFloat2 15s ease-in-out infinite',
    filter: 'blur(70px)',
  };

  const ambientLight3Styles: React.CSSProperties = {
    position: 'absolute',
    top: '40%',
    left: '50%',
    width: '40%',
    height: '40%',
    background: `radial-gradient(circle, ${colors.brand.primaryLight}10 0%, transparent 70%)`,
    animation: 'ambientFloat3 18s ease-in-out infinite',
    filter: 'blur(80px)',
  };

  // Organic blob shapes
  const blob1Styles: React.CSSProperties = {
    position: 'absolute',
    top: '15%',
    right: '10%',
    width: '300px',
    height: '300px',
    background: colors.surface.primary,
    borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
    boxShadow: `
      -8px -8px 16px rgba(255, 255, 255, 0.8),
      8px 8px 16px rgba(174, 174, 192, 0.4)
    `,
    opacity: 0.4,
    animation: 'blobFloat1 10s ease-in-out infinite',
  };

  const blob2Styles: React.CSSProperties = {
    position: 'absolute',
    bottom: '20%',
    left: '8%',
    width: '250px',
    height: '250px',
    background: colors.surface.primary,
    borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
    boxShadow: `
      -6px -6px 12px rgba(255, 255, 255, 0.7),
      6px 6px 12px rgba(174, 174, 192, 0.35)
    `,
    opacity: 0.35,
    animation: 'blobFloat2 12s ease-in-out infinite',
  };

  const blob3Styles: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    left: '15%',
    width: '200px',
    height: '200px',
    background: colors.surface.primary,
    borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%',
    boxShadow: `
      -5px -5px 10px rgba(255, 255, 255, 0.6),
      5px 5px 10px rgba(174, 174, 192, 0.3)
    `,
    opacity: 0.3,
    animation: 'blobFloat3 14s ease-in-out infinite',
  };

  const blob4Styles: React.CSSProperties = {
    position: 'absolute',
    top: '25%',
    right: '25%',
    width: '180px',
    height: '180px',
    background: colors.surface.primary,
    borderRadius: '50% 50% 30% 70% / 50% 50% 70% 30%',
    boxShadow: `
      -4px -4px 8px rgba(255, 255, 255, 0.5),
      4px 4px 8px rgba(174, 174, 192, 0.25)
    `,
    opacity: 0.25,
    animation: 'blobFloat4 11s ease-in-out infinite',
  };

  // Food emojis floating
  const floatingEmojiStyles = (top: string, left: string, size: string, delay: string): React.CSSProperties => ({
    position: 'absolute',
    top,
    left,
    fontSize: size,
    opacity: 0.08,
    animation: `emojiFloat 8s ease-in-out ${delay} infinite`,
  });

  return (
    <>
      <div style={containerStyles}>
        {/* Base gradient */}
        <div style={baseGradientStyles} />

        {/* Ambient light glows */}
        <div style={ambientLight1Styles} />
        <div style={ambientLight2Styles} />
        <div style={ambientLight3Styles} />

        {/* Organic blobs */}
        {variant !== 'minimal' && (
          <>
            <div style={blob1Styles} />
            <div style={blob2Styles} />
            <div style={blob3Styles} />
            <div style={blob4Styles} />
          </>
        )}

        {/* Floating food emojis */}
        {variant === 'default' && (
          <>
            <div style={floatingEmojiStyles('12%', '5%', '80px', '0s')}>🍕</div>
            <div style={floatingEmojiStyles('60%', '85%', '70px', '2s')}>🍔</div>
            <div style={floatingEmojiStyles('35%', '90%', '60px', '1s')}>🍜</div>
            <div style={floatingEmojiStyles('75%', '15%', '65px', '3s')}>🍰</div>
            <div style={floatingEmojiStyles('45%', '8%', '55px', '1.5s')}>🥗</div>
            <div style={floatingEmojiStyles('20%', '75%', '75px', '2.5s')}>🍱</div>
          </>
        )}

        {variant === 'hero' && (
          <>
            <div style={floatingEmojiStyles('15%', '10%', '90px', '0s')}>🍕</div>
            <div style={floatingEmojiStyles('70%', '80%', '85px', '1s')}>🍔</div>
            <div style={floatingEmojiStyles('40%', '85%', '75px', '2s')}>🍜</div>
            <div style={floatingEmojiStyles('65%', '12%', '80px', '1.5s')}>🍰</div>
          </>
        )}
      </div>

      {/* CSS Animations */}
      <style>
        {`
          @keyframes ambientFloat1 {
            0%, 100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.15;
            }
            33% {
              transform: translate(30px, -40px) scale(1.1);
              opacity: 0.2;
            }
            66% {
              transform: translate(-20px, 30px) scale(0.95);
              opacity: 0.12;
            }
          }

          @keyframes ambientFloat2 {
            0%, 100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.12;
            }
            33% {
              transform: translate(-40px, 30px) scale(1.05);
              opacity: 0.18;
            }
            66% {
              transform: translate(25px, -35px) scale(0.98);
              opacity: 0.1;
            }
          }

          @keyframes ambientFloat3 {
            0%, 100% {
              transform: translate(0, 0) scale(1);
              opacity: 0.1;
            }
            50% {
              transform: translate(20px, 20px) scale(1.08);
              opacity: 0.15;
            }
          }

          @keyframes blobFloat1 {
            0%, 100% {
              transform: translate(0, 0) rotate(0deg);
              border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%;
            }
            25% {
              transform: translate(30px, -40px) rotate(5deg);
              border-radius: 50% 50% 60% 40% / 50% 60% 40% 50%;
            }
            50% {
              transform: translate(-20px, -60px) rotate(-3deg);
              border-radius: 60% 40% 50% 50% / 40% 60% 50% 50%;
            }
            75% {
              transform: translate(40px, -30px) rotate(4deg);
              border-radius: 45% 55% 65% 35% / 55% 45% 55% 45%;
            }
          }

          @keyframes blobFloat2 {
            0%, 100% {
              transform: translate(0, 0) rotate(0deg);
              border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            }
            33% {
              transform: translate(-40px, 30px) rotate(-5deg);
              border-radius: 50% 50% 40% 60% / 50% 40% 60% 50%;
            }
            66% {
              transform: translate(25px, 50px) rotate(6deg);
              border-radius: 40% 60% 50% 50% / 60% 50% 50% 40%;
            }
          }

          @keyframes blobFloat3 {
            0%, 100% {
              transform: translate(0, 0) rotate(0deg);
              border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
            }
            50% {
              transform: translate(35px, 45px) rotate(-8deg);
              border-radius: 70% 30% 30% 70% / 70% 70% 30% 30%;
            }
          }

          @keyframes blobFloat4 {
            0%, 100% {
              transform: translate(0, 0) rotate(0deg);
              border-radius: 50% 50% 30% 70% / 50% 50% 70% 30%;
            }
            40% {
              transform: translate(-30px, -35px) rotate(7deg);
              border-radius: 60% 40% 60% 40% / 40% 60% 40% 60%;
            }
            80% {
              transform: translate(20px, 25px) rotate(-5deg);
              border-radius: 40% 60% 40% 60% / 60% 40% 60% 40%;
            }
          }

          @keyframes emojiFloat {
            0%, 100% {
              transform: translateY(0px) rotate(0deg);
            }
            25% {
              transform: translateY(-30px) rotate(5deg);
            }
            50% {
              transform: translateY(-50px) rotate(-3deg);
            }
            75% {
              transform: translateY(-25px) rotate(4deg);
            }
          }
        `}
      </style>
    </>
  );
};

export default AnimatedBackground;
