/**
 * SmartVenue — Google Pay Integration
 * Simulates pre-order flow with Google Pay checkout
 */

const Pay = (() => {
  let _activeItem = null;

  /**
   * Initialize Google Pay (Simulation)
   */
  const openCheckout = (itemId) => {
    _activeItem = CONFIG.MENU.find(i => i.id === itemId);
    if (!_activeItem) return;

    const modal = getEl('order-modal');
    const details = getEl('order-details');
    
    details.innerHTML = `
      <div style="display:flex; justify-content:space-between; margin-bottom:var(--sp-md);">
        <span>${_activeItem.icon} ${_activeItem.name}</span>
        <span style="font-weight:800;">₹${_activeItem.price}</span>
      </div>
      <p style="font-size:0.8rem; color:var(--gray-muted);">Pickup Stall: Pune Flavors (North Stand)</p>
    `;

    // Render Google Pay Button
    renderGooglePayButton();
    modal.hidden = false;
  };

  /**
   * Renders the branded Google Pay button
   */
  const renderGooglePayButton = () => {
    const container = getEl('gpay-button-container');
    container.innerHTML = `
      <button class="btn btn--white btn--full" style="background:#000; color:white; display:flex; gap:8px;" onclick="Pay.processPayment()">
        <img src="https://www.gstatic.com/instantbuy/svg/dark_gpay.svg" height="24" alt="Google Pay">
      </button>
    `;
  };

  /**
   * Simulates the Google Pay authorization flow
   */
  const processPayment = async () => {
    const btn = document.querySelector('#gpay-button-container button');
    if (btn) {
       btn.innerHTML = `Processing...`;
       btn.disabled = true;
    }

    Logger.info('Payment', 'Requesting Google Pay authorization...');
    
    // Simulate API Latency
    await new Promise(r => setTimeout(r, 1500));

    // Success flow
    Logger.info('Payment', 'Payment Authorised via Google Pay (TEST MODE)');
    
    // Log to Sheets
    await SheetsAPI.logOrder({
      item: _activeItem.name,
      price: _activeItem.price
    });

    handleSuccess();
  };

  const handleSuccess = () => {
    getEl('order-modal').hidden = true;
    
    // Generate pickup code (4 digits)
    const code = Math.floor(1000 + Math.random() * 9000);
    getEl('pickup-code').textContent = code;
    
    getEl('success-modal').hidden = false;
    showToast(`Order Placed! Your code is ${code}`, 'success');
  };

  return { openCheckout, processPayment };
})();
