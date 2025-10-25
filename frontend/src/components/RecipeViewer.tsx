import React from 'react';
import { colors, spacing, typography, shadows, borderRadius } from '../styles/design-tokens';
import { createNeumorphicSurface, createCard } from '../styles/neumorphic-utils';
import { MenuItem } from '../store/api/menuApi';

interface RecipeViewerProps {
  menuItem: MenuItem;
  onClose: () => void;
}

const RecipeViewer: React.FC<RecipeViewerProps> = ({ menuItem, onClose }) => {
  const hasRecipe = menuItem.preparationInstructions && menuItem.preparationInstructions.length > 0;
  const hasIngredients = menuItem.ingredients && menuItem.ingredients.length > 0;

  // Styles
  const overlayStyles: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: spacing[4],
    fontFamily: typography.fontFamily.primary,
  };

  const modalStyles: React.CSSProperties = {
    ...createCard('lg', 'base'),
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    position: 'relative',
  };

  const headerStyles: React.CSSProperties = {
    borderBottom: `2px solid ${colors.surface.tertiary}`,
    paddingBottom: spacing[4],
    marginBottom: spacing[6],
    position: 'sticky',
    top: 0,
    backgroundColor: colors.surface.primary,
    zIndex: 1,
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['3xl'],
    fontWeight: typography.fontWeight.extrabold,
    color: colors.text.primary,
    marginBottom: spacing[2],
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const closeButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: 'none',
    cursor: 'pointer',
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.secondary,
    backgroundColor: colors.surface.primary,
    transition: 'all 0.2s ease',
  };

  const sectionStyles: React.CSSProperties = {
    marginBottom: spacing[8],
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const metaInfoStyles: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: spacing[4],
    marginBottom: spacing[4],
  };

  const metaItemStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.semibold,
  };

  const ingredientsGridStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: spacing[3],
    marginBottom: spacing[6],
  };

  const ingredientItemStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    display: 'flex',
    alignItems: 'center',
    gap: spacing[2],
  };

  const instructionsListStyles: React.CSSProperties = {
    listStyle: 'none',
    padding: 0,
    margin: 0,
  };

  const instructionItemStyles: React.CSSProperties = {
    ...createCard('base', 'sm'),
    marginBottom: spacing[4],
    display: 'flex',
    gap: spacing[4],
    alignItems: 'flex-start',
  };

  const stepNumberStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'full'),
    width: '48px',
    height: '48px',
    minWidth: '48px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    color: colors.text.inverse,
  };

  const stepTextStyles: React.CSSProperties = {
    flex: 1,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.relaxed,
    color: colors.text.primary,
    paddingTop: spacing[2],
  };

  const noDataStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'md', 'lg'),
    padding: spacing[6],
    textAlign: 'center',
    fontSize: typography.fontSize.lg,
    color: colors.text.tertiary,
    fontStyle: 'italic',
  };

  return (
    <div style={overlayStyles} onClick={onClose}>
      <div style={modalStyles} onClick={(e) => e.stopPropagation()}>
        <div style={headerStyles}>
          <h2 style={titleStyles}>{menuItem.name}</h2>
          {menuItem.description && (
            <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary, margin: 0 }}>
              {menuItem.description}
            </p>
          )}
          <button
            style={closeButtonStyles}
            onClick={onClose}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.1)';
              e.currentTarget.style.color = colors.semantic.error;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.color = colors.text.secondary;
            }}
          >
            ×
          </button>
        </div>

        {/* Meta Information */}
        <div style={metaInfoStyles}>
          {menuItem.preparationTime && (
            <div style={metaItemStyles}>
              ⏱️ Prep Time: {menuItem.preparationTime} minutes
            </div>
          )}
          {menuItem.servingSize && (
            <div style={metaItemStyles}>
              🍽️ Serves: {menuItem.servingSize}
            </div>
          )}
          {menuItem.spiceLevel && menuItem.spiceLevel !== 'NONE' && (
            <div style={metaItemStyles}>
              🌶️ Spice: {menuItem.spiceLevel}
            </div>
          )}
        </div>

        {/* Ingredients Section */}
        <div style={sectionStyles}>
          <h3 style={sectionTitleStyles}>
            <span>🥘</span> Ingredients
          </h3>
          {hasIngredients ? (
            <div style={ingredientsGridStyles}>
              {menuItem.ingredients!.map((ingredient, index) => (
                <div key={index} style={ingredientItemStyles}>
                  <span style={{ color: colors.brand.primary, fontSize: typography.fontSize.lg }}>•</span>
                  {ingredient}
                </div>
              ))}
            </div>
          ) : (
            <div style={noDataStyles}>
              No ingredients information available
            </div>
          )}
        </div>

        {/* Preparation Instructions Section */}
        <div style={sectionStyles}>
          <h3 style={sectionTitleStyles}>
            <span>👨‍🍳</span> Preparation Instructions
          </h3>
          {hasRecipe ? (
            <ol style={instructionsListStyles}>
              {menuItem.preparationInstructions!.map((instruction, index) => (
                <li key={index} style={instructionItemStyles}>
                  <div style={stepNumberStyles}>{index + 1}</div>
                  <div style={stepTextStyles}>{instruction}</div>
                </li>
              ))}
            </ol>
          ) : (
            <div style={noDataStyles}>
              No preparation instructions available for this dish yet
            </div>
          )}
        </div>

        {/* Allergens Warning */}
        {menuItem.allergens && menuItem.allergens.length > 0 && (
          <div style={{
            ...createNeumorphicSurface('inset', 'md', 'lg'),
            padding: spacing[4],
            backgroundColor: colors.semantic.warningLight + '20',
            borderLeft: `4px solid ${colors.semantic.warning}`,
          }}>
            <h4 style={{
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.semantic.warning,
              marginBottom: spacing[2],
            }}>
              ⚠️ Allergen Information
            </h4>
            <p style={{
              fontSize: typography.fontSize.base,
              color: colors.text.primary,
              margin: 0,
            }}>
              Contains: {menuItem.allergens.join(', ')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeViewer;
