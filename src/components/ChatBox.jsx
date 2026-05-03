import { useState, useRef, useEffect } from 'react';
import { getIngredients, getSubstitute, getBestPack } from '../services/gemini';
import { searchTescoProducts } from '../services/tesco';

const SUGGESTIONS = [
  '🍫 Chocolate Cake',
  '🍝 Pasta Carbonara',
  '🍛 Chicken Biryani',
  '🥞 Pancakes',
  '🍕 Margherita Pizza',
  '🥗 Caesar Salad',
];

const USER_PROFILE = {
  name: 'Abdullah Bin Omar',
  address: '43 Crescent, Salford M5 4WT',
  card: '**** **** **** 4242',
};

function ChatBox({ onCartReady, onOrderComplete, onScreenChange, addLog }) {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! 👋 Tell me what you want to cook — I'll handle everything from ingredients to checkout automatically.\n\nYou can say things like:\n• 'biryani for 4 people'\n• 'pasta, I'm allergic to dairy'\n• 'chocolate cake, budget £10'" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const addMsg = (role, text) => {
    setMessages(prev => [...prev, { role, text }]);
  };

  const handleSuggestion = (suggestion) => {
    const text = suggestion.replace(/^.{2}/, '').trim();
    setShowSuggestions(false);
    runAgent(text);
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const text = input.trim();
    setInput('');
    setShowSuggestions(false);

    if (done) {
      addMsg('user', text);
      setDone(false);
      runAgent(text);
      return;
    }

    runAgent(text);
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  const runAgent = async (userMessage) => {
    addMsg('user', userMessage);
    setLoading(true);

    try {
      // ── STEP 1: Plan ──────────────────────────────────
      addMsg('bot', `🤖 Starting autonomous checkout...`);
      onScreenChange('ingredients');
      addLog('🧠', 'Analysing your request...', 'info');
      await sleep(800);

      // ── STEP 2: Get ingredients from Gemini ───────────
      addLog('📋', 'Building ingredient list...', 'info');
      const result = await getIngredients(userMessage);
      addLog('✅', `Found ${result.ingredients.length} ingredients for ${result.assumptions}`, 'success');
      addMsg('bot', `✅ ${result.reply}\n📋 Assumptions: ${result.assumptions || '2 people, no allergies, mid-range budget'}`);

      // ── STEP 3: Search Tesco for ALL ingredients in parallel ──
      addLog('🔍', `Searching Tesco for ${result.ingredients.length} ingredients in parallel...`, 'info');

      const cartItems = (await Promise.all(
        result.ingredients.map(async (ing) => {
          let tescoPacks = [];
          let finalName = ing.name;

          addLog('🛒', `Searching: ${ing.name}...`, 'info');

          try {
            tescoPacks = await searchTescoProducts(ing.search);

            // Auto substitute if not found
            if (tescoPacks.length === 0) {
              addLog('🔄', `"${ing.name}" not found — finding substitute...`, 'warn');
              try {
                const sub = await getSubstitute(ing.name, ing.search);
                tescoPacks = await searchTescoProducts(sub.search);
                if (tescoPacks.length > 0) {
                  finalName = `${ing.name} → ${sub.substitute}`;
                  addLog('✅', `Substituted "${ing.name}" with "${sub.substitute}"`, 'success');
                  addMsg('bot', `✅ Substituted "${ing.name}" with "${sub.substitute}"`);
                }
              } catch (e) {
                addLog('⚠️', `Could not find substitute for "${ing.name}" — skipping`, 'error');
                return null;
              }
            }

            // Let Gemini pick best pack
            if (tescoPacks.length > 0) {
              const neededQty = ing.packs?.[0]?.qty || 'unknown';
              addLog('⚖️', `Selecting best pack for ${ing.name} (need: ${neededQty})...`, 'info');
              const best = await getBestPack(ing.name, neededQty, tescoPacks, result.budget);
              const selectedPack = {
                ...tescoPacks[best.index ?? 0],
                selectionReason: best.reason,
              };
              addLog('✅', `Selected: ${selectedPack.label} — £${selectedPack.price} — ${best.reason}`, 'success');
              return {
                ...ing,
                name: finalName,
                price: selectedPack.price.toFixed(2),
                qty: selectedPack.label,
                image: selectedPack.image,
                brand: selectedPack.brand,
                rating: selectedPack.rating,
                clubcardPrice: selectedPack.clubcardPrice,
                selectionReason: selectedPack.selectionReason,
              };
            }
          } catch (e) {
            addLog('❌', `Failed to process: ${ing.name}`, 'error');
            console.log('Failed for:', ing.name);
          }

          return null;
        })
      )).filter(Boolean);

      const total = cartItems.reduce((s, i) => s + parseFloat(i.price), 0).toFixed(2);
      addLog('🛒', `Cart complete! ${cartItems.length} items — Total: £${total}`, 'success');
      addMsg('bot', `🛒 Cart ready! ${cartItems.length} items — Total: £${total}`);
      await sleep(600);

      addLog('👉', 'Moving to review step...', 'info');
      addMsg('bot', `✅ Done! I've selected ${cartItems.length} items totalling £${total}.\n\nPlease review your cart — remove anything you don't want, then confirm to proceed to payment.`);
      setDone(true);
      onCartReady(cartItems);

    } catch (e) {
      addMsg('bot', '❌ Something went wrong. Please try again!');
      onScreenChange('chat');
    }

    setLoading(false);
  };

  return (
    <div className="chatbox">
      <div className="messages" style={{ overflowY: 'auto', maxHeight: 500 }}>
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`} style={{ whiteSpace: 'pre-line' }}>
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="plan-card">
            <div className="plan-header">🤖 Agent is working autonomously...</div>
            <div className="plan-row">
              <span className="plan-icon">⚡</span>
              <div>
                <div className="plan-label">Mode</div>
                <div className="plan-value">Fully autonomous — no input needed</div>
              </div>
            </div>
            <div className="plan-row">
              <span className="plan-icon">🔄</span>
              <div>
                <div className="plan-label">Status</div>
                <div className="plan-value">Searching, selecting and checking out...</div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {showSuggestions && !loading && !done && (
        <div className="suggestions">
          <div className="suggestions-label">Popular recipes</div>
          <div className="chips">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="chip" onClick={() => handleSuggestion(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {!done && (
        <div className="input-row">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="e.g. chocolate cake for 2, budget £15..."
            disabled={loading}
          />
          <button onClick={handleSend} disabled={loading}>
            {loading ? '...' : 'Send'}
          </button>
        </div>
      )}

      {done && !loading && (
        <button className="main-btn" style={{ margin: '12px 20px' }} onClick={() => {
          setDone(false);
          setShowSuggestions(true);
          setMessages([{ role: 'bot', text: "Hi! 👋 What would you like to cook next?" }]);
          onScreenChange('chat');
        }}>
          + New order
        </button>
      )}
    </div>
  );
}

export default ChatBox;