import { useState, useEffect, useRef } from 'react';
import ChatBox from './components/ChatBox';
import Cart from './components/Cart';
import './App.css';

const STEPS = ['Chat', 'Ingredients', 'Review', 'Payment', 'Delivered'];
const SCREEN_TO_STEP = { chat: 0, ingredients: 1, review: 2, payment: 3, success: 4 };

function ProgressBar({ screen }) {
  const current = SCREEN_TO_STEP[screen] ?? 0;
  return (
    <div className="progress-bar">
      {STEPS.map((label, i) => (
        <div key={i} className={`progress-step ${i <= current ? 'progress-active' : ''}`}>
          <div className="progress-dot">{i < current ? '✓' : i + 1}</div>
          <div className="progress-label">{label}</div>
          {i < STEPS.length - 1 && (
            <div className={`progress-line ${i < current ? 'progress-line-active' : ''}`} />
          )}
        </div>
      ))}
    </div>
  );
}

function LiveAgentScreen({ logs }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="live-agent">
      <div className="live-agent-header">
        <div className="live-agent-pulse" />
        <span>🤖 Agent is working...</span>
      </div>
      <div className="live-agent-logs">
        {logs.map((log, i) => (
          <div key={i} className={`log-row ${log.type}`}>
            <span className="log-icon">{log.icon}</span>
            <span className="log-text">{log.text}</span>
          </div>
        ))}
        <div className="log-row typing">
          <span className="log-icon">⏳</span>
          <span className="log-text">
            <span className="log-dots">
              <span>.</span><span>.</span><span>.</span>
            </span>
          </span>
        </div>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function AutoPayment({ cart, total, onComplete }) {
  const USER_PROFILE = {
    name: 'Abdullah Bin Omar',
    address: '43 Crescent, Salford M5 4WT',
    card: '**** **** **** 4242',
  };

  const [step, setStep] = useState(0);

  const steps = [
    { icon: '🤖', text: 'Agent initiating payment...' },
    { icon: '💳', text: `Charging card ${USER_PROFILE.card}` },
    { icon: '📍', text: `Confirming delivery to ${USER_PROFILE.address}` },
    { icon: '📦', text: 'Notifying Tesco store...' },
    { icon: '✅', text: 'Payment confirmed!' },
  ];

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      setStep(current);
      if (current >= steps.length - 1) {
        clearInterval(interval);
        setTimeout(() => {
          onComplete({
            address: USER_PROFILE.address,
            itemCount: cart.length,
            total,
          });
        }, 800);
      }
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="auto-payment">
      <div className="auto-payment-icon">🤖</div>
      <h2>Agent is paying...</h2>
      <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
        Sit back — the AI is handling your checkout
      </p>
      <div className="payment-steps-list">
        {steps.map((s, i) => (
          <div key={i} className={`payment-step-item ${i <= step ? 'payment-step-done' : ''}`}>
            <span className="payment-step-icon">{i <= step ? '✓' : s.icon}</span>
            <span className="payment-step-text">{s.text}</span>
          </div>
        ))}
      </div>
      <div className="payment-progress-bar">
        <div
          className="payment-progress-fill"
          style={{ width: `${(step / (steps.length - 1)) * 100}%` }}
        />
      </div>
      <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 16 }}>
        Total: £{total} · Card: {USER_PROFILE.card}
      </p>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState('chat');
  const [cart, setCart] = useState([]);
  const [orderSummary, setOrderSummary] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (icon, text, type = 'info') => {
    setLogs(prev => [...prev, { icon, text, type }]);
  };

  const handleCartReady = (items) => {
    setCart(items);
    setScreen('review');
  };

  const handleRemove = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  const handleConfirmOrder = () => {
    setScreen('payment');
  };

  const handleOrderComplete = (summary) => {
    setOrderSummary(summary);
    setScreen('success');
  };

  const handleRestart = () => {
    setOrderSummary(null);
    setCart([]);
    setLogs([]);
    setScreen('chat');
  };

  const total = cart.reduce((s, i) => s + parseFloat(i.price), 0).toFixed(2);

  return (
    <div className="app">
      <div className="header">
        <div className="brand">🛒 GroceryMind</div>
      </div>

      <ProgressBar screen={screen} />

      {screen === 'chat' && (
        <ChatBox
          onCartReady={handleCartReady}
          onOrderComplete={handleOrderComplete}
          onScreenChange={setScreen}
          addLog={addLog}
        />
      )}

      {screen === 'ingredients' && (
        <LiveAgentScreen logs={logs} />
      )}

      {screen === 'review' && (
        <Cart
          cart={cart}
          onRemove={handleRemove}
          onCheckout={handleConfirmOrder}
          onBack={() => setScreen('chat')}
          isReview={true}
        />
      )}

      {screen === 'payment' && (
        <AutoPayment
          cart={cart}
          total={total}
          onComplete={handleOrderComplete}
        />
      )}

      {screen === 'success' && orderSummary && (
        <div className="success">
          <div className="success-icon">🎉</div>
          <h2>Order confirmed!</h2>
          <div className="delivery-card">
            <div className="delivery-row">
              <span>📦</span>
              <div>
                <div className="delivery-label">Status</div>
                <div className="delivery-value">Order received & being packed</div>
              </div>
            </div>
            <div className="delivery-row">
              <span>🚚</span>
              <div>
                <div className="delivery-label">Estimated delivery</div>
                <div className="delivery-value">30–45 minutes to your door</div>
              </div>
            </div>
            <div className="delivery-row">
              <span>📍</span>
              <div>
                <div className="delivery-label">Delivering to</div>
                <div className="delivery-value">{orderSummary.address}</div>
              </div>
            </div>
            <div className="delivery-row">
              <span>🛒</span>
              <div>
                <div className="delivery-label">Items ordered</div>
                <div className="delivery-value">{orderSummary.itemCount} ingredients</div>
              </div>
            </div>
            <div className="delivery-row">
              <span>💳</span>
              <div>
                <div className="delivery-label">Total charged</div>
                <div className="delivery-value">£{orderSummary.total}</div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#6B7280', marginBottom: 20 }}>
            Confirmation sent to your email.
          </p>
          <button className="main-btn" onClick={handleRestart}>
            Start a new order
          </button>
        </div>
      )}
    </div>
  );
}

export default App;