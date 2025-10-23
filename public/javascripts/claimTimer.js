// profile starts 
  // for buying form(claim) timer at profile... scripts starts here
  const timers = document.querySelectorAll('.timer');
  timers.forEach(timer => {
    const createdAt = new Date(timer.dataset.createdat);
    const endTime = new Date(createdAt.getTime() + 1 * 60 * 1000);
    const formId = timer.dataset.formid;
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
        fetch(`/home/admin/move-buying-form/${formId}`, {
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
    
  // for claimTimer(claim) scripts at profile and claim cart starts here
    const claimTimers = document.querySelectorAll('.claimTimer');
    claimTimers.forEach(timer => {
    const createdAt = new Date(timer.dataset.createdat);
    const endTime = new Date(createdAt.getTime() + 1 * 60 * 1000);
    const formId = timer.dataset.claimformid;
    const progressBar = timer.nextElementSibling.querySelector('.claimProgress');

    function updateTimer() {
      const now = new Date();
      const diff = endTime - now;
      const total = 1 * 60 * 1000;
      if(diff <= 0) {
        timer.textContent = 'Time Over';
        timer.classList.add('over');
        progressBar.style.width = '0%';
        // move automatically
        // fetch(`/home/admin/move-buying-form/${formId}`, {
        //   method: 'POST'
        // }).then(res => {
        //   if(res.ok) {
        //     console.log('Product moved to buying cart automatically!');
        //     location.reload();
        //   }
        // });
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
  // for claimTimer script at profile and claim cart ends here
  // for claim page filters
  function submitFilters() {
    document.getElementById('autoFilterForm').submit();
  }

  function confirmDelete() {
    return confirm('Are you sure you want to delete this buying form? This action cannot be undone!')
  }

  let openSection = null;
  function toggleView(id) {
    const section = document.getElementById(id);

    if(openSection && openSection !== section) {
      openSection.style.maxHeight = 0;
      openSection.classList.remove('open');
    }

    if(section.classList.contains('open')) {
      section.style.maxHeight = 0;
      section.classList.remove('open');
      openSection = null;
    } else {
      section.classList.add('open');
      section.style.maxHeight = section.scrollHeight + 'px';
      openSection = section;
    }
  }