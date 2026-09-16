import React, { useMemo } from 'react';
import { MenuItem } from '../store/api/menuApi';
import { recipeDefaultsFor } from '../pages/manager/recipeCatalog';
import { kds } from '../pages/kitchen/kdsTokens';

interface RecipeViewerProps {
  menuItem: MenuItem;
  onClose: () => void;
}

const RecipeViewer: React.FC<RecipeViewerProps> = ({ menuItem, onClose }) => {
  const fallback = useMemo(() => recipeDefaultsFor(menuItem.name), [menuItem.name]);
  const ingredients = (menuItem.ingredients && menuItem.ingredients.length > 0)
    ? menuItem.ingredients
    : (fallback?.ingredients || []);
  const steps = (menuItem.preparationInstructions && menuItem.preparationInstructions.length > 0)
    ? menuItem.preparationInstructions
    : (fallback?.steps || []);

  return (
    <div
      style={overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        style={modal}
        role="dialog"
        aria-labelledby="kds-recipe-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" onClick={onClose} style={closeBtn} aria-label="Close recipe">×</button>
        <h2 id="kds-recipe-title" style={title}>{menuItem.name}</h2>
        {menuItem.description && <p style={desc}>{menuItem.description}</p>}

        <div style={metaRow}>
          {menuItem.preparationTime != null && (
            <span style={chip}>{menuItem.preparationTime} min prep</span>
          )}
          {menuItem.spiceLevel && <span style={chip}>{String(menuItem.spiceLevel).toLowerCase()}</span>}
        </div>

        <h3 style={h3}>Ingredients</h3>
        {ingredients.length === 0 ? (
          <p style={empty}>No recipe on file for this item.</p>
        ) : (
          <ul style={list}>
            {ingredients.map((ing, i) => (
              <li key={i} style={li}>{ing}</li>
            ))}
          </ul>
        )}

        <h3 style={h3}>Method</h3>
        {steps.length === 0 ? (
          <p style={empty}>No method on file.</p>
        ) : (
          <ol style={list}>
            {steps.map((step, i) => (
              <li key={i} style={{ ...li, display: 'flex', gap: 10 }}>
                <span style={num}>{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
};

const overlay: React.CSSProperties = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20,
};
const modal: React.CSSProperties = {
  background: kds.surfaceElevated, color: kds.ink, borderRadius: 10,
  maxWidth: 560, width: '100%', maxHeight: '86vh', overflow: 'auto',
  padding: '28px 28px 32px', border: `1px solid ${kds.roleBorder}`,
  fontFamily: kds.font, position: 'relative',
};
const closeBtn: React.CSSProperties = {
  position: 'absolute', top: 14, right: 14, width: 36, height: 36,
  border: `1px solid ${kds.faint}`, background: 'transparent', color: kds.ink,
  borderRadius: 8, cursor: 'pointer', fontSize: 20,
};
const title: React.CSSProperties = { margin: '0 40px 8px 0', fontSize: 22, fontWeight: 700, color: kds.ink };
const desc: React.CSSProperties = { margin: '0 0 16px', fontSize: 13, color: kds.muted, lineHeight: 1.45 };
const metaRow: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 };
const chip: React.CSSProperties = {
  fontSize: 12, color: kds.ink, border: `1px solid ${kds.faint}`, borderRadius: 6, padding: '4px 10px',
};
const h3: React.CSSProperties = { margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: kds.muted };
const list: React.CSSProperties = { margin: '0 0 20px', padding: 0, listStyle: 'none' };
const li: React.CSSProperties = {
  fontSize: 14, lineHeight: 1.45, color: kds.ink, padding: '8px 0',
  borderBottom: '1px solid rgba(255,255,255,0.06)',
};
const num: React.CSSProperties = {
  flexShrink: 0, width: 22, height: 22, borderRadius: 11, background: kds.role, color: '#fff',
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800,
};
const empty: React.CSSProperties = { fontSize: 13, color: kds.muted, margin: '0 0 16px' };

export default RecipeViewer;
