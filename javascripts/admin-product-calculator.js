
function calculate() {
  const op = parseFloat(document.getElementById('originalPrice').value);
  if (isNaN(op)) return;

  const seller = op - (op * 0.025);
  const likhFemale = op * 0.07;
  const likhMale = op * 0.08;
  const siteLikhFemale = seller * 0.067;
  const siteLikhMale = seller * 0.077;
  const brokerCost = op * 0.015;
  const ourCost = op * 0.008;
  const saved = brokerCost - ourCost;

  const brokerFinalFemale = op + likhFemale + brokerCost;
  const brokerFinalMale = op + likhMale + brokerCost;
  const finalFemale = op + likhFemale + ourCost;
  const finalMale = op + likhMale + ourCost;
  const siteDealFemale = seller + siteLikhFemale;
  const siteDealMale = seller + siteLikhMale;
  const profitFemale = finalFemale - siteDealFemale;
  const profitMale = finalMale - siteDealMale;

  document.getElementById('result').innerHTML = `
    <strong>Seller Price:</strong> ₹${seller.toFixed(2)}<br>
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
}
