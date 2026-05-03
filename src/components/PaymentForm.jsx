import { useState } from 'react';

function PaymentForm({ total, onSuccess, onBack }) {
  const [form, setForm] = useState({ name: '', address: '', card: '', expiry: '', cvv: '' });

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const formatCard = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 16);
    e.target.value = v.replace(/(.{4})/g, '$1 ').trim();
    handle(e);
  };

  const formatExpiry = (e) => {
    let v = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (v.length >= 2) v = v.slice(0, 2) + '/' + v.slice(2);
    e.target.value = v;
    handle(e);
  };

  const submit = () => {
  if (!form.name || !form.address || !form.card) {
    alert('Please fill in name, address and card number.');
    return;
  }
  onSuccess(form.address);
  };

  return (
    <div className="payment-form">
      <h2>Payment</h2>
      <div className="order-summary">
        <span>Total to pay</span>
        <strong>£{total}</strong>
      </div>
      <div className="field">
        <label>Full name</label>
        <input name="name" placeholder="Jane Smith" onChange={handle} />
      </div>
      <div className="field">
        <label>Delivery address</label>
        <input name="address" placeholder="123 Baker St, London" onChange={handle} />
      </div>
      <div className="field">
        <label>Card number</label>
        <input name="card" placeholder="4242 4242 4242 4242" onChange={formatCard} maxLength={19} />
      </div>
      <div className="row2">
        <div className="field">
          <label>Expiry</label>
          <input name="expiry" placeholder="MM/YY" onChange={formatExpiry} maxLength={5} />
        </div>
        <div className="field">
          <label>CVV</label>
          <input name="cvv" placeholder="123" onChange={handle} maxLength={3} />
        </div>
      </div>
      <button className="main-btn" onClick={submit}>Place order</button>
      <button className="back-btn" onClick={onBack}>← Back to cart</button>
      <p className="note">This is a demo. No real payment is processed.</p>
    </div>
  );
}

export default PaymentForm;