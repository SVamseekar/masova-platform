import React from 'react';
import { useNavigate } from 'react-router-dom';
import { colors, spacing, typography, shadows, borderRadius } from '../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../styles/neumorphic-utils';
import AppHeader from '../components/common/AppHeader';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Styles
  const containerStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    backgroundColor: colors.surface.background,
    minHeight: '100vh',
    padding: spacing[8],
  };

  const heroSectionStyles: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: spacing[12],
    paddingTop: spacing[16],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['5xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: spacing[4],
    letterSpacing: typography.letterSpacing.tight,
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing[3],
  };

  const versionBadgeStyles: React.CSSProperties = {
    display: 'inline-block',
    padding: `${spacing[2]} ${spacing[4]}`,
    background: `linear-gradient(135deg, ${colors.semantic.success} 0%, ${colors.semantic.successLight} 100%)`,
    color: colors.text.inverse,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    boxShadow: shadows.raised.md,
    marginBottom: spacing[8],
  };

  const featuresGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: spacing[6],
    marginBottom: spacing[12],
  };

  const featureCardStyles: React.CSSProperties = {
    ...createCard('lg', 'lg', true),
    padding: spacing[8],
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  };

  const featureIconStyles: React.CSSProperties = {
    fontSize: typography.fontSize['5xl'],
    marginBottom: spacing[4],
  };

  const featureTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  };

  const featureDescStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
    marginBottom: spacing[4],
  };

  const buttonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    background: `linear-gradient(135deg, ${colors.brand.primary} 0%, ${colors.brand.primaryLight} 100%)`,
    padding: `${spacing[3]} ${spacing[6]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.inverse,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.3s ease',
  };

  const statsContainerStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'lg', '2xl'),
    padding: spacing[8],
    marginBottom: spacing[12],
  };

  const statsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: spacing[6],
  };

  const statBoxStyles: React.CSSProperties = {
    textAlign: 'center',
  };

  const statNumberStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: spacing[2],
  };

  const statLabelStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: typography.letterSpacing.wide,
    fontWeight: typography.fontWeight.semibold,
  };

  const phasesSectionStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'xl'),
    padding: spacing[8],
    marginBottom: spacing[12],
  };

  const phaseTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[6],
    textAlign: 'center',
  };

  const phaseListStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: spacing[4],
  };

  const phaseItemStyles: React.CSSProperties = {
    ...createCard('base', 'base', false),
    padding: spacing[4],
    display: 'flex',
    alignItems: 'flex-start',
    gap: spacing[3],
  };

  const phaseCheckStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    color: colors.semantic.success,
    flexShrink: 0,
  };

  const phaseContentStyles: React.CSSProperties = {
    flex: 1,
  };

  const phaseNameStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[1],
  };

  const phaseDescriptionStyles: React.CSSProperties = {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
  };

  const features = [
    {
      icon: '🍕',
      title: 'Browse Menu',
      description: '65+ delicious items across 8 cuisines. Filter by dietary preferences, search, and add to cart.',
      action: () => navigate('/menu'),
      buttonText: 'Explore Menu'
    },
    {
      icon: '⭐',
      title: 'Loyalty Rewards',
      description: 'Earn 1 point per ₹10 spent. Redeem 100 points for ₹50 discount. Tier benefits up to 2x points!',
      action: () => navigate('/customer-login'),
      buttonText: 'Join Now'
    },
    {
      icon: '👨‍💼',
      title: 'Manager Dashboard',
      description: 'Complete store management with clock in/out, shift scheduling, and employee tracking.',
      action: () => navigate('/login'),
      buttonText: 'Manager Login'
    },
    {
      icon: '👨‍🍳',
      title: 'Kitchen Display',
      description: 'Real-time order queue for kitchen staff with status management.',
      action: () => navigate('/login'),
      buttonText: 'Kitchen Login'
    }
  ];

  const stats = [
    { number: '65+', label: 'Menu Items' },
    { number: '8', label: 'Cuisines' },
    { number: '21', label: 'Categories' },
    { number: '3', label: 'Phases Complete' }
  ];

  const completedPhases = [
    {
      name: 'Phase 1: User Management',
      description: 'Authentication, stores, shifts, employee management with JWT security'
    },
    {
      name: 'Phase 2: Session Tracking',
      description: 'Clock in/out, working hours, session validation, violation detection'
    },
    {
      name: 'Phase 3: Menu Service',
      description: 'Multi-cuisine menu, filtering, dietary options, cart functionality'
    }
  ];

  return (
    <div style={containerStyles}>
      <AppHeader />
      {/* Hero Section */}
      <div style={heroSectionStyles}>
        <h1 style={titleStyles}>MaSoVa Restaurant System</h1>
        <p style={subtitleStyles}>Multi-Cuisine Restaurant Management Platform</p>
        <div style={versionBadgeStyles}>✓ Phase 1, 2, 3 Complete</div>
      </div>

      {/* Stats Section */}
      <div style={statsContainerStyles}>
        <div style={statsGridStyles}>
          {stats.map((stat, index) => (
            <div key={index} style={statBoxStyles}>
              <div style={statNumberStyles}>{stat.number}</div>
              <div style={statLabelStyles}>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div style={featuresGridStyles}>
        {features.map((feature, index) => (
          <div
            key={index}
            style={featureCardStyles}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = shadows.raised.xl;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = shadows.raised.lg;
            }}
          >
            <div style={featureIconStyles}>{feature.icon}</div>
            <h3 style={featureTitleStyles}>{feature.title}</h3>
            <p style={featureDescStyles}>{feature.description}</p>
            <button
              style={buttonStyles}
              onClick={feature.action}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = shadows.raised.lg;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = shadows.raised.base;
              }}
            >
              {feature.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Loyalty Program Section */}
      <div style={{
        ...createNeumorphicSurface('raised', 'lg', '2xl'),
        padding: spacing[8],
        marginBottom: spacing[12],
        background: `linear-gradient(135deg, ${colors.brand.primary}11, ${colors.brand.secondary}11)`,
      }}>
        <h2 style={{
          fontSize: typography.fontSize['3xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing[2],
          textAlign: 'center',
        }}>
          ⭐ MaSoVa Loyalty Rewards Program
        </h2>
        <p style={{
          fontSize: typography.fontSize.base,
          color: colors.text.secondary,
          marginBottom: spacing[8],
          textAlign: 'center',
          maxWidth: '800px',
          margin: `0 auto ${spacing[8]} auto`,
        }}>
          Earn points on every order and redeem them for real discounts. The more you order, the more you save!
        </p>

        {/* Earn & Redeem Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: spacing[6],
          marginBottom: spacing[8],
        }}>
          {/* How to Earn */}
          <div style={{
            ...createCard('md', 'lg', false),
            padding: spacing[6],
            textAlign: 'center',
            background: colors.surface.primary,
          }}>
            <div style={{ fontSize: '60px', marginBottom: spacing[3] }}>💰</div>
            <h3 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.brand.primary,
              marginBottom: spacing[3],
            }}>
              How to Earn Points
            </h3>
            <div style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}>
              1 Point per ₹10
            </div>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
              Spend on food, earn valuable points
            </p>
            <div style={{
              background: colors.surface.secondary,
              padding: spacing[3],
              borderRadius: borderRadius.base,
              marginBottom: spacing[3],
            }}>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                Example:
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                Order ₹500 = <strong>50 points</strong>
              </div>
            </div>
            <div style={{
              background: colors.semantic.successLight + '22',
              padding: spacing[2],
              borderRadius: borderRadius.base,
              fontSize: typography.fontSize.xs,
              color: colors.semantic.successDark,
              fontWeight: typography.fontWeight.semibold,
            }}>
              ✓ Signup Bonus: 100 points
            </div>
          </div>

          {/* How to Redeem */}
          <div style={{
            ...createCard('md', 'lg', false),
            padding: spacing[6],
            textAlign: 'center',
            background: colors.surface.primary,
          }}>
            <div style={{ fontSize: '60px', marginBottom: spacing[3] }}>🎁</div>
            <h3 style={{
              fontSize: typography.fontSize.xl,
              fontWeight: typography.fontWeight.bold,
              color: colors.brand.primary,
              marginBottom: spacing[3],
            }}>
              How to Redeem
            </h3>
            <div style={{
              fontSize: typography.fontSize['2xl'],
              fontWeight: typography.fontWeight.extrabold,
              color: colors.text.primary,
              marginBottom: spacing[2],
            }}>
              100 Points = ₹50
            </div>
            <p style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary, marginBottom: spacing[4] }}>
              Use points at checkout for instant savings
            </p>
            <div style={{
              background: colors.surface.secondary,
              padding: spacing[3],
              borderRadius: borderRadius.base,
              marginBottom: spacing[3],
            }}>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.tertiary, marginBottom: spacing[1] }}>
                Example:
              </div>
              <div style={{ fontSize: typography.fontSize.sm, color: colors.text.primary }}>
                200 points = <strong>₹100 off</strong>
              </div>
            </div>
            <div style={{
              background: colors.semantic.warningLight + '22',
              padding: spacing[2],
              borderRadius: borderRadius.base,
              fontSize: typography.fontSize.xs,
              color: colors.semantic.warningDark,
              fontWeight: typography.fontWeight.semibold,
            }}>
              ⚠ Min: 100 pts | Max: 50% of order
            </div>
          </div>
        </div>

        {/* Tier Benefits */}
        <h3 style={{
          fontSize: typography.fontSize['2xl'],
          fontWeight: typography.fontWeight.bold,
          color: colors.text.primary,
          marginBottom: spacing[6],
          textAlign: 'center',
        }}>
          🏆 Membership Tiers & Benefits
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: spacing[4],
        }}>
          {[
            { tier: 'BRONZE', icon: '🥉', points: '0-999', multiplier: '1x', color: '#cd7f32' },
            { tier: 'SILVER', icon: '🥈', points: '1,000+', multiplier: '1.25x', color: '#c0c0c0' },
            { tier: 'GOLD', icon: '🥇', points: '5,000+', multiplier: '1.5x', color: '#ffd700' },
            { tier: 'PLATINUM', icon: '💎', points: '10,000+', multiplier: '2x', color: '#e5e4e2' },
          ].map((tier, index) => (
            <div key={index} style={{
              ...createCard('sm', 'base', false),
              padding: spacing[4],
              textAlign: 'center',
              background: colors.surface.primary,
              borderTop: `4px solid ${tier.color}`,
            }}>
              <div style={{ fontSize: '40px', marginBottom: spacing[2] }}>{tier.icon}</div>
              <div style={{
                fontSize: typography.fontSize.lg,
                fontWeight: typography.fontWeight.bold,
                color: colors.text.primary,
                marginBottom: spacing[1],
              }}>
                {tier.tier}
              </div>
              <div style={{
                fontSize: typography.fontSize.xs,
                color: colors.text.tertiary,
                marginBottom: spacing[2],
              }}>
                {tier.points} points
              </div>
              <div style={{
                background: colors.brand.primary + '22',
                color: colors.brand.primary,
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: borderRadius.full,
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.bold,
              }}>
                {tier.multiplier} Points
              </div>
            </div>
          ))}
        </div>

        {/* Example Calculations */}
        <div style={{
          marginTop: spacing[8],
          padding: spacing[6],
          background: colors.surface.secondary,
          borderRadius: borderRadius.xl,
          border: `2px solid ${colors.brand.primary}33`,
        }}>
          <h4 style={{
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text.primary,
            marginBottom: spacing[4],
            textAlign: 'center',
          }}>
            📊 Real Examples
          </h4>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: spacing[4],
          }}>
            <div style={{ padding: spacing[3], background: colors.surface.primary, borderRadius: borderRadius.base }}>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing[2] }}>
                Bronze Member Orders ₹1,000
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                Base: ₹1,000 ÷ 10 = 100 pts<br/>
                Multiplier: 100 × 1x = <strong style={{ color: colors.brand.primary }}>100 points</strong>
              </div>
            </div>
            <div style={{ padding: spacing[3], background: colors.surface.primary, borderRadius: borderRadius.base }}>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing[2] }}>
                Gold Member Orders ₹1,000
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                Base: ₹1,000 ÷ 10 = 100 pts<br/>
                Multiplier: 100 × 1.5x = <strong style={{ color: colors.brand.primary }}>150 points</strong>
              </div>
            </div>
            <div style={{ padding: spacing[3], background: colors.surface.primary, borderRadius: borderRadius.base }}>
              <div style={{ fontSize: typography.fontSize.sm, fontWeight: typography.fontWeight.semibold, color: colors.text.primary, marginBottom: spacing[2] }}>
                Redeem 500 Points
              </div>
              <div style={{ fontSize: typography.fontSize.xs, color: colors.text.secondary }}>
                500 ÷ 100 = 5 units<br/>
                5 × ₹50 = <strong style={{ color: colors.semantic.success }}>₹250 discount</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Completed Phases Section */}
      <div style={phasesSectionStyles}>
        <h2 style={phaseTitleStyles}>Completed Development Phases</h2>
        <div style={phaseListStyles}>
          {completedPhases.map((phase, index) => (
            <div key={index} style={phaseItemStyles}>
              <span style={phaseCheckStyles}>✓</span>
              <div style={phaseContentStyles}>
                <div style={phaseNameStyles}>{phase.name}</div>
                <div style={phaseDescriptionStyles}>{phase.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tech Stack Footer */}
      <div style={{ textAlign: 'center', marginTop: spacing[12] }}>
        <p style={{
          fontSize: typography.fontSize.sm,
          color: colors.text.tertiary,
          marginBottom: spacing[2],
        }}>
          Built with Java 21, Spring Boot, MongoDB, Redis, React 18, TypeScript, Redux Toolkit
        </p>
        <p style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.tertiary,
        }}>
          Microservices Architecture | Neumorphic Design | Full-Stack Integration
        </p>
      </div>
    </div>
  );
};

export default HomePage;
