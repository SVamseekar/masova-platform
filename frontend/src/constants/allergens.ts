export type AllergenType =
  | 'CELERY'
  | 'CEREALS_GLUTEN'
  | 'CRUSTACEANS'
  | 'EGGS'
  | 'FISH'
  | 'LUPIN'
  | 'MILK'
  | 'MOLLUSCS'
  | 'MUSTARD'
  | 'NUTS'
  | 'PEANUTS'
  | 'SESAME'
  | 'SOYA'
  | 'SULPHUR_DIOXIDE';

export const ALLERGEN_LABELS: Record<AllergenType, string> = {
  CELERY: 'Celery',
  CEREALS_GLUTEN: 'Cereals containing gluten',
  CRUSTACEANS: 'Crustaceans',
  EGGS: 'Eggs',
  FISH: 'Fish',
  LUPIN: 'Lupin',
  MILK: 'Milk',
  MOLLUSCS: 'Molluscs',
  MUSTARD: 'Mustard',
  NUTS: 'Tree nuts',
  PEANUTS: 'Peanuts',
  SESAME: 'Sesame',
  SOYA: 'Soya',
  SULPHUR_DIOXIDE: 'Sulphur dioxide and sulphites',
};

export const ALLERGEN_SHORT: Record<AllergenType, string> = {
  CELERY: 'CEL',
  CEREALS_GLUTEN: 'GLU',
  CRUSTACEANS: 'CRU',
  EGGS: 'EGG',
  FISH: 'FSH',
  LUPIN: 'LUP',
  MILK: 'MLK',
  MOLLUSCS: 'MOL',
  MUSTARD: 'MUS',
  NUTS: 'NUT',
  PEANUTS: 'PNT',
  SESAME: 'SES',
  SOYA: 'SOY',
  SULPHUR_DIOXIDE: 'SUL',
};

export const ALL_ALLERGENS: AllergenType[] = Object.keys(ALLERGEN_LABELS) as AllergenType[];
