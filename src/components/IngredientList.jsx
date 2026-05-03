import { useState, useEffect } from 'react';
import { searchTescoProducts } from '../services/tesco';
import { getSubstitute, getBestPack } from '../services/gemini';

function StarRating({ rating }) {
  if (!rating) return null;
  const stars = Math.round(rating);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginTop: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 10, color: i <= stars ? '#F59E0B' : '#D1D5DB' }}>★</span>
      ))}
      <span style={{ fontSize: 10, color: '#6B7280', marginLeft: 2 }}>{rating.toFixed(1)}</span>
    </div>
  );
}

function WhyTooltip({ reason }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setShow(!show)}
        style={{ fontSize: 10, color: '#2D6A4F', background: '#D8F3DC', border: 'none', borderRadius: 99, padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit' }}
      >
        Why? 💬
      </button>
      {show && (
        <div style={{ position: 'absolute', bottom: '120%', left: 0, background: '#1A1A1A', color: 'white', fontSize: 11, padding: '8px 10px', borderRadius: 8, width: 180, zIndex: 10, lineHeight: 1.5 }}>
          {reason}
          <div style={{ position: 'absolute', bottom: -5, left: 10, width: 10, height: 10, background: '#1A1A1A', transform: 'rotate(45deg)' }} />
        </div>
      )}
    </div>
  );
}

function IngredientCard({ item, onPackSelect, selectedPack, onRemove }) {
  const packs = item.tescoPacks || [];

  return (
    <div className="ing-card">
      <div className="ing-card-top">
        <span className="ing-icon">{item.icon}</span>
        <div className="ing-info">
          <div className="ing-name">{item.name}</div>
          <div className="ing-meta">Needed: {item.packs?.[0]?.qty || ''}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
            <span className="badge-green">Tesco</span>
            {item.substituted && (
              <span style={{ fontSize: 10, background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 99, padding: '2px 7px', fontWeight: 500 }}>
                🔄 Substituted
              </span>
            )}
            {item.reason && <WhyTooltip reason={item.reason} />}
          </div>
          {selectedPack?.selectionReason && (
            <div style={{ fontSize: 10, color: '#6B7280', marginTop: 4, fontStyle: 'italic' }}>
              🤖 {selectedPack.selectionReason}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <div className="ing-price">
            £{selectedPack ? selectedPack.price.toFixed(2) : packs[0]?.price?.toFixed(2) || '—'}
          </div>
          <button onClick={onRemove} className="remove-ing-btn">Remove</button>
        </div>
      </div>

      {packs.length > 0 ? (
        <div className="pack-options">
          {packs.map((pack, i) => (
            <button
              key={i}
              className={`pack-btn ${selectedPack?.id === pack.id ? 'pack-btn-selected' : ''}`}
              onClick={() => onPackSelect(item.name, pack)}
            >
              <img src={pack.image} alt={pack.label} className="pack-img" />
              <span className="pack-name">
                {pack.label.length > 30 ? pack.label.slice(0, 30) + '...' : pack.label}
              </span>
              <span className="pack-price">£{pack.price.toFixed(2)}</span>
              {pack.clubcardPrice && (
                <span className="clubcard-badge">
                  Clubcard: {pack.clubcardPrice.replace('Clubcard Price', '').trim()}
                </span>
              )}
              {pack.rating && (
                <div className="star-row">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} style={{ color: s <= Math.round(pack.rating) ? '#F59E0B' : '#E5E7EB', fontSize: 10 }}>★</span>
                  ))}
                  <span className="rating-text">{pack.rating.toFixed(1)}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      ) : (
        <div className="no-products">No Tesco products found</div>
      )}
    </div>
  );
}

function IngredientList({ ingredients, onAddToCart, onBack, budget }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPacks, setSelectedPacks] = useState({});

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await new Promise(r => setTimeout(r, 1500));

      // Step 1 — fetch Tesco products for each ingredient
      const results = await Promise.all(
        ingredients.map(async (ing) => {
          let tescoPacks = [];
          let finalName = ing.name;
          let substituted = false;

          try {
            tescoPacks = await searchTescoProducts(ing.search);

            // Auto substitute if nothing found
            if (tescoPacks.length === 0) {
              console.log(`🔄 Auto substituting: ${ing.name}`);
              try {
                const sub = await getSubstitute(ing.name, ing.search);
                const subPacks = await searchTescoProducts(sub.search);
                if (subPacks.length > 0) {
                  tescoPacks = subPacks;
                  finalName = `${ing.name} → ${sub.substitute}`;
                  substituted = true;
                  console.log(`✅ Substituted with: ${sub.substitute}`);
                }
              } catch (subError) {
                console.log('Substitution failed for:', ing.name);
              }
            }
          } catch (e) {
            console.log('Tesco search failed for:', ing.name);
          }

          return { ...ing, name: finalName, tescoPacks, substituted };
        })
      );

      // Step 2 — let Gemini pick the best pack for each ingredient
      const defaults = {};
      await Promise.all(
        results.map(async (item) => {
          if (item.tescoPacks && item.tescoPacks.length > 0) {
            try {
              const neededQty = item.packs?.[0]?.qty || 'unknown';
              const result = await getBestPack(item.name, neededQty, item.tescoPacks, budget);
              const bestIndex = result.index ?? 0;
              defaults[item.name] = {
                ...item.tescoPacks[bestIndex],
                selectionReason: result.reason
              };
              console.log(`✅ ${item.name} → ${item.tescoPacks[bestIndex]?.label} — ${result.reason}`);
            } catch (e) {
              defaults[item.name] = item.tescoPacks[0];
              console.log(`⚠️ Fallback for ${item.name}`);
            }
          }
        })
      );

      setProducts(results);
      setSelectedPacks(defaults);
      setLoading(false);
    };
    fetchAll();
  }, [ingredients]);

  const handlePackSelect = (name, pack) => {
    setSelectedPacks(prev => ({ ...prev, [name]: pack }));
  };

  const handleRemoveIngredient = (name) => {
    setProducts(prev => prev.filter(p => p.name !== name));
    setSelectedPacks(prev => {
      const updated = { ...prev };
      delete updated[name];
      return updated;
    });
  };

  const handleAddToCart = () => {
    const cartItems = products.map(item => ({
      ...item,
      price: selectedPacks[item.name]?.price.toFixed(2) || '0.99',
      qty: selectedPacks[item.name]?.label || item.name,
      image: selectedPacks[item.name]?.image || null,
      brand: selectedPacks[item.name]?.brand || '',
      rating: selectedPacks[item.name]?.rating || null,
      clubcardPrice: selectedPacks[item.name]?.clubcardPrice || null,
      selectionReason: selectedPacks[item.name]?.selectionReason || null,
    }));
    onAddToCart(cartItems);
  };

  const total = products.reduce((sum, item) => {
    return sum + (selectedPacks[item.name]?.price || 0);
  }, 0);

  if (loading) return (
    <div className="ingredient-list">
      <h2>Finding your ingredients...</h2>
      <p>Searching Tesco for real products</p>
      {[1,2,3,4,5,6].map(i => (
        <div key={i} className="skeleton-card">
          <div className="skeleton-top">
            <div className="skeleton-circle" style={{ animationDelay: `${i * 0.1}s` }} />
            <div className="skeleton-lines">
              <div className="skeleton-line long" style={{ animationDelay: `${i * 0.1}s` }} />
              <div className="skeleton-line medium" style={{ animationDelay: `${i * 0.15}s` }} />
              <div className="skeleton-line short" style={{ animationDelay: `${i * 0.2}s` }} />
            </div>
          </div>
          <div className="skeleton-packs">
            <div className="skeleton-pack" />
            <div className="skeleton-pack" />
            <div className="skeleton-pack" />
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="ingredient-list">
      <h2>Choose your products</h2>
      <p>{products.length} ingredients — select your preferred pack size</p>
      {products.map((item, i) => (
        <IngredientCard
          key={i}
          item={item}
          selectedPack={selectedPacks[item.name]}
          onPackSelect={handlePackSelect}
          onRemove={() => handleRemoveIngredient(item.name)}
        />
      ))}
      <div className="ing-total-row">
        <span>Estimated total</span>
        <strong>£{total.toFixed(2)}</strong>
      </div>
      <>
        <button className="main-btn" onClick={handleAddToCart}>
          Add all to cart →
        </button>
        <button className="back-btn" onClick={onBack}>
          ← Search a different recipe
        </button>
      </>
    </div>
  );
}

export default IngredientList;