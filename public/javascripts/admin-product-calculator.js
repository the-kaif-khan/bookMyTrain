
document.getElementById('sellerPrice').addEventListener('input', function () {
  const sp = parseFloat(this.value);
  const results = document.getElementById('result');
  if (isNaN(sp)) {
    results.innerHTML = "";
    return;
  }



  const sellerPrice = sp;
  const likhFemale = sp * 0.07;
  const likhMale = sp * 0.08;
  const siteLikhFemale = sp * 0.067;
  const siteLikhMale = sp * 0.077;
  const brokerCost = sp * 0.038;
  const ourCost = sp * 0.023;
  const saved = sp * 0.015;

  const brokerFinalFemale = sp + likhFemale + brokerCost;
  const brokerFinalMale = sp + likhMale + brokerCost;
  const finalFemale = sp + likhFemale + ourCost;
  const finalMale = sp + likhMale + ourCost;
  const siteDealFemale = sp + siteLikhFemale;
  const siteDealMale = sp + siteLikhMale;
  const profitFemale = finalFemale - siteDealFemale;
  const profitMale = finalMale - siteDealMale;

  document.getElementById('result').innerHTML = `
    <strong>Seller Price:</strong> ₹${sellerPrice.toFixed(2)}<br>
    <strong>Likhwayi + Regn (Female):</strong> ₹${likhFemale.toFixed(2)}<br>
    <strong>Likhwayi + Regn (Male):</strong> ₹${likhMale.toFixed(2)}<br>
    <strong>Site Likhwayi + Regn (Female):</strong> ₹${siteLikhFemale.toFixed(2)}<br>
    <strong>Site Likhwayi + Regn (Male):</strong> ₹${siteLikhMale.toFixed(2)}<br>
    <strong>Broker Cost:</strong> ₹${brokerCost.toFixed(2)}<br>
    <strong>Our Cost:</strong> ₹${ourCost.toFixed(2)}<br>
    <strong>Customer Saved:</strong> ₹${saved.toFixed(2)}<br>
    <strong>Broker Final Price (Female):</strong> ₹${brokerFinalFemale.toFixed(2)}<br>
    <strong>Broker Final Price (Male):</strong> ₹${brokerFinalMale.toFixed(2)}<br>
    <strong>Final Price (Female):</strong> ₹${finalFemale.toFixed(2)}<br>
    <strong>Final Price (Male):</strong> ₹${finalMale.toFixed(2)}<br>
    <strong>Site Deal (Female):</strong> ₹${siteDealFemale.toFixed(2)}<br>
    <strong>Site Deal (Male):</strong> ₹${siteDealMale.toFixed(2)}<br>
    <strong>Profit (Female):</strong> ₹${profitFemale.toFixed(2)}<br>
    <strong>Profit (Male):</strong> ₹${profitMale.toFixed(2)}
  `;
})

// function calculate() {
//   const sp = parseFloat(document.getElementById('sellerPrice').value);
//   if (isNaN(sp)) return;
