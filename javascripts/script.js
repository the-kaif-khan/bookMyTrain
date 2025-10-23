
document.getElementById('originalPrice').addEventListener('input', function () {
  const price = parseFloat(this.value);
  const results = document.getElementById('results');
  if (isNaN(price)) {
    results.innerHTML = "";
    return;
  }

  const sellerPrice = price - price * 0.025;
  const realPrice = price + 100000;
  const likhwayiFemale = price * 0.07;
  const likhwayiMale = price * 0.08;
  const brokerCost = price * 0.015;
  const ourCost = price * 0.008;
  const customerSaved = brokerCost - ourCost;

  const finalBrokerMale = price + likhwayiMale + brokerCost;
  const finalBrokerFemale = price + likhwayiFemale + brokerCost;

  const realFinalPrice = realPrice + likhwayiFemale + ourCost;
  const finalMale = price + likhwayiMale + ourCost;
  const finalFemale = price + likhwayiFemale + ourCost;
  const siteDealFemale = sellerPrice + sellerPrice * 0.068;
  const siteDealMale = sellerPrice + sellerPrice * 0.078;
  const profitMale = finalMale - siteDealMale;
  const profitFemale = finalFemale - siteDealFemale;

  results.innerHTML = `
    <div>Seller Price: ₹${sellerPrice.toFixed(2)}</div>
    <div>Real Final Price: ₹${realFinalPrice.toFixed(2)}</div>
    <div>Likhwayi (Female): ₹${likhwayiFemale.toFixed(2)}</div>
    <div>Likhwayi (Male): ₹${likhwayiMale.toFixed(2)}</div>
    <div>Broker Cost: ₹${brokerCost.toFixed(2)}</div>
    <div>Our Cost: ₹${ourCost.toFixed(2)}</div>
    <div>Customer Saved: ₹${customerSaved.toFixed(2)}</div>
    <div>Broker Final Price (Male): ₹${finalBrokerMale.toFixed(2)}</div>
    <div>Broker Final Price (Female): ₹${finalBrokerFemale.toFixed(2)}</div>
    <div>Final Price (Male): ₹${finalMale.toFixed(2)}</div>
    <div>Final Price (Female): ₹${finalFemale.toFixed(2)}</div>
    <div>Site Deal (Female): ₹${siteDealFemale.toFixed(2)}</div>
    <div>Site Deal (Male): ₹${siteDealMale.toFixed(2)}</div>
    <div>Profit (Male): ₹${profitMale.toFixed(2)}</div>
    <div>Profit (Female): ₹${profitFemale.toFixed(2)}</div>
  `;
});
