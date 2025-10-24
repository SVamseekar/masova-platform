import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './components/HeroSection';
import PromotionCard from './components/PromotionCard';
import AppHeader from '../../components/common/AppHeader';
import CartDrawer from '../../components/cart/CartDrawer';
import AnimatedBackground from '../../components/backgrounds/AnimatedBackground';
import { Button, Card } from '../../components/ui/neumorphic';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface } from '../../styles/neumorphic-utils';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const handleOpenCart = () => {
    setCartDrawerOpen(true);
  };

  const handleCloseCart = () => {
    setCartDrawerOpen(false);
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  // Featured promotions (top 3 for homepage)
  const featuredPromotions = [
    {
      id: 1,
      title: 'Weekend Special',
      description: 'Get 20% OFF on all pizzas this weekend!',
      discount: '20% OFF',
      validUntil: 'Valid till Sunday',
      image: '/images/pizza-promo.jpg',
      category: 'Pizza'
    },
    {
      id: 2,
      title: 'Family Combo',
      description: '2 Large Pizzas + 2 Breads + 2 Drinks at ₹999',
      discount: 'Save ₹300',
      validUntil: 'Limited time offer',
      image: '/images/combo-promo.jpg',
      category: 'Combo'
    },
    {
      id: 3,
      title: 'Free Delivery',
      description: 'Free delivery on orders above ₹500',
      discount: 'Free Delivery',
      validUntil: 'All week',
      image: '/images/delivery-promo.jpg',
      category: 'Delivery'
    }
  ];

  // Why choose us features
  const features = [
    {
      icon: '🍽️',
      title: 'Multi-Cuisine Menu',
      description: 'Pizzas, Biryani, Chinese, and more - something for everyone'
    },
    {
      icon: '🚀',
      title: 'Fast Delivery',
      description: 'Hot food delivered to your doorstep in 30 minutes or less'
    },
    {
      icon: '🎁',
      title: 'Great Offers',
      description: 'Weekly deals and combo offers to save you money'
    },
    {
      icon: '🏪',
      title: 'Dine-In & Takeaway',
      description: 'Multiple ordering options - choose what works for you'
    }
  ];

  // Styles
  const containerStyles: React.CSSProperties = {
    position: 'relative',
    minHeight: '100vh',
    fontFamily: typography.fontFamily.primary,
    zIndex: 1,
  };

  const sectionStyles: React.CSSProperties = {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `${spacing[8]} ${spacing[6]}`,
  };

  const sectionHeaderStyles: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
    flexWrap: 'wrap',
    gap: spacing[4],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[2],
  };

  const subtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.lg,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  };

  const promotionsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: spacing[6],
  };

  const featuresGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing[6],
    marginTop: spacing[8],
  };

  const featureCardContentStyles: React.CSSProperties = {
    textAlign: 'center',
    padding: spacing[6],
  };

  const featureIconStyles: React.CSSProperties = {
    fontSize: '60px',
    marginBottom: spacing[4],
  };

  const featureTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[3],
  };

  const featureDescriptionStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
  };

  const ctaSectionStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'lg', '2xl'),
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    padding: spacing[10],
    textAlign: 'center',
    color: colors.text.inverse,
  };

  const ctaTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    marginBottom: spacing[4],
  };

  const ctaSubtitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing[6],
    opacity: 0.95,
  };

  const ctaButtonContainerStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[4],
    justifyContent: 'center',
    flexWrap: 'wrap',
  };

  const footerStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'none'),
    padding: `${spacing[8]} ${spacing[6]}`,
    marginTop: spacing[10],
  };

  const footerGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: spacing[8],
    maxWidth: '1200px',
    margin: '0 auto',
  };

  const footerTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const footerTextStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.relaxed,
    marginBottom: spacing[2],
  };

  const footerLinkStyles: React.CSSProperties = {
    fontSize: typography.fontSize.base,
    color: colors.brand.primary,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    textAlign: 'left',
    marginBottom: spacing[2],
    fontFamily: typography.fontFamily.primary,
    transition: 'color 0.2s ease',
  };

  const footerBottomStyles: React.CSSProperties = {
    textAlign: 'center',
    marginTop: spacing[8],
    paddingTop: spacing[6],
    borderTop: `2px solid ${colors.surface.tertiary}`,
    color: colors.text.tertiary,
    fontSize: typography.fontSize.sm,
  };

  return (
    <>
      {/* Animated Background */}
      <AnimatedBackground variant="default" />

      <div style={containerStyles}>
        {/* Navigation Header */}
        <div style={{ padding: spacing[6] }}>
          <AppHeader
            hideStaffLogin={true}
            showPublicNav={true}
            onCartClick={handleOpenCart}
          />
        </div>

      {/* Hero Section */}
      <HeroSection
        onOrderNow={() => navigate('/menu')}
        onBrowseMenu={() => navigate('/menu')}
      />

      {/* Featured Promotions Section */}
      <div style={sectionStyles}>
        <div style={sectionHeaderStyles}>
          <div>
            <h2 style={titleStyles}>Today's Special Offers</h2>
            <p style={subtitleStyles}>Don't miss out on our amazing deals!</p>
          </div>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/promotions')}
          >
            View All Offers
          </Button>
        </div>

        <div style={promotionsGridStyles}>
          {featuredPromotions.map((promo) => (
            <PromotionCard
              key={promo.id}
              promotion={promo}
              onOrderNow={() => navigate('/menu')}
            />
          ))}
        </div>
      </div>

      {/* Why Choose Us Section */}
      <div style={sectionStyles}>
        <div style={{ textAlign: 'center', marginBottom: spacing[8] }}>
          <h2 style={titleStyles}>Why Choose MaSoVa?</h2>
          <p style={subtitleStyles}>We're committed to serving you the best food experience</p>
        </div>

        <div style={featuresGridStyles}>
          {features.map((feature, index) => (
            <Card key={index} elevation="md" padding="lg" interactive>
              <div style={featureCardContentStyles}>
                <div style={featureIconStyles}>{feature.icon}</div>
                <h3 style={featureTitleStyles}>{feature.title}</h3>
                <p style={featureDescriptionStyles}>{feature.description}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Call to Action Section */}
      <div style={sectionStyles}>
        <div style={ctaSectionStyles}>
          <h2 style={ctaTitleStyles}>Hungry? Let's Order!</h2>
          <p style={ctaSubtitleStyles}>
            Browse our menu and get your favorite food delivered in minutes
          </p>
          <div style={ctaButtonContainerStyles}>
            <Button
              variant="primary"
              size="xl"
              onClick={() => navigate('/menu')}
              style={{
                minWidth: '200px',
                boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.25)',
              }}
            >
              Order Now
            </Button>
            <Button
              variant="ghost"
              size="xl"
              onClick={() => navigate('/menu')}
              style={{
                minWidth: '200px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: colors.text.inverse,
                backdropFilter: 'blur(10px)',
                boxShadow: '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              Browse Menu
            </Button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={footerStyles}>
        <div style={footerGridStyles}>
          <div>
            <h3 style={footerTitleStyles}>MaSoVa Restaurant</h3>
            <p style={footerTextStyles}>
              Your favorite multi-cuisine restaurant serving delicious food since 2020
            </p>
          </div>
          <div>
            <h3 style={footerTitleStyles}>Quick Links</h3>
            <button style={footerLinkStyles} onClick={() => navigate('/menu')}>
              Browse Menu
            </button>
            <br />
            <button style={footerLinkStyles} onClick={() => navigate('/promotions')}>
              Promotions
            </button>
            <br />
            <button style={footerLinkStyles} onClick={() => navigate('/login')}>
              Staff Login
            </button>
          </div>
          <div>
            <h3 style={footerTitleStyles}>Contact</h3>
            <p style={footerTextStyles}>Phone: +91 9876543210</p>
            <p style={footerTextStyles}>Email: info@masova.com</p>
            <p style={footerTextStyles}>Address: Hyderabad, India</p>
          </div>
        </div>
        <div style={footerBottomStyles}>
          © 2025 MaSoVa Restaurant Management System. All rights reserved.
        </div>
      </footer>

        {/* Cart Drawer */}
        <CartDrawer open={cartDrawerOpen} onClose={handleCloseCart} onCheckout={handleCheckout} />
      </div>
    </>
  );
};

export default HomePage;
