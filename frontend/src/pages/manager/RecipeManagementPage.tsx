import React, { useState } from 'react';
import { colors, spacing, typography, shadows, borderRadius } from '../../styles/design-tokens';
import { createNeumorphicSurface, createCard, createBadge } from '../../styles/neumorphic-utils';
import {
  useGetAllMenuItemsQuery,
  useUpdateMenuItemMutation,
  MenuItem,
  Cuisine,
} from '../../store/api/menuApi';

const RecipeManagementPage: React.FC = () => {
  const { data: menuItems = [], isLoading } = useGetAllMenuItemsQuery();
  const [updateMenuItem] = useUpdateMenuItemMutation();

  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [editingIngredients, setEditingIngredients] = useState<string[]>([]);
  const [editingInstructions, setEditingInstructions] = useState<string[]>([]);
  const [newIngredient, setNewIngredient] = useState('');
  const [newInstruction, setNewInstruction] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCuisine, setFilterCuisine] = useState<Cuisine | 'ALL'>('ALL');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<number>(0);
  const [showPortionCalculator, setShowPortionCalculator] = useState(false);
  const [baseServings, setBaseServings] = useState(1);
  const [targetServings, setTargetServings] = useState(1);
  const [calculatedIngredients, setCalculatedIngredients] = useState<string[]>([]);

  const handleSelectItem = (item: MenuItem) => {
    setSelectedItem(item);
    setEditingIngredients(item.ingredients || []);
    setEditingInstructions(item.preparationInstructions || []);
    setSaveSuccess(false);
  };

  const handleAddIngredient = () => {
    if (newIngredient.trim()) {
      setEditingIngredients([...editingIngredients, newIngredient.trim()]);
      setNewIngredient('');
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setEditingIngredients(editingIngredients.filter((_, i) => i !== index));
  };

  const handleAddInstruction = () => {
    if (newInstruction.trim()) {
      setEditingInstructions([...editingInstructions, newInstruction.trim()]);
      setNewInstruction('');
    }
  };

  const handleRemoveInstruction = (index: number) => {
    setEditingInstructions(editingInstructions.filter((_, i) => i !== index));
  };

  const handleMoveInstructionUp = (index: number) => {
    if (index > 0) {
      const newInstructions = [...editingInstructions];
      [newInstructions[index - 1], newInstructions[index]] = [newInstructions[index], newInstructions[index - 1]];
      setEditingInstructions(newInstructions);
    }
  };

  const handleMoveInstructionDown = (index: number) => {
    if (index < editingInstructions.length - 1) {
      const newInstructions = [...editingInstructions];
      [newInstructions[index], newInstructions[index + 1]] = [newInstructions[index + 1], newInstructions[index]];
      setEditingInstructions(newInstructions);
    }
  };

  const handleSaveRecipe = async () => {
    if (!selectedItem) return;

    try {
      await updateMenuItem({
        id: selectedItem.id,
        data: {
          name: selectedItem.name,
          description: selectedItem.description,
          cuisine: selectedItem.cuisine,
          category: selectedItem.category,
          basePrice: selectedItem.basePrice,
          isAvailable: selectedItem.isAvailable,
          preparationTime: selectedItem.preparationTime,
          servingSize: selectedItem.servingSize,
          ingredients: editingIngredients,
          preparationInstructions: editingInstructions,
          allergens: selectedItem.allergens,
          dietaryInfo: selectedItem.dietaryInfo,
          spiceLevel: selectedItem.spiceLevel,
          imageUrl: selectedItem.imageUrl,
          tags: selectedItem.tags,
          isRecommended: selectedItem.isRecommended,
          displayOrder: selectedItem.displayOrder,
        },
      }).unwrap();

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to update recipe:', error);
      alert('Failed to save recipe. Please try again.');
    }
  };

  const handleImportRecipes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(0);

    try {
      const text = await file.text();
      let recipes: any[];

      // Try parsing as JSON
      if (file.name.endsWith('.json')) {
        recipes = JSON.parse(text);
      } else if (file.name.endsWith('.csv')) {
        // Simple CSV parsing
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',');
        recipes = lines.slice(1).map(line => {
          const values = line.split(',');
          const recipe: any = {};
          headers.forEach((header, index) => {
            const value = values[index]?.trim();
            if (header.includes('ingredients') || header.includes('preparationInstructions')) {
              recipe[header] = value ? value.split('|').map(v => v.trim()) : [];
            } else {
              recipe[header] = value;
            }
          });
          return recipe;
        });
      } else {
        throw new Error('Unsupported file format. Use JSON or CSV.');
      }

      let successCount = 0;

      for (const recipe of recipes) {
        const itemName = recipe.itemName || recipe.name;
        if (!itemName) continue;

        const menuItem = menuItems.find(item =>
          item.name.toLowerCase().includes(itemName.toLowerCase()) ||
          itemName.toLowerCase().includes(item.name.toLowerCase())
        );

        if (!menuItem) continue;

        try {
          await updateMenuItem({
            id: menuItem.id,
            data: {
              name: menuItem.name,
              description: menuItem.description,
              cuisine: menuItem.cuisine,
              category: menuItem.category,
              basePrice: menuItem.basePrice,
              isAvailable: menuItem.isAvailable,
              preparationTime: menuItem.preparationTime,
              servingSize: menuItem.servingSize,
              ingredients: recipe.ingredients || menuItem.ingredients,
              preparationInstructions: recipe.preparationInstructions || menuItem.preparationInstructions,
              allergens: menuItem.allergens,
              dietaryInfo: menuItem.dietaryInfo,
              spiceLevel: menuItem.spiceLevel,
              imageUrl: menuItem.imageUrl,
              tags: menuItem.tags,
              isRecommended: menuItem.isRecommended,
              displayOrder: menuItem.displayOrder,
            },
          }).unwrap();
          successCount++;
        } catch (error) {
          console.error(`Failed to import recipe for ${itemName}:`, error);
        }
      }

      setImportSuccess(successCount);
      setTimeout(() => setImportSuccess(0), 5000);
    } catch (error) {
      console.error('Import failed:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import recipes');
      setTimeout(() => setImportError(null), 5000);
    }

    // Reset file input
    event.target.value = '';
  };

  const calculatePortions = () => {
    if (baseServings === 0 || !selectedItem) return;

    const multiplier = targetServings / baseServings;

    const scaled = editingIngredients.map(ingredient => {
      // Extract numbers and units from ingredient string
      const match = ingredient.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]*)\s+(.+)$/);
      if (match) {
        const [, amount, unit, name] = match;
        const scaledAmount = (parseFloat(amount) * multiplier).toFixed(2);
        return `${scaledAmount} ${unit} ${name}`.trim();
      }
      return ingredient; // Return as-is if no number found
    });

    setCalculatedIngredients(scaled);
  };

  const applyCalculatedPortions = () => {
    setEditingIngredients(calculatedIngredients);
    if (selectedItem) {
      setSelectedItem({
        ...selectedItem,
        servingSize: targetServings.toString(),
      });
    }
    setShowPortionCalculator(false);
    setCalculatedIngredients([]);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCuisine = filterCuisine === 'ALL' || item.cuisine === filterCuisine;
    return matchesSearch && matchesCuisine;
  });

  // Styles
  const containerStyles: React.CSSProperties = {
    fontFamily: typography.fontFamily.primary,
    padding: spacing[8],
    backgroundColor: colors.surface.primary,
    minHeight: '100vh',
  };

  const headerStyles: React.CSSProperties = {
    marginBottom: spacing[8],
  };

  const titleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['4xl'],
    fontWeight: typography.fontWeight.extrabold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
    marginBottom: spacing[2],
  };

  const layoutStyles: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '350px 1fr',
    gap: spacing[6],
    alignItems: 'start',
  };

  const sidebarStyles: React.CSSProperties = {
    ...createCard('lg', 'base'),
    maxHeight: 'calc(100vh - 200px)',
    overflow: 'auto',
    position: 'sticky',
    top: spacing[4],
  };

  const searchInputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    width: '100%',
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    border: 'none',
    outline: 'none',
    fontFamily: typography.fontFamily.primary,
    marginBottom: spacing[4],
  };

  const filterButtonStyles = (isActive: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isActive ? 'inset' : 'raised', 'sm', 'md'),
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: isActive ? colors.brand.primary : colors.text.primary,
    backgroundColor: isActive ? colors.brand.primaryLight + '20' : colors.surface.primary,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: typography.fontFamily.primary,
  });

  const menuItemCardStyles = (isSelected: boolean): React.CSSProperties => ({
    ...createNeumorphicSurface(isSelected ? 'inset' : 'raised', 'sm', 'lg'),
    padding: spacing[4],
    marginBottom: spacing[3],
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    backgroundColor: isSelected ? colors.brand.primaryLight + '10' : colors.surface.primary,
  });

  const editorStyles: React.CSSProperties = {
    ...createCard('lg', 'base'),
  };

  const sectionStyles: React.CSSProperties = {
    marginBottom: spacing[8],
  };

  const sectionTitleStyles: React.CSSProperties = {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing[4],
  };

  const inputGroupStyles: React.CSSProperties = {
    display: 'flex',
    gap: spacing[3],
    marginBottom: spacing[4],
  };

  const inputStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    flex: 1,
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    border: 'none',
    outline: 'none',
    fontFamily: typography.fontFamily.primary,
  };

  const textareaStyles: React.CSSProperties = {
    ...createNeumorphicSurface('inset', 'sm', 'lg'),
    width: '100%',
    padding: `${spacing[3]} ${spacing[4]}`,
    fontSize: typography.fontSize.base,
    border: 'none',
    outline: 'none',
    fontFamily: typography.fontFamily.primary,
    minHeight: '100px',
    resize: 'vertical',
  };

  const addButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: `${spacing[3]} ${spacing[5]}`,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    color: colors.text.inverse,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.2s ease',
  };

  const listItemStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'lg'),
    padding: spacing[3],
    marginBottom: spacing[3],
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[3],
  };

  const deleteButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'sm', 'md'),
    padding: `${spacing[2]} ${spacing[3]}`,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.semantic.error,
    backgroundColor: colors.surface.primary,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  };

  const saveButtonStyles: React.CSSProperties = {
    ...createNeumorphicSurface('raised', 'base', 'lg'),
    padding: `${spacing[4]} ${spacing[8]}`,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.extrabold,
    background: saveSuccess
      ? `linear-gradient(135deg, ${colors.semantic.success}, ${colors.semantic.successLight})`
      : `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
    color: colors.text.inverse,
    border: 'none',
    cursor: 'pointer',
    fontFamily: typography.fontFamily.primary,
    transition: 'all 0.3s ease',
    width: '100%',
  };

  return (
    <div style={containerStyles}>
      <div style={headerStyles}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={titleStyles}>Recipe Management</h1>
            <p style={{ fontSize: typography.fontSize.lg, color: colors.text.secondary }}>
              Add and edit recipes, ingredients, and preparation instructions for menu items
            </p>
          </div>
          <div>
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleImportRecipes}
              style={{ display: 'none' }}
              id="recipe-import-input"
            />
            <label htmlFor="recipe-import-input">
              <div style={{
                ...createNeumorphicSurface('raised', 'base', 'lg'),
                padding: `${spacing[3]} ${spacing[6]}`,
                fontSize: typography.fontSize.base,
                fontWeight: typography.fontWeight.bold,
                background: `linear-gradient(135deg, ${colors.brand.secondary}, ${colors.brand.primary})`,
                color: colors.text.inverse,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'inline-block',
              }}>
                📥 Import Recipes (JSON/CSV)
              </div>
            </label>
          </div>
        </div>
        {importError && (
          <div style={{
            marginTop: spacing[4],
            padding: spacing[4],
            backgroundColor: colors.semantic.errorLight + '20',
            borderLeft: `4px solid ${colors.semantic.error}`,
            borderRadius: borderRadius.lg,
            color: colors.semantic.error,
            fontWeight: typography.fontWeight.semibold,
          }}>
            ❌ {importError}
          </div>
        )}
        {importSuccess > 0 && (
          <div style={{
            marginTop: spacing[4],
            padding: spacing[4],
            backgroundColor: colors.semantic.successLight + '20',
            borderLeft: `4px solid ${colors.semantic.success}`,
            borderRadius: borderRadius.lg,
            color: colors.semantic.success,
            fontWeight: typography.fontWeight.semibold,
          }}>
            ✅ Successfully imported {importSuccess} recipe{importSuccess !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div style={layoutStyles}>
        {/* Sidebar - Menu Items List */}
        <div style={sidebarStyles}>
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={searchInputStyles}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing[2], marginBottom: spacing[4] }}>
            <button
              style={filterButtonStyles(filterCuisine === 'ALL')}
              onClick={() => setFilterCuisine('ALL')}
            >
              All
            </button>
            {Object.values(Cuisine).map(cuisine => (
              <button
                key={cuisine}
                style={filterButtonStyles(filterCuisine === cuisine)}
                onClick={() => setFilterCuisine(cuisine)}
              >
                {cuisine.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: spacing[6], color: colors.text.secondary }}>
              Loading menu items...
            </div>
          ) : (
            filteredItems.map(item => (
              <div
                key={item.id}
                style={menuItemCardStyles(selectedItem?.id === item.id)}
                onClick={() => handleSelectItem(item)}
              >
                <div style={{ fontSize: typography.fontSize.base, fontWeight: typography.fontWeight.bold, marginBottom: spacing[1] }}>
                  {item.name}
                </div>
                <div style={{ fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                  {item.cuisine.replace(/_/g, ' ')} • {item.category.replace(/_/g, ' ')}
                </div>
                <div style={{ marginTop: spacing[2], fontSize: typography.fontSize.xs }}>
                  {item.ingredients && item.ingredients.length > 0 && (
                    <span style={{ ...createBadge('success', 'xs'), marginRight: spacing[2] }}>
                      {item.ingredients.length} ingredients
                    </span>
                  )}
                  {item.preparationInstructions && item.preparationInstructions.length > 0 && (
                    <span style={createBadge('info', 'xs')}>
                      {item.preparationInstructions.length} steps
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Editor */}
        <div style={editorStyles}>
          {!selectedItem ? (
            <div style={{ textAlign: 'center', padding: spacing[16], color: colors.text.tertiary }}>
              <div style={{ fontSize: typography.fontSize['4xl'], marginBottom: spacing[4] }}>👨‍🍳</div>
              <div style={{ fontSize: typography.fontSize.xl }}>Select a menu item to manage its recipe</div>
            </div>
          ) : (
            <>
              <div style={{ borderBottom: `2px solid ${colors.surface.tertiary}`, paddingBottom: spacing[6], marginBottom: spacing[8] }}>
                <h2 style={{
                  fontSize: typography.fontSize['3xl'],
                  fontWeight: typography.fontWeight.extrabold,
                  color: colors.text.primary,
                  marginBottom: spacing[2],
                }}>
                  {selectedItem.name}
                </h2>
                <p style={{ fontSize: typography.fontSize.base, color: colors.text.secondary }}>
                  {selectedItem.description || 'No description'}
                </p>
              </div>

              {/* Ingredients Section */}
              <div style={sectionStyles}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[4] }}>
                  <h3 style={sectionTitleStyles}>Ingredients</h3>
                  <button
                    style={{
                      ...createNeumorphicSurface('raised', 'sm', 'lg'),
                      padding: `${spacing[2]} ${spacing[4]}`,
                      fontSize: typography.fontSize.sm,
                      fontWeight: typography.fontWeight.semibold,
                      color: colors.brand.secondary,
                      backgroundColor: colors.surface.primary,
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    onClick={() => setShowPortionCalculator(!showPortionCalculator)}
                  >
                    🧮 Portion Calculator
                  </button>
                </div>

                {/* Portion Calculator */}
                {showPortionCalculator && (
                  <div style={{
                    ...createCard('base', 'sm'),
                    padding: spacing[4],
                    marginBottom: spacing[4],
                    backgroundColor: colors.brand.primaryLight + '10',
                  }}>
                    <h4 style={{
                      fontSize: typography.fontSize.lg,
                      fontWeight: typography.fontWeight.bold,
                      color: colors.text.primary,
                      marginBottom: spacing[3],
                    }}>
                      Scale Recipe Portions
                    </h4>
                    <div style={{ display: 'flex', gap: spacing[4], marginBottom: spacing[3] }}>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.secondary,
                          marginBottom: spacing[2],
                        }}>
                          Current Servings
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={baseServings}
                          onChange={(e) => setBaseServings(parseInt(e.target.value) || 1)}
                          style={inputStyles}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.semibold,
                          color: colors.text.secondary,
                          marginBottom: spacing[2],
                        }}>
                          Target Servings
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={targetServings}
                          onChange={(e) => setTargetServings(parseInt(e.target.value) || 1)}
                          style={inputStyles}
                        />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: spacing[3] }}>
                      <button
                        style={{
                          ...addButtonStyles,
                          flex: 1,
                          background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
                        }}
                        onClick={calculatePortions}
                      >
                        Calculate
                      </button>
                      {calculatedIngredients.length > 0 && (
                        <button
                          style={{
                            ...addButtonStyles,
                            flex: 1,
                            background: `linear-gradient(135deg, ${colors.semantic.success}, ${colors.semantic.successLight})`,
                          }}
                          onClick={applyCalculatedPortions}
                        >
                          Apply Scaled Amounts
                        </button>
                      )}
                    </div>
                    {calculatedIngredients.length > 0 && (
                      <div style={{
                        marginTop: spacing[4],
                        padding: spacing[3],
                        backgroundColor: colors.surface.secondary,
                        borderRadius: borderRadius.lg,
                      }}>
                        <div style={{
                          fontSize: typography.fontSize.sm,
                          fontWeight: typography.fontWeight.bold,
                          color: colors.text.primary,
                          marginBottom: spacing[2],
                        }}>
                          Scaled Ingredients (for {targetServings} servings):
                        </div>
                        {calculatedIngredients.map((ing, idx) => (
                          <div key={idx} style={{
                            fontSize: typography.fontSize.sm,
                            color: colors.text.secondary,
                            padding: `${spacing[1]} 0`,
                          }}>
                            • {ing}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div style={inputGroupStyles}>
                  <input
                    type="text"
                    placeholder="Enter ingredient (e.g., '2 cups rice')"
                    value={newIngredient}
                    onChange={(e) => setNewIngredient(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddIngredient()}
                    style={inputStyles}
                  />
                  <button style={addButtonStyles} onClick={handleAddIngredient}>
                    Add
                  </button>
                </div>

                {editingIngredients.map((ingredient, index) => (
                  <div key={index} style={listItemStyles}>
                    <span style={{ flex: 1, fontSize: typography.fontSize.base }}>
                      {ingredient}
                    </span>
                    <button style={deleteButtonStyles} onClick={() => handleRemoveIngredient(index)}>
                      Remove
                    </button>
                  </div>
                ))}

                {editingIngredients.length === 0 && (
                  <div style={{
                    ...createNeumorphicSurface('inset', 'md', 'lg'),
                    padding: spacing[6],
                    textAlign: 'center',
                    color: colors.text.tertiary,
                    fontStyle: 'italic',
                  }}>
                    No ingredients added yet
                  </div>
                )}
              </div>

              {/* Preparation Instructions Section */}
              <div style={sectionStyles}>
                <h3 style={sectionTitleStyles}>Preparation Instructions</h3>
                <div style={inputGroupStyles}>
                  <textarea
                    placeholder="Enter preparation step..."
                    value={newInstruction}
                    onChange={(e) => setNewInstruction(e.target.value)}
                    style={textareaStyles}
                  />
                </div>
                <button
                  style={{ ...addButtonStyles, width: '100%', marginBottom: spacing[4] }}
                  onClick={handleAddInstruction}
                >
                  Add Step
                </button>

                {editingInstructions.map((instruction, index) => (
                  <div key={index} style={listItemStyles}>
                    <div style={{
                      ...createNeumorphicSurface('raised', 'sm', 'full'),
                      width: '36px',
                      height: '36px',
                      minWidth: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: typography.fontSize.base,
                      fontWeight: typography.fontWeight.bold,
                      background: `linear-gradient(135deg, ${colors.brand.primary}, ${colors.brand.secondary})`,
                      color: colors.text.inverse,
                    }}>
                      {index + 1}
                    </div>
                    <span style={{ flex: 1, fontSize: typography.fontSize.base, lineHeight: typography.lineHeight.relaxed }}>
                      {instruction}
                    </span>
                    <div style={{ display: 'flex', gap: spacing[2] }}>
                      <button
                        style={deleteButtonStyles}
                        onClick={() => handleMoveInstructionUp(index)}
                        disabled={index === 0}
                      >
                        ↑
                      </button>
                      <button
                        style={deleteButtonStyles}
                        onClick={() => handleMoveInstructionDown(index)}
                        disabled={index === editingInstructions.length - 1}
                      >
                        ↓
                      </button>
                      <button style={deleteButtonStyles} onClick={() => handleRemoveInstruction(index)}>
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                {editingInstructions.length === 0 && (
                  <div style={{
                    ...createNeumorphicSurface('inset', 'md', 'lg'),
                    padding: spacing[6],
                    textAlign: 'center',
                    color: colors.text.tertiary,
                    fontStyle: 'italic',
                  }}>
                    No preparation instructions added yet
                  </div>
                )}
              </div>

              {/* Save Button */}
              <button style={saveButtonStyles} onClick={handleSaveRecipe}>
                {saveSuccess ? '✓ Recipe Saved Successfully!' : 'Save Recipe'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecipeManagementPage;
