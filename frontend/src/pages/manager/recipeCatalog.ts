/** Professional default recipes used when a menu item has no saved ingredients/steps. */

export interface RecipeDefaults {
  ingredients: string[];
  steps: string[];
}

const R: Record<string, RecipeDefaults> = {
  'masala dosa': {
    ingredients: [
      '2 cups idli/dosa rice, soaked 4 hours',
      '½ cup urad dal, soaked 4 hours',
      '1 tsp fenugreek seeds',
      'Potato masala: 4 boiled potatoes, 1 onion, 1 tsp mustard, curry leaves, turmeric, salt',
      'Red chutney: 6 dry red chillies, 4 garlic cloves, 1 tbsp chana dal, tamarind',
      'Ghee or oil for spreading',
    ],
    steps: [
      'Grind soaked rice, dal and fenugreek to a smooth batter. Ferment 8–12 hours.',
      'For masala, temper mustard and curry leaves, sauté onion, add turmeric and crushed potatoes. Season.',
      'Blend red chutney ingredients with a splash of water to a thick paste.',
      'Heat a tawa, pour a ladle of batter and spread thin. Drizzle ghee.',
      'Spread red chutney, add potato masala down the centre, fold and serve hot with sambar.',
    ],
  },
  'plain dosa': {
    ingredients: [
      '2 cups dosa rice, soaked',
      '½ cup urad dal, soaked',
      '1 tsp fenugreek seeds',
      'Salt to taste',
      'Ghee or oil',
    ],
    steps: [
      'Grind rice, dal and fenugreek. Ferment overnight until airy.',
      'Stir in salt. Heat a seasoned tawa until a drop of water sizzles.',
      'Spread batter thinly from the centre outward.',
      'Drizzle ghee on the edges, cook until crisp and golden. Serve with chutney and sambar.',
    ],
  },
  'mysore masala dosa': {
    ingredients: [
      'Fermented dosa batter',
      'Mysore red chutney: Byadgi chillies, garlic, chana dal, coconut, tamarind',
      'Potato palya with onion, green chilli, curry leaves',
      'Ghee',
    ],
    steps: [
      'Prepare a pungent red chutney — roast chillies and dal, grind with garlic and coconut.',
      'Cook potato palya until dry enough to fold.',
      'Spread batter on a hot tawa, cook until the surface is dry.',
      'Smear red chutney across the dosa, add palya, fold into a roll and finish with ghee.',
    ],
  },
  'rava dosa': {
    ingredients: [
      '1 cup fine rava (semolina)',
      '¼ cup rice flour',
      '2 tbsp maida',
      '1 tsp cumin, 1 tsp crushed pepper',
      'Green chilli, ginger, curry leaves, coriander',
      'Buttermilk or water to a thin batter',
    ],
    steps: [
      'Mix flours with spices and enough liquid to a watery batter. Rest 20 minutes.',
      'Heat tawa well. Pour batter from the outside in so holes form.',
      'Drizzle oil in the lacy gaps. Cook until crisp; do not spread like regular dosa.',
      'Fold and serve immediately with coconut chutney.',
    ],
  },
  'idly sambar': {
    ingredients: [
      'Idli batter: 4 cups idli rice, 1 cup urad dal, 1 tsp fenugreek',
      'Sambar: toor dal, mixed vegetables, tamarind, sambar powder, mustard, curry leaves',
      'Coconut chutney',
    ],
    steps: [
      'Grind and ferment idli batter until doubled.',
      'Grease idli moulds, steam 10–12 minutes until a skewer comes out clean.',
      'Pressure-cook dal and vegetables. Temper mustard, add tamarind and sambar powder, simmer.',
      'Serve three idlis with a ladle of sambar and coconut chutney.',
    ],
  },
  'medu vada': {
    ingredients: [
      '2 cups urad dal, soaked 3 hours (not fermented)',
      '1 tsp black pepper, 1 tsp cumin',
      'Ginger, green chilli, curry leaves, salt',
      'Oil for deep frying',
    ],
    steps: [
      'Grind dal to a fluffy paste with minimal water. Beat until airy.',
      'Fold in spices, chilli and curry leaves. Do not overmix.',
      'Wet hands, shape doughnuts with a hole, slide into 170°C oil.',
      'Fry until golden and crisp outside, steamed inside. Serve with sambar.',
    ],
  },
  'idly vada combo': {
    ingredients: [
      'Steamed idlis (see Idly Sambar)',
      'Medu vadas',
      'Sambar and coconut chutney',
    ],
    steps: [
      'Steam a fresh batch of idlis.',
      'Fry vadas to order so they stay crisp.',
      'Plate two idlis and one vada with sambar poured tableside and chutney on the side.',
    ],
  },
  'south indian thali': {
    ingredients: [
      'Steamed rice',
      'Sambar and rasam',
      'Poriyal (seasonal vegetable stir-fry)',
      'Kootu, yogurt, pickle, appalam',
      'Payasam for dessert',
    ],
    steps: [
      'Cook rice and hold warm.',
      'Finish sambar and rasam; keep poriyal dry and kootu mildly spiced.',
      'Arrange in a compartment plate: rice centre, gravies, sides, pickle and appalam.',
      'Add a small bowl of payasam. Serve immediately.',
    ],
  },
};

function keyOf(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function recipeDefaultsFor(name: string | undefined | null): RecipeDefaults | null {
  if (!name) return null;
  const exact = R[keyOf(name)];
  if (exact) return exact;
  const hit = Object.entries(R).find(([k]) => keyOf(name).includes(k) || k.includes(keyOf(name)));
  return hit ? hit[1] : null;
}
