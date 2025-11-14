    // for error input
    const errorMsg = document.getElementById('error');

    const sellerPrice = document.getElementById('sellerPrice');
    const landbookPrice = document.getElementById('landbookPrice');
    const brokerPrice = document.getElementById('brokerPrice');
    const form = document.getElementById('form');
    const flash = document.getElementById('flash');
    let isPriceValid = false;
    
    sellerPrice.addEventListener('input', () => {
      const val = parseFloat(sellerPrice.value) || 0;

    const value = sellerPrice.value.trim();

    const validFormat = /^\d{1,5}(\.\d{1,2})?$/;
    const numValue = parseFloat(value);
    if(!validFormat.test(value) || isNaN(numValue) || numValue > 99999) {
      errorMsg.style.display = 'block';
      sellerPrice.style.border = '2px solid red';
      landbookPrice.style.border = '2px solid red';     
      brokerPrice.style.border = '2px solid red';
      isPriceValid = false;
    } else {
      errorMsg.style.display = 'none';
      sellerPrice.style.display = '2px solid green';
      isPriceValid = true;

      const likhFemale = val * 0.07;
      const ourCost = val * 0.023;
      const brokerCost = val * 0.038;
      const brokerFinalFemale = val + likhFemale + brokerCost;
      const finalFemale = val + likhFemale + ourCost;

      landbookPrice.value = finalFemale.toFixed(2);
      brokerPrice.value = brokerFinalFemale.toFixed(2);
    }
    form.addEventListener('submit', (e) => {
      if(!isPriceValid) {
        e.preventDefault();
        showFlash('Please enter a valid price in Lakhs format before submitting! Note: If user wants to give seller price as 34 lakhs 21 thousand then enter: 34.21. If user wants to add price in crores (3 crores 25 lakhs) then enter: 325 only. If user wants to enter seller price as 3 crore 25 lakhs 50 thousand then enter: 325.50. If user wants seller price as 12 crore 25 lakhs then enter: 1225 only. If user wants seller price as 12 crores 25 lakhs 30 thousand then enter: 1225.30 only.')
      }
    });
    function showFlash(message) {
      flash.innerHTML = message;
      flash.style.display = 'block';
      setTimeout(() => {
        flash.style.transition = 'opacity 0.6s';
        flash.style.opacity = '0';
      }, 50000);
      setTimeout(() => {
        flash.style.display = 'none';
        flash.style.opacity = '1';
      }, 50500);
    }

    });