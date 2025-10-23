    // for bayana giving claimed people(claim) timer... scripts starts here
    const timers = document.querySelectorAll('.timer');
    timers.forEach(timer => {
      const createdAt = new Date(timer.dataset.createdat);
      const endTime = new Date(createdAt.getTime() + 1 * 60 * 1000);
      const formId = timer.dataset.formid;
      const bayanaformid = timer.dataset.bayanaformid;
      const progressBar = timer.nextElementSibling.querySelector('.progress');

      function updateTimer() {
        const now = new Date();
        const diff = endTime - now;
        const total = 1 * 60 * 1000;
        if(diff <= 0) {
          timer.textContent = 'Time Over';
          timer.classList.add('over');
          progressBar.style.width = '0%';
          // move automatically
          fetch(`/landbook-query-house/admin/deleting-bayana-forms/${bayanaformid}`, {
            method: 'POST'
          }).then(res => {
            if(res.ok) {
              console.log('Product moved to buying cart automatically!');
              location.reload();
            }
          });
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          timer.textContent = `${hours}hr ${minutes}min ${seconds}sec`;
          // update progress bar
          const percentage = (diff / total) * 100;
          progressBar.style.width = `${percentage}`;
        }
      }
      setInterval(updateTimer, 1000);
      updateTimer();
    })


    // for buying cart timer people(buying cart)... for user-buying-cart-timers-page and queryhouse-user-bayana-forms page scripts starts here
    const buyingCartTimers = document.querySelectorAll('.buyingCartTimer');
    buyingCartTimers.forEach(timer => {
      const createdAt = new Date(timer.dataset.createdat);
      const endTime = new Date(createdAt.getTime() + 60 * 60 * 1000);
      const buyingCartTimerId = timer.dataset.buyingcarttimerid;
      const progressBar = timer.nextElementSibling.querySelector('.buyingCartProgress');

      function updateTimer() {
        const now = new Date();
        const diff = endTime - now;
        const total = 60 * 60 * 1000;
        if(diff <= 0) {
          timer.textContent = 'Time Over';
          timer.classList.add('over');
          progressBar.style.width = '0%';
          // move automatically
          fetch(`/home/admin/modify-buying-products/${buyingCartTimerId}`, {
            method: 'POST'
          }).then(res => {
            if(res.ok) {
              console.log('Product moved to buying cart automatically!');
              location.reload();
            }
          });
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          timer.textContent = `${hours}hr ${minutes}min ${seconds}sec`;
          // update progress bar
          const percentage = (diff / total) * 100;
          progressBar.style.width = `${percentage}`;
        }
      }
      setInterval(updateTimer, 1000);
      updateTimer();
    })

    function confirmDeleteModificationForm() {
      return confirm('Are you sure you want to remove this product from your buying cart? This action will result to remove all the fast-pace-buying process by Landbook for you and if you wanna buy this land again, then you have to go through same buying process from start eg. first add this product to claim cart(if this product is not already in your cart) then the process of claim cart timers and everything! This action cannot be undone! ');
    }

    function confirmDeleteForm() {
      return confirm('Are you sure you want to remove this product from your buying cart? This action will result to remove all the fast-pace-buying process by Landbook for you and if you wanna buy this land again, then you have to go through same buying process from start eg. first add this product to claim cart(if this product is not already in your cart) then the process of claim cart timers and everything! This action cannot be undone! ');
    }
    // for buying cart timer people timer ends here