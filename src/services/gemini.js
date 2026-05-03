async function callGroq(prompt, temperature = 0.1, retries = 3) {
  const url = `https://api.groq.com/openai/v1/chat/completions`;

  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.REACT_APP_GEMINI_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        temperature: temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (res.status === 429) {
      const wait = (i + 1) * 5000;
      console.log(`⏳ Rate limited — waiting ${wait / 1000}s before retry ${i + 1}...`);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }

    const data = await res.json();
    const text = data.choices[0].message.content;
    return text.replace(/```json|```/g, '').trim();
  }

  throw new Error('Groq rate limit exceeded after retries');
}

export async function getIngredients(userMessage) {
  const text = await callGroq(`You are an autonomous AI grocery agent for a UK supermarket app.

The user will send ONE message describing what they want to cook.
You must infer EVERYTHING from that message and act immediately.

INFER from the message:
- Recipe name (required)
- Number of people (if not stated, assume 2)
- Allergies (if not stated, assume none)
- Budget (if not stated assume "mid-range", if stated extract the number e.g. "15")
- Dietary preferences (if not stated, assume none)

NEVER ask clarifying questions. Always proceed with reasonable assumptions.

STRICT INGREDIENT RULES:
1. Use the MOST COMMON and WIDELY ACCEPTED version of the recipe
2. If multiple versions exist — pick the simplest most traditional one
3. Be CONSISTENT — always return the same core ingredients for the same dish
4. ONLY include ingredients that belong in the traditional recipe
5. NEVER add ingredients from other dishes
6. If you are even 1% unsure an ingredient belongs — DO NOT include it
7. Every ingredient must pass this test: "Would a recipe book for THIS dish list this ingredient?" If no — remove it
8. Scale quantities for the inferred number of people
9. Return a MAXIMUM of 7 ingredients — only the most essential ones
10. Output ONLY raw valid JSON — no markdown, no backticks, no explanation text

SEARCH FIELD RULE — most important:
The "search" field is used to search a supermarket database.
It must ALWAYS be a single common English noun — the simplest possible grocery word.
Strip ALL adjectives, descriptors, and qualifiers.
Ask yourself: "What single word would I type into a supermarket search bar?"
Examples of the pattern to follow:
- Any type of rice → "rice"
- Any type of onion → "onion"
- Any type of oil → "oil"
- Any type of flour → "flour"
- Any type of milk → "milk"
- Any type of yogurt → "yogurt"
- Any cooking cream → "cream"
- Any plant based cream → "cream"
- Any spice blend → its main spice name
- Any fresh herb → just the herb name
Apply this pattern to EVERY ingredient no matter what recipe it is.

Return this exact JSON structure:
{
  "reply": "friendly one sentence summary of what you are doing including your assumptions",
  "assumptions": "2 people, no allergies, mid-range budget",
  "budget": "mid-range",
  "ingredients": [
    {
      "name": "Basmati Rice",
      "icon": "🍚",
      "search": "rice",
      "reason": "The base of biryani providing fluffy aromatic layers.",
      "packs": [
        { "label": "500g bag", "qty": "500g", "price": 1.29 },
        { "label": "1kg bag", "qty": "1kg", "price": 2.19 },
        { "label": "2kg bag", "qty": "2kg", "price": 3.99 }
      ]
    }
  ]
}

User message: ${userMessage}

Before outputting, check every single search field — if it has more than one word or contains an adjective, simplify it to one noun.`);

  return JSON.parse(text);
}

export async function getSubstitute(ingredientName, recipeName) {
  const text = await callGroq(`A UK supermarket search returned no results for "${ingredientName}" needed in ${recipeName}.
Suggest ONE simple substitute ingredient that:
1. Is commonly available in UK supermarkets
2. Works in this recipe
3. Is searchable with a single common word

Return ONLY valid JSON, no markdown:
{
  "substitute": "butter",
  "search": "butter",
  "reason": "Can replace oil in most cake recipes"
}`);

  return JSON.parse(text);
}

export async function getBestPack(ingredientName, neededQty, packs, budget) {
  const hasBudget = budget && budget !== 'none' && budget !== 'mid-range';

  const text = await callGroq(`You are a smart grocery assistant selecting the best Tesco product pack.

Ingredient needed: ${ingredientName}
Quantity needed for the recipe: ${neededQty}
User budget mode: ${hasBudget ? `BUDGET CONSCIOUS — total budget is £${budget}` : 'MID-RANGE — no strict budget'}

Available packs from Tesco:
${packs.map((p, i) => `${i}: "${p.label}" — £${p.price} — rated ${p.rating || 'unrated'} — clubcard: ${p.clubcardPrice ? p.clubcardPrice : 'no'}`).join('\n')}

${hasBudget ? `
BUDGET MODE — follow these priorities in order:
1. QUANTITY — pack must cover the needed quantity (closest without going under)
2. ECONOMY — pick the cheapest option that meets quantity
3. CLUBCARD — prefer packs with clubcard discount if same price
4. RATING — tiebreaker only
` : `
MID-RANGE MODE — follow these priorities in order:
1. QUANTITY — pack must be closest to the needed quantity without going under
2. CLUBCARD — strongly prefer packs that have a clubcard discount price
3. MID-RANGE PRICE — avoid the cheapest and most expensive, pick the middle option
4. RATING — tiebreaker if price and clubcard are similar
`}

Return ONLY valid JSON, no markdown:
{
  "index": 0,
  "reason": "one sentence explaining why this pack was chosen"
}`);

  return JSON.parse(text);
}