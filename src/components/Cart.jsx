function StarRating({ rating }) {
  if (!rating) return null;
  const stars = Math.round(rating);
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: 10, color: i <= stars ? '#F59E0B' : '#D1D5DB' }}>★</span>
      ))}
    </div>
  );
}

function CartSkeleton() {
  return (
    <div className="cart">
      <h2>🤖 Agent selected these items</h2>
      <p>Loading your cart...</p>
      {[1,2,3,4,5].map(i => (
        <div key={i} className="cart-card">
          <div style={{ width: 44, height: 44, borderRadius: 8, background: '#E5E7EB', flexShrink: 0, animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ height: 12, borderRadius: 6, background: '#E5E7EB', width: '70%', animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.1}s` }} />
            <div style={{ height: 10, borderRadius: 6, background: '#E5E7EB', width: '50%', animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.15}s` }} />
            <div style={{ height: 10, borderRadius: 6, background: '#E5E7EB', width: '30%', animation: 'shimmer 1.4s ease-in-out infinite', animationDelay: `${i * 0.2}s` }} />
          </div>
          <div style={{ width: 40, height: 16, borderRadius: 6, background: '#E5E7EB', animation: 'shimmer 1.4s ease-in-out infinite' }} />
        </div>
      ))}
      <div style={{ height: 48, borderRadius: 14, background: '#E5E7EB', marginTop: 14, animation: 'shimmer 1.4s ease-in-out infinite' }} />
    </div>
  );
}

function Cart({ cart, onRemove, onCheckout, onBack, isReview }) {
  if (isReview && cart.length === 0) return <CartSkeleton />;

  const total = cart.reduce((sum, item) => sum + parseFloat(item.price), 0);

  return (
    <div className="cart">
      <h2>{isReview ? '🤖 Agent selected these items' : 'Your Cart'}</h2>
      <p>{cart.length} item{cart.length !== 1 ? 's' : ''} — review and remove anything you don't want</p>
      {cart.map((item, i) => (
        <div key={i} className="cart-card">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, flexShrink: 0, background: '#F9FAF9' }}
            />
          ) : (
            <div className="cart-icon-box">{item.icon}</div>
          )}
          <div className="cart-info">
            <div className="cart-name">{item.name}</div>
            <div className="cart-qty">{item.brand && item.brand + ' · '}{item.qty}</div>
            <StarRating rating={item.rating} />
            {item.clubcardPrice && (
              <span style={{ fontSize: 10, color: 'white', background: '#1565C0', borderRadius: 4, padding: '1px 5px', fontWeight: 500, marginTop: 2, display: 'inline-block' }}>
                🔵 {item.clubcardPrice}
              </span>
            )}
            {item.selectionReason && (
              <div style={{ fontSize: 10, color: '#6B7280', marginTop: 3, fontStyle: 'italic' }}>
                🤖 {item.selectionReason}
              </div>
            )}
          </div>
          <div className="cart-item-price">£{parseFloat(item.price).toFixed(2)}</div>
          <button className="remove-btn" onClick={() => onRemove(i)}>×</button>
        </div>
      ))}
      <div className="cart-total-row">
        <span>Total</span>
        <strong>£{total.toFixed(2)}</strong>
      </div>
      <button className="main-btn" onClick={onCheckout}>
        {isReview ? '✅ Confirm & let agent pay →' : 'Proceed to payment →'}
      </button>
      <button className="back-btn" onClick={onBack}>← Start over</button>
    </div>
  );
}

export default Cart;