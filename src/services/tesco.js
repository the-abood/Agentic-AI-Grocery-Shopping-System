const FALLBACKS = {
  'masala': 'spice',
  'coriander': 'herb',
  'ginger': 'spice',
  'turmeric': 'spice',
  'cumin': 'spice',
  'cardamom': 'spice',
  'saffron': 'spice',
  'paprika': 'spice',
  'oregano': 'herb',
  'basil': 'herb',
  'thyme': 'herb',
  'passata': 'tomato',
  'mozzarella': 'cheese',
  'parmesan': 'cheese',
  'pancetta': 'bacon',
  'chorizo': 'sausage',
  'courgette': 'vegetable',
  'aubergine': 'vegetable',
  'lentil': 'lentils',
  'chickpea': 'chickpeas',
  'cream': 'double cream',
  'cooking cream': 'cream',
  'plant cream': 'oat cream',
};

// Keywords that indicate wrong category results
const EXCLUDE_KEYWORDS = [
  'ice cream',
  'ice-cream',
  'frozen',
  'milkshake',
  'cream egg',
  'cadbury',
  'yogurt drink',
  'flavoured milk',
  'chocolate milk',
];

const isRelevant = (product, query) => {
  const title = product.title.toLowerCase();
  for (const kw of EXCLUDE_KEYWORDS) {
    if (title.includes(kw) && !query.toLowerCase().includes(kw)) {
      return false;
    }
  }
  return true;
};

async function fetchTesco(query) {
  const url = `https://tesco8.p.rapidapi.com/product-search-by-keyword?query=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-rapidapi-host': 'tesco8.p.rapidapi.com',
      'x-rapidapi-key': process.env.REACT_APP_RAPIDAPI_KEY
    }
  });
  const data = await res.json();
  return data?.data?.products || [];
}

export async function searchTescoProducts(query) {
  const simpleQuery = query.split(' ')[0].toLowerCase();

  try {
    // First attempt
    let products = await fetchTesco(simpleQuery);

    // Filter irrelevant results
    products = products.filter(p => isRelevant(p, simpleQuery));

    // Auto retry with fallback if nothing found
    if (products.length === 0 && FALLBACKS[simpleQuery]) {
      console.log(`🔄 Retrying "${simpleQuery}" with "${FALLBACKS[simpleQuery]}"`);
      products = await fetchTesco(FALLBACKS[simpleQuery]);
      products = products.filter(p => isRelevant(p, FALLBACKS[simpleQuery]));
    }

    // Second fallback — try full query if still nothing
    if (products.length === 0 && query !== simpleQuery) {
      console.log(`🔄 Retrying with full query: "${query}"`);
      products = await fetchTesco(query);
      products = products.filter(p => isRelevant(p, query));
    }

    return products
      .filter(p => p.isForSale)
      .slice(0, 3)
      .map(p => ({
        id: p.id,
        label: p.title,
        brand: p.brand,
        qty: p.title,
        price: p.price.price,
        image: p.imageUrl,
        clubcardPrice: p.promotions?.[0]?.description || null,
        rating: p.reviews?.averageRating || null
      }));
  } catch (e) {
    console.error('❌ Tesco error:', e.message);
    return [];
  }
}