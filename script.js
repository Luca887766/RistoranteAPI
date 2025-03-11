// JSON LOADING FUNCTIONS
function caricaJSON(file) {
  return fetch(file)
    .then(response => response.json())
    .catch(error => console.error('Errore nel caricamento del JSON:', error));
}

// NAVIGATION FUNCTIONS
function mostraSezione(idSezione) {
  clearPollingIntervals();

  const sezioni = document.querySelectorAll('.sezione-contenuto');
  sezioni.forEach(sezione => {
    sezione.classList.remove('fade-in');
    sezione.classList.add('fade-out');
  });

  setTimeout(() => {
    sezioni.forEach(sezione => {
      sezione.style.display = 'none';
    });

    const sezioneAttiva = document.getElementById(idSezione);
    if (sezioneAttiva) {
      sezioneAttiva.style.display = 'block';
      sezioneAttiva.classList.remove('fade-out');
      setTimeout(() => {
        sezioneAttiva.classList.add('fade-in');
      }, 50);
      
      if (idSezione === 'prenotazioni') {
        const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
        const loginRegisterContainer = document.getElementById('login-register-container');
        if (loginRegisterContainer) {
          loginRegisterContainer.style.display = isLoggedIn ? 'none' : 'block';
        }
        
        updateReservationSection();
      } else {
        const loginRegisterContainer = document.getElementById('login-register-container');
        if (loginRegisterContainer) {
          loginRegisterContainer.style.display = 'none';
        }
      }
    }
  }, 300);
}

let adminPollingInterval = null;
let clientPollingInterval = null;

// RESERVATION SYSTEM FUNCTIONS
function updateReservationSection() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const username = localStorage.getItem('username');
  const isAdmin = username === 'admin';

  clearPollingIntervals();

  const loginContainer = document.getElementById('login-register-container');
  const clientArea = document.getElementById('client-area');
  const adminDashboard = document.getElementById('admin-dashboard');
  const authContainer = document.querySelector('.auth-container');
  const prenotazioneContainer = document.querySelector('#prenotazioni');

  if (authContainer) {
    if (!isLoggedIn) {
      authContainer.style.display = 'flex';
      if (prenotazioneContainer) {
        prenotazioneContainer.classList.add('login-active');
      }
    } else {
      authContainer.style.display = 'none';
      if (prenotazioneContainer) {
        prenotazioneContainer.classList.remove('login-active');
      }
    }
  }
  
  if (loginContainer) {
    if (!isLoggedIn) {
      loginContainer.style.display = 'block';
      if (prenotazioneContainer) {
        prenotazioneContainer.classList.add('login-active');
      }
    } else {
      loginContainer.style.display = 'none';
      if (prenotazioneContainer) {
        prenotazioneContainer.classList.remove('login-active');
      }
    }
  }
  
  if (clientArea) {
    clientArea.style.display = (isLoggedIn && !isAdmin) ? 'block' : 'none';
  }
  
  if (adminDashboard) {
    adminDashboard.style.display = (isLoggedIn && isAdmin) ? 'block' : 'none';
    if (isLoggedIn && isAdmin) {
      adminDashboard.classList.add('admin-calendar-fullwidth');
    }
  }

  if (isLoggedIn) {
    if (isAdmin) {
      fetchAdminReservations();
      adminPollingInterval = setInterval(fetchAdminReservations, 5000);
    } else {
      fetchClientReservations();
      clientPollingInterval = setInterval(fetchClientReservations, 5000);
    }
  }
  
  if (isLoggedIn && !isAdmin) {
    initializeReservationForm();
    
    const pendingEventData = sessionStorage.getItem('eventToBook');
    if (pendingEventData) {
      const evento = JSON.parse(pendingEventData);
      fillReservationFormWithEventData(evento);
      sessionStorage.removeItem('eventToBook');
    }
  }
}

function clearPollingIntervals() {
  if (adminPollingInterval) {
    clearInterval(adminPollingInterval);
    adminPollingInterval = null;
  }
  
  if (clientPollingInterval) {
    clearInterval(clientPollingInterval);
    clientPollingInterval = null;
  }
}

function initializeReservationForm() {
  const dateInput = document.getElementById('data');
  if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedTomorrow = tomorrow.toISOString().split('T')[0];
    dateInput.min = formattedTomorrow;
    
    const pendingEventData = sessionStorage.getItem('eventToBook');
    if (pendingEventData) {
      try {
        const evento = JSON.parse(pendingEventData);
        const eventDate = new Date(evento.data);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (eventDate > today && eventDate.toISOString().split('T')[0] !== today.toISOString().split('T')[0]) {
          dateInput.value = eventDate.toISOString().split('T')[0];
          checkAndUpdateAvailableDates(dateInput.value);
        } else {
          dateInput.value = formattedTomorrow;
        }
      } catch (error) {
        dateInput.value = formattedTomorrow;
      }
    } else {
      dateInput.value = formattedTomorrow;
    }
    
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    dateInput.max = maxDate.toISOString().split('T')[0];
    
    dateInput.addEventListener('change', function(event) {
      checkDateAvailability(event);
    });
    
    checkAndUpdateAvailableDates(dateInput.value);
    startAvailabilityChecks();
  }
  
  const timeSelect = document.getElementById('ora');
  const dateSelect = document.getElementById('data');
  if (timeSelect && dateSelect) {
    timeSelect.addEventListener('change', function() {
      const date = dateSelect.value;
      const time = timeSelect.value;
      if (date && time) {
        checkTimeSlotAvailability(date, time);
      }
    });
  }
  
  const nomeInput = document.getElementById('nome');
  if (nomeInput) {
    const username = localStorage.getItem('username');
    if (username) {
      nomeInput.value = username;
    }
  }
}

function startAvailabilityChecks() {
  setInterval(function() {
    const dateInput = document.getElementById('data');
    if (dateInput && dateInput.value) {
      checkAndUpdateAvailableDates(dateInput.value);
    }
  }, 30000);
}

function checkAndUpdateAvailableDates(selectedDate) {
  const startDate = new Date(selectedDate);
  const endDate = new Date(selectedDate);
  endDate.setDate(endDate.getDate() + 7);
  
  const formattedStart = startDate.toISOString().split('T')[0];
  const formattedEnd = endDate.toISOString().split('T')[0];
  
  fetch(`api.php?action=check_date_range_availability&start=${encodeURIComponent(formattedStart)}&end=${encodeURIComponent(formattedEnd)}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.error(data.error);
        return;
      }
      
      window.fullyBookedDates = data.fullyBookedDates || [];
      
      const dateInput = document.getElementById('data');
      if (dateInput && window.fullyBookedDates.includes(dateInput.value)) {
        const error = document.getElementById('reservation-error');
        if (error) error.textContent = 'La data selezionata è al completo. Scegli un\'altra data.';
        
        const availableDates = getAvailableDates(data.dateAvailability);
        if (availableDates.length > 0) {
          dateInput.value = availableDates[0];
        } else {
          dateInput.value = '';
        }
      }
    })
    .catch(err => console.error('Error checking date availability:', err));
}

function getAvailableDates(dateAvailability) {
  const availableDates = [];
  
  for (const date in dateAvailability) {
    if (dateAvailability[date] === true) {
      availableDates.push(date);
    }
  }
  
  return availableDates.sort();
}

function checkDateAvailability(event) {
  const date = event.target.value;
  const error = document.getElementById('reservation-error');
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate <= today) {
    if (error) error.textContent = 'Non è possibile prenotare per oggi o per date passate. Scegli una data futura.';
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    event.target.value = tomorrow.toISOString().split('T')[0];
    return;
  }
  
  if (window.fullyBookedDates && window.fullyBookedDates.includes(date)) {
    if (error) error.textContent = 'Il ristorante è al completo per questa data. Scegli un\'altra data.';
    event.target.value = '';
    return;
  }
  
  fetch(`api.php?action=check_date_availability&date=${encodeURIComponent(date)}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        if (error) error.textContent = data.error;
        event.target.value = '';
      } else if (data.available === false) {
        if (error) error.textContent = 'Il ristorante è al completo per questa data. Scegli un\'altra data.';
        event.target.value = '';
        
        if (!window.fullyBookedDates) window.fullyBookedDates = [];
        if (!window.fullyBookedDates.includes(date)) {
          window.fullyBookedDates.push(date);
        }
      } else {
        if (error) error.textContent = '';
        
        if (window.fullyBookedDates && window.fullyBookedDates.includes(date)) {
          window.fullyBookedDates = window.fullyBookedDates.filter(d => d !== date);
        }
      }
    })
    .catch(err => console.error('Error checking date availability:', err));
}

function checkTimeSlotAvailability(date, time) {
  const persone = document.getElementById('persone').value || 1;
  const error = document.getElementById('reservation-error');
  
  fetch(`api.php?action=check_timeslot_availability&date=${encodeURIComponent(date)}&time=${encodeURIComponent(time)}&persone=${encodeURIComponent(persone)}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        if (error) error.textContent = data.error;
      } else if (data.available === false) {
        if (error) error.textContent = `Non c'è disponibilità per ${persone} persone alle ${time}. Prova un altro orario o riduci il numero di persone.`;
        document.getElementById('ora').value = '';
      } else {
        if (error) error.textContent = '';
      }
    })
    .catch(err => console.error('Error checking timeslot availability:', err));
}

// Create reservation form handler
function setupReservationForm() {
  const form = document.getElementById('reservation-form');
  const error = document.getElementById('reservation-error');
  
  if (form) {
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    newForm.addEventListener('submit', function(event) {
      event.preventDefault();
      
      if (error) error.textContent = '';
      
      const nome = document.getElementById('nome').value;
      const data = document.getElementById('data').value;
      const ora = document.getElementById('ora').value;
      const persone = document.getElementById('persone').value;
      const contatto = document.getElementById('contatto').value;
      
      if (!nome || !data || !ora || !persone || !contatto) {
        if (error) error.textContent = 'Tutti i campi sono obbligatori';
        return;
      }
      
      if (persone < 1 || persone > 20) {
        if (error) error.textContent = 'Il numero di persone deve essere tra 1 e 20';
        return;
      }
      
      fetch(`api.php?action=check_timeslot_availability&date=${data}&time=${ora}&persone=${persone}`)
        .then(response => response.json())
        .then(checkResult => {
          if (checkResult.error) {
            if (error) error.textContent = checkResult.error;
            return;
          }
          
          if (checkResult.available === false) {
            if (error) error.textContent = `Non c'è disponibilità per ${persone} persone alle ${ora}. Prova un altro orario o riduci il numero di persone.`;
            return;
          }
          
          const body = new URLSearchParams();
          body.append('nome', nome);
          body.append('data', data);
          body.append('ora', ora);
          body.append('persone', persone);
          body.append('contatto', contatto);
          
          fetch('api.php?action=create_reservation', {
            method: 'POST',
            headers: {'Content-Type': 'application/x-www-form-urlencoded'},
            body: body.toString()
          })
          .then(response => response.json())
          .then(data => {
            if (data.success) {
              showToast('Prenotazione effettuata con successo', 'success');
              newForm.reset();
              fetchClientReservations();
            } else {
              showToast(data.error || 'Errore durante la prenotazione', 'error');
              if (error) error.textContent = data.error || 'Errore durante la prenotazione';
            }
          })
          .catch(error => {
            console.error('Error creating reservation:', error);
            if (error) error.textContent = 'Errore di connessione. Riprova più tardi.';
          });
        })
        .catch(err => {
          console.error('Error checking availability:', err);
          if (error) error.textContent = 'Errore di connessione. Riprova più tardi.';
        });
    });
    
    const personeInput = document.getElementById('persone');
    if (personeInput) {
      const newPersoneInput = personeInput.cloneNode(true);
      personeInput.parentNode.replaceChild(newPersoneInput, personeInput);
      
      newPersoneInput.addEventListener('change', function() {
        const value = parseInt(this.value);
        if (value > 20) {
          this.value = 20;
          showToast('Il numero massimo di persone per prenotazione è 20', 'info');
        }
        
        const date = document.getElementById('data').value;
        const time = document.getElementById('ora').value;
        if (date && time) {
          checkTimeSlotAvailability(date, time);
        }
      });
    }
  }
}

// Admin reservation management
function fetchAdminReservations() {
  // If we have a selected date in the hourly view, use that, otherwise use today
  const dateToUse = window.currentHourlyViewDate || new Date();
  
  fetch('api.php?action=get_reservations')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        if (!adminPollingInterval) {
          alert(data.error);
        }
        return;
      }
      
      // Instead of sorting the reservations here, call updateReservationTablesForDate
      updateReservationTablesForDate(dateToUse);
      
      // Setup hourly view after fetching reservations
      setupHourlyView();
    })
    .catch(error => console.error('Error fetching reservations:', error));
}

function populateReservationTable(tableId, reservations) {
  const tableBody = document.querySelector(`#${tableId} tbody`);
  if (!tableBody) return;
  
  while (tableBody.firstChild) {
    tableBody.removeChild(tableBody.firstChild);
  }
  
  if (reservations.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');
    cell.colSpan = 6;
    cell.textContent = 'Nessuna prenotazione trovata';
    cell.className = 'no-reservations';
    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  reservations.forEach(reservation => {
    const row = document.createElement('tr');
    
    const nameCell = document.createElement('td');
    nameCell.textContent = reservation.nome_cliente;
    row.appendChild(nameCell);
    
    const dateCell = document.createElement('td');
    dateCell.textContent = reservation.data;
    row.appendChild(dateCell);
    
    const timeCell = document.createElement('td');
    timeCell.textContent = reservation.ora;
    row.appendChild(timeCell);
    
    const peopleCell = document.createElement('td');
    peopleCell.textContent = reservation.persone;
    row.appendChild(peopleCell);
    
    const contactCell = document.createElement('td');
    contactCell.textContent = reservation.contatto;
    row.appendChild(contactCell);
    
    const actionsCell = document.createElement('td');
    
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Modifica';
    editBtn.className = 'edit-btn';
    editBtn.dataset.id = reservation.id;
    editBtn.addEventListener('click', function() {
      editReservation(this.dataset.id);
    });
    actionsCell.appendChild(editBtn);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Elimina';
    deleteBtn.className = 'delete-btn';
    deleteBtn.dataset.id = reservation.id;
    deleteBtn.addEventListener('click', function() {
      showConfirmation('Sei sicuro di voler eliminare questa prenotazione?', () => {
        deleteReservation(this.dataset.id);
      });
    });
    actionsCell.appendChild(deleteBtn);
    
    row.appendChild(actionsCell);
    tableBody.appendChild(row);
  });
}

// Client reservation display
function fetchClientReservations() {
  fetch('api.php?action=get_user_reservations')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.error(data.error);
        return;
      }

      const container = document.getElementById('client-reservations-container');
      if (!container) return;
      
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }

      if (data.length === 0) {
        const noReservationsMsg = document.createElement('p');
        noReservationsMsg.textContent = 'Non hai ancora effettuato prenotazioni.';
        container.appendChild(noReservationsMsg);
        return;
      }

      data.forEach(reservation => {
        const card = document.createElement('div');
        card.classList.add('reservation-card');
        
        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('reservation-details');
        
        const heading = document.createElement('h4');
        heading.textContent = `Prenotazione per ${reservation.persone} persone`;
        detailsDiv.appendChild(heading);
        
        const dateTimePara = document.createElement('p');
        dateTimePara.textContent = `Data: ${reservation.data} alle ${reservation.ora}`;
        detailsDiv.appendChild(dateTimePara);
        
        const namePara = document.createElement('p');
        namePara.textContent = `Nome: ${reservation.nome_cliente}`;
        detailsDiv.appendChild(namePara);
        
        const contactPara = document.createElement('p');
        contactPara.textContent = `Contatto: ${reservation.contatto}`;
        detailsDiv.appendChild(contactPara);
        
        card.appendChild(detailsDiv);
        
        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('reservation-actions');
        
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Cancella';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.dataset.id = reservation.id;
        deleteBtn.addEventListener('click', function() {
          showConfirmation('Sei sicuro di voler cancellare questa prenotazione?', () => {
            deleteReservation(this.dataset.id, true);
          });
        });
        
        actionsDiv.appendChild(deleteBtn);
        card.appendChild(actionsDiv);
        
        container.appendChild(card);
      });
    })
    .catch(error => console.error('Error fetching user reservations:', error));
}

// Edit reservation modal
function createFormRow(id, labelText, value, type, min, max) {
  const row = document.createElement('div');
  row.classList.add('form-row');
  
  const label = document.createElement('label');
  label.setAttribute('for', id);
  label.textContent = labelText;
  row.appendChild(label);
  
  const input = document.createElement('input');
  input.type = type;
  input.id = id;
  input.value = value;
  input.required = true;
  
  if (type === 'number') {
    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
  }
  
  row.appendChild(input);
  return row;
}

function editReservation(id) {
  fetch(`api.php?action=get_reservation&id=${encodeURIComponent(id)}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      const modal = document.createElement('div');
      modal.classList.add('modal');
      
      const modalContent = document.createElement('div');
      modalContent.classList.add('modal-content');
      
      const closeBtn = document.createElement('span');
      closeBtn.classList.add('close');
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      const title = document.createElement('h3');
      title.textContent = 'Modifica Prenotazione';
      
      const form = document.createElement('form');
      form.id = 'edit-form';
      
      const hiddenId = document.createElement('input');
      hiddenId.type = 'hidden';
      hiddenId.id = 'edit-id';
      hiddenId.value = data.id;
      form.appendChild(hiddenId);
      
      form.appendChild(createFormRow('edit-nome', 'Nome', data.nome_cliente, 'text'));
      form.appendChild(createFormRow('edit-data', 'Data', data.data, 'date'));
      form.appendChild(createFormRow('edit-ora', 'Ora', data.ora, 'time'));
      form.appendChild(createFormRow('edit-persone', 'Numero di persone', data.persone, 'number', 1, 20));
      form.appendChild(createFormRow('edit-contatto', 'Contatto', data.contatto, 'text'));
      
      const submitBtn = document.createElement('button');
      submitBtn.type = 'submit';
      submitBtn.textContent = 'Salva Modifiche';
      form.appendChild(submitBtn);
      
      form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = {
          id: document.getElementById('edit-id').value,
          nome_cliente: document.getElementById('edit-nome').value,
          data: document.getElementById('edit-data').value,
          ora: document.getElementById('edit-ora').value,
          persone: document.getElementById('edit-persone').value,
          contatto: document.getElementById('edit-contatto').value
        };
        
        updateReservation(formData, modal);
      });
      
      modalContent.appendChild(closeBtn);
      modalContent.appendChild(title);
      modalContent.appendChild(form);
      
      modal.appendChild(modalContent);
      document.body.appendChild(modal);
    })
    .catch(error => console.error('Error getting reservation details:', error));
}

function updateReservation(formData, modal) {
  const body = new URLSearchParams();
  for (const key in formData) {
    body.append(key, formData[key]);
  }
  
  fetch('api.php?action=update_reservation', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString()
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showToast('Prenotazione aggiornata con successo', 'success');
      document.body.removeChild(modal);
      fetchAdminReservations();
    } else {
      showToast(data.error || 'Errore durante l\'aggiornamento', 'error');
    }
  })
  .catch(error => console.error('Error updating reservation:', error));
}

function setupLogout() {
  const adminLogout = document.getElementById('admin-logout');
  const clientLogout = document.getElementById('client-logout');
  
  if (adminLogout) {
    const newAdminLogout = adminLogout.cloneNode(true);
    adminLogout.parentNode.replaceChild(newAdminLogout, adminLogout);
    newAdminLogout.addEventListener('click', logoutHandler);
  }
  
  if (clientLogout) {
    const newClientLogout = clientLogout.cloneNode(true);
    clientLogout.parentNode.replaceChild(newClientLogout, clientLogout);
    newClientLogout.addEventListener('click', logoutHandler);
  }
}

function logoutHandler() {
  clearPollingIntervals();
  
  fetch('api.php?action=logout')
    .then(response => response.json())
    .then(data => {
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('username');
      showToast('Logout effettuato con successo', 'success');
      
      document.querySelectorAll('form').forEach(form => {
        form.reset();
      });
      
      const formFields = ['nome', 'data', 'ora', 'persone', 'contatto'];
      formFields.forEach(field => {
        const element = document.getElementById(field);
        if (element) element.value = '';
      });
      
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      document.querySelectorAll('#SecondaBarraOrizzontale a').forEach(link => {
        link.classList.remove('selected');
      });
      document.querySelector('#SecondaBarraOrizzontale a[data-target="menu-giornaliero"]').classList.add('selected');
      mostraSezione('menu-giornaliero');
      
      updateReservationSection();
    })
    .catch(error => console.error('Error during logout:', error));
}

function caricaPrenotazioni() {
  setupReservationForm();
  setupLogout();
  updateReservationSection();
}

// MENU FUNCTIONS
async function caricaMenuGiornaliero() {
  try {
    const response = await fetch('./data/menu.json');
    const data = await response.json();

    const oggi = new Date().toLocaleString('it-IT', { weekday: 'long' }).toLowerCase();
    const menu = data.menù[oggi];
    const menuDiv = document.getElementById('menu-giornaliero');
    
    while (menuDiv.firstChild) {
      menuDiv.removeChild(menuDiv.firstChild);
    }

    if (!menu || !menu.piatti || menu.piatti.length === 0) {
      const noMenuMsg = document.createElement('p');
      noMenuMsg.textContent = `Non ci sono piatti disponibili per oggi (${oggi}).`;
      menuDiv.appendChild(noMenuMsg);
      return;
    }

    const titolo = document.createElement('h2');
    titolo.textContent = `Menù del Giorno (${oggi.charAt(0).toUpperCase() + oggi.slice(1)})`;
    menuDiv.appendChild(titolo);

    const piattiContainer = document.createElement('div');
    piattiContainer.classList.add('piatti-container');
    menuDiv.appendChild(piattiContainer);

    menu.piatti.forEach((piatto) => {
      const piattoDiv = document.createElement('div');
      piattoDiv.classList.add('piatto');
      piattoDiv.style.backgroundImage = `url(${piatto.immagine})`;

      const infoPiatto = document.createElement('div');
      infoPiatto.classList.add('info-piatto');

      const nomePiatto = document.createElement('h3');
      nomePiatto.textContent = piatto.nome;
      infoPiatto.appendChild(nomePiatto);

      const descrizionePiatto = document.createElement('p');
      descrizionePiatto.textContent = piatto.descrizione;
      infoPiatto.appendChild(descrizionePiatto);

      const prezzoPiatto = document.createElement('p');
      const priceLabel = document.createElement('strong');
      priceLabel.textContent = 'Prezzo:';
      prezzoPiatto.appendChild(priceLabel);
      prezzoPiatto.appendChild(document.createTextNode(` ${piatto.prezzo}`));
      infoPiatto.appendChild(prezzoPiatto);

      const arrowRight = document.createElement('div');
      arrowRight.classList.add('arrow-right');
      const rightArrow = document.createTextNode('\u25B6');
      arrowRight.appendChild(rightArrow);

      const arrowLeft = document.createElement('div');
      arrowLeft.classList.add('arrow-left');
      const leftArrow = document.createTextNode('\u25C0');
      arrowLeft.appendChild(leftArrow);

      arrowRight.addEventListener('click', (event) => {
        event.stopPropagation();
        piattoDiv.classList.add('show-info');
      });

      arrowLeft.addEventListener('click', (event) => {
        event.stopPropagation();
        piattoDiv.classList.remove('show-info');
      });

      piattoDiv.appendChild(infoPiatto);
      piattoDiv.appendChild(arrowRight);
      piattoDiv.appendChild(arrowLeft);

      piattiContainer.appendChild(piattoDiv);
    });
  } catch (error) {
    console.error('Errore nel caricamento del JSON:', error);
  }
}

// EVENTI FUNCTIONS
function mostraEventiFuturi(eventi) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  return eventi.filter(evento => {
    const dataEvento = new Date(evento.data);
    dataEvento.setHours(0, 0, 0, 0);
    return dataEvento >= oggi;
  });
}

function ordinaEventiPerData(eventi) {
  return eventi.sort((a, b) => {
    const dataA = new Date(a.data);
    const dataB = new Date(b.data);
    return dataA - dataB;
  });
}

function caricaEventi() {
  caricaJSON('./data/eventi.json').then(data => {
    const eventiDiv = document.getElementById('eventi');

    eventiDiv.innerHTML = '';
    const titolo = document.createElement('h2');
    titolo.innerText = "Eventi Speciali";
    eventiDiv.appendChild(titolo);

    const eventiOrdinati = ordinaEventiPerData(data.eventi);
    const eventiFuturi = mostraEventiFuturi(eventiOrdinati);

    const galleriaDiv = document.createElement('div');
    galleriaDiv.classList.add('galleria-eventi');

    eventiFuturi.forEach(evento => {
      const eventoDiv = document.createElement('div');
      eventoDiv.classList.add('evento');

      const immagineEvento = document.createElement('img');
      immagineEvento.src = evento.foto;
      immagineEvento.alt = `Immagine evento ${evento.nome}`;
      eventoDiv.appendChild(immagineEvento);

      const dataEvento = document.createElement('div');
      dataEvento.classList.add('data');
      dataEvento.innerText = evento.data;
      eventoDiv.appendChild(dataEvento);

      const bookButton = document.createElement('button');
      bookButton.classList.add('book-event-btn');
      bookButton.innerText = 'Prenota';
      bookButton.addEventListener('click', (e) => {
        e.stopPropagation();
        prenotaEvento(evento, e);
      });
      eventoDiv.appendChild(bookButton);

      const nomeEvento = document.createElement('div');
      nomeEvento.classList.add('nome-evento');
      nomeEvento.innerText = evento.nome;
      eventoDiv.appendChild(nomeEvento);

      const descrizioneEvento = document.createElement('div');
      descrizioneEvento.classList.add('descrizione');
      descrizioneEvento.innerText = evento.descrizione;
      eventoDiv.appendChild(descrizioneEvento);

      galleriaDiv.appendChild(eventoDiv);
    });

    eventiDiv.appendChild(galleriaDiv);
    
    setupContinuousStars();
  });
}

function prenotaEvento(evento, e) {
  const buttonElement = e.currentTarget;
  createStars(buttonElement);
  
  sessionStorage.setItem('eventToBook', JSON.stringify(evento));
  console.log("Event data saved:", evento);
  
  mostraSezione('prenotazioni');
  
  document.querySelectorAll('#SecondaBarraOrizzontale a').forEach(link => {
    link.classList.remove('selected');
  });
  document.querySelector('#SecondaBarraOrizzontale a[data-target="prenotazioni"]').classList.add('selected');
  
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (isLoggedIn) {
    setTimeout(() => {
      fillReservationFormWithEventData(evento);
    }, 300);
  }
}

function createStars(button) {
  const rect = button.getBoundingClientRect();
  const buttonWidth = rect.width;
  const buttonHeight = rect.height;
  
  for (let i = 0; i < 15; i++) {
    setTimeout(() => {
      const star = document.createElement('div');
      star.classList.add('star');
      
      const colors = ['#FFFFFF', '#FFD700', '#FFFACD', '#FFFFE0'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      star.style.backgroundColor = randomColor;
      
      const size = Math.random() * 4 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      const startX = rect.left + Math.random() * buttonWidth;
      const startY = rect.top + Math.random() * buttonHeight;
      star.style.left = `${startX}px`;
      star.style.top = `${startY}px`;
      
      const angle = Math.random() * Math.PI / 2 + Math.PI / 4;
      const distance = Math.random() * 100 + 50;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      star.style.setProperty('--tx', `${tx}px`);
      star.style.setProperty('--ty', `${ty}px`);
      
      document.body.appendChild(star);
      
      star.style.animation = `fall ${Math.random() * 1 + 0.5}s linear forwards`;
      
      setTimeout(() => {
        if (star.parentNode) {
          star.parentNode.removeChild(star);
        }
      }, 1500);
    }, i * 50);
  }
}

function setupContinuousStars() {
  const buttons = document.querySelectorAll('.book-event-btn');
  
  buttons.forEach(button => {
    const starsContainer = document.createElement('div');
    starsContainer.classList.add('stars-container');
    button.appendChild(starsContainer);
    
    function createContinuousStar() {
      if (!document.body.contains(button)) return;
      
      const rect = button.getBoundingClientRect();
      if (rect.width === 0) return;
      
      const star = document.createElement('div');
      star.classList.add('button-star');
      
      const size = Math.random() * 3 + 1;
      star.style.width = `${size}px`;
      star.style.height = `${size}px`;
      
      const startX = Math.random() * 100;
      const startY = Math.random() * 100;
      star.style.left = `${startX}%`;
      star.style.top = `${startY}%`;
      
      const colors = ['#FFFFFF', '#FFD700', '#FFFACD', '#FFFFE0'];
      star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      const angle = Math.random() * Math.PI / 2 + Math.PI / 4;
      const distance = 50 + Math.random() * 100;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;
      
      star.style.setProperty('--tx', `${tx}px`);
      star.style.setProperty('--ty', `${ty}px`);
      
      starsContainer.appendChild(star);
      
      const duration = 0.5 + Math.random() * 1;
      star.style.animation = `continuous-fall ${duration}s linear forwards`;
      
      setTimeout(() => {
        if (star && star.parentNode) {
          star.parentNode.removeChild(star);
        }
      }, duration * 1000);
    }
    
    let starInterval = null;
    
    button.addEventListener('mouseenter', () => {
      for (let i = 0; i < 5; i++) {
        setTimeout(createContinuousStar, i * 100);
      }
      
      starInterval = setInterval(() => {
        if (Math.random() < 0.5) createContinuousStar();
      }, 200);
    });
    
    button.addEventListener('mouseleave', () => {
      clearInterval(starInterval);
    });
  });
}

// CHEF FUNCTIONS
function caricaChef() {
  caricaJSON('./data/chef.json').then(data => {
    const chefDiv = document.getElementById('chef');

    chefDiv.innerHTML = '';
    const galleriaChef = document.createElement('div');
    galleriaChef.classList.add('galleria-chef');

    data.chef.forEach(chef => {
      const chefContainer = document.createElement('div');
      chefContainer.classList.add('chef');

      const chefImg = new Image();
      chefImg.src = chef.foto;
      chefImg.alt = `Foto di ${chef.nome}`;
      chefContainer.appendChild(chefImg);

      const nomeChef = document.createElement('div');
      nomeChef.classList.add('nome-chef');
      nomeChef.innerText = chef.nome;
      chefContainer.appendChild(nomeChef);

      const bioChef = document.createElement('div');
      bioChef.classList.add('bio');
      bioChef.innerText = chef.bio;
      chefContainer.appendChild(bioChef);

      galleriaChef.appendChild(chefContainer);
    });

    chefDiv.appendChild(galleriaChef);
  }).catch(error => {
    console.error("Errore nel caricamento del JSON", error);
  });
}

// NAVIGATION MAPPING
const funzionePerTarget = {
  'menu-giornaliero': caricaMenuGiornaliero,
  'eventi': caricaEventi,
  'chef': caricaChef,
  'prenotazioni': caricaPrenotazioni,
};

// LAYOUT AND STRUCTURE FUNCTIONS
function generaBarraOrizzontale() {
  const barraOrizzontale = document.querySelector('.BarraOrizzontale');
  
  while (barraOrizzontale.firstChild) {
    barraOrizzontale.removeChild(barraOrizzontale.firstChild);
  }
  
  const container = document.createElement('div');
  container.classList.add('container');

  const div1 = document.createElement('div');
  const img1 = document.createElement('img');
  img1.src = './img/stella.webp';
  img1.alt = 'Stella';
  img1.classList.add('Logo');
  div1.appendChild(img1);

  const div2 = document.createElement('div');
  const h1 = document.createElement('h1');
  h1.classList.add('titolo');
  h1.textContent = 'Il Gusto delle Stelle';
  div2.appendChild(h1);

  const div3 = document.createElement('div');
  const img2 = document.createElement('img');
  img2.src = './img/stella.webp';
  img2.alt = 'Stella';
  img2.classList.add('Logo');
  div3.appendChild(img2);

  container.appendChild(div1);
  container.appendChild(div2);
  container.appendChild(div3);

  barraOrizzontale.appendChild(container);

  const pagesDiv = document.createElement('div');
  pagesDiv.classList.add('pages');

  const links = [
    { href: 'index.html', text: 'Home' },
    { href: 'Chi_siamo.html', text: 'Chi siamo' },
    { href: 'Cantina.html', text: 'La nostra cantina' }
  ];

  links.forEach(link => {
    const linkDiv = document.createElement('div');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    linkDiv.appendChild(a);
    pagesDiv.appendChild(linkDiv);
  });

  barraOrizzontale.appendChild(pagesDiv);
}

function generaFooter() {
  Promise.all([
    fetch('./data/posizione.json').then(response => response.json()),
    fetch('./data/social.json').then(response => response.json())
  ])
  .then(([posizioneData, socialData]) => {
    const footer = document.querySelector('footer');
    
    while (footer.firstChild) {
      footer.removeChild(footer.firstChild);
    }

    const contattiSection = document.createElement('div');
    contattiSection.classList.add('footer-section');
    
    const contattiTitle = document.createElement('h3');
    contattiTitle.textContent = 'Contatti';
    contattiSection.appendChild(contattiTitle);

    const telefono = document.createElement('p');
    telefono.textContent = 'Telefono: +39 123 456 789';
    contattiSection.appendChild(telefono);

    const email = document.createElement('p');
    email.textContent = 'Email: info@ristorante.com';
    contattiSection.appendChild(email);

    const indirizzo = document.createElement('p');
    indirizzo.textContent = `Indirizzo: ${posizioneData.posizione.indirizzo}`;
    contattiSection.appendChild(indirizzo);

    footer.appendChild(contattiSection);

    const socialSection = document.createElement('div');
    socialSection.classList.add('footer-section');
    
    const socialTitle = document.createElement('h3');
    socialTitle.textContent = 'Social Media';
    socialSection.appendChild(socialTitle);

    const socialIcons = document.createElement('div');
    socialIcons.classList.add('social-icons');

    Object.values(socialData.social).forEach(social => {
      const a = document.createElement('a');
      a.href = social.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      
      const img = document.createElement('img');
      img.src = social.icon;
      img.alt = social.url.split('.')[1];
      img.style.height = '3rem';
      
      a.appendChild(img);
      socialIcons.appendChild(a);
    });

    socialSection.appendChild(socialIcons);
    footer.appendChild(socialSection);

    const mappaSection = document.createElement('div');
    mappaSection.classList.add('footer-section');
    
    const mappaTitle = document.createElement('h3');
    mappaTitle.textContent = 'Mappa';
    mappaSection.appendChild(mappaTitle);

    const mappa = document.createElement('iframe');
    mappa.src = `https://www.google.com/maps?q=41.9028,12.4964&z=18&t=k&output=embed&markers=color:red%7C41.9028,12.4964`;
    mappa.classList.add('map');
    mappa.allowFullscreen = true;
    mappaSection.appendChild(mappa);

    footer.appendChild(mappaSection);

    const orariSection = document.createElement('div');
    orariSection.classList.add('footer-section');
    
    const orariTitle = document.createElement('h3');
    orariTitle.textContent = 'Orari di Apertura';
    orariSection.appendChild(orariTitle);

    const orari = document.createElement('p');
    orari.textContent = 'Lun-Dom: 19:00 - 23:00';
    orariSection.appendChild(orari);

    footer.appendChild(orariSection);

    const pagamentoSection = document.createElement('div');
    pagamentoSection.classList.add('footer-section');
    
    const pagamentoTitle = document.createElement('h3');
    pagamentoTitle.textContent = 'Metodi di Pagamento';
    pagamentoSection.appendChild(pagamentoTitle);

    const paymentMethods = document.createElement('div');
    paymentMethods.classList.add('payment-methods');

    posizioneData.posizione.paymentIcons.forEach(icon => {
      const img = document.createElement('img');
      img.src = icon.path;
      img.alt = icon.name;
      paymentMethods.appendChild(img);
    });

    pagamentoSection.appendChild(paymentMethods);
    footer.appendChild(pagamentoSection);
  })
  .catch(error => console.error('Errore nel caricamento del JSON:', error));
}

// AUTH FUNCTIONS
function setupLoginRegister() {
  const loginTab = document.getElementById('login-tab');
  const registerTab = document.getElementById('register-tab');
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const formToggle = document.querySelector('.form-toggle');
  
  if (!loginForm || !registerForm || !loginTab || !registerTab) {
    console.error('Login/register elements not found in the DOM');
    return;
  }
  
  const loginError = document.getElementById('login-error');
  const registerError = document.getElementById('register-error');

  function showLoginForm() {
    formToggle.setAttribute('data-active', 'login');
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
    
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  }

  function showRegisterForm() {
    formToggle.setAttribute('data-active', 'register');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
    
    loginForm.style.display = 'none';
    registerForm.style.display = 'flex';
  }

  loginTab.addEventListener('click', showLoginForm);
  registerTab.addEventListener('click', showRegisterForm);

  loginForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (loginError) loginError.textContent = '';
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    
    if(!username || !password){
      if (loginError) loginError.textContent = 'Please fill all fields.';
      return;
    }
    
    fetch('api.php?action=login', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
    .then(r => r.json())
    .then(data => {
      if(data.success) {
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('username', data.username);
        
        showToast('Login effettuato con successo', 'success');
        
        mostraSezione('prenotazioni');
        document.querySelectorAll('#SecondaBarraOrizzontale a').forEach(l2 => {
          l2.classList.remove('selected');
        });
        document.querySelector('#SecondaBarraOrizzontale a[data-target="prenotazioni"]').classList.add('selected');
        
        updateReservationSection();
      } else {
        if (loginError) loginError.textContent = data.error || 'Login failed.';
      }
    })
    .catch(error => {
      console.error('Error during login:', error);
      if (loginError) loginError.textContent = 'Connection error. Please try again.';
    });
  });

  registerForm.addEventListener('submit', function(event) {
    event.preventDefault();
    if (registerError) registerError.textContent = '';
    
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if(!username || !password || !confirmPassword){
      if (registerError) registerError.textContent = 'Please fill all fields.';
      return;
    }
    
    if(password !== confirmPassword) {
      if (registerError) registerError.textContent = 'Passwords do not match.';
      return;
    }
    
    console.log(`Attempting to register with username: ${username}`);
    
    fetch('api.php?action=register', {
      method: 'POST',
      headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      body: `username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`
    })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log("Registration response:", data);
      if(data.success) {
        showToast('Registrazione completata con successo', 'success');
        showLoginForm();
      } else {
        if (registerError) registerError.textContent = data.error || 'Registration failed.';
      }
    })
    .catch(error => {
      console.error('Error during registration:', error);
      if (registerError) registerError.textContent = 'Connection error. Please try again.';
    });
  });

  showLoginForm();
}

// NOTIFICATION SYSTEM
function showToast(message, type = 'info', duration = 3000) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const messageEl = document.createElement('span');
  messageEl.textContent = message;
  toast.appendChild(messageEl);
  
  const closeBtn = document.createElement('button');
  closeBtn.className = 'close-toast';
  closeBtn.innerHTML = '&times;';
  
  closeBtn.onclick = function() { removeToast(toast); };
  toast.appendChild(closeBtn);
  
  container.appendChild(toast);
  
  const timeoutId = setTimeout(() => removeToast(toast), duration);
  
  toast.dataset.timeoutId = timeoutId;
  
  return toast;
}

function removeToast(toast) {
  toast.style.animation = 'fade-out 1.5s forwards';
  setTimeout(() => {
    if (toast.parentElement) {
      toast.parentElement.removeChild(toast);
    }
  }, 300);
}

function showConfirmation(message, onConfirm, onCancel) {
  const dialog = document.createElement('div');
  dialog.className = 'confirmation-dialog';
  
  dialog.innerHTML = `
    <div class="confirmation-content">
      <div class="confirmation-title">${message}</div>
      <div class="confirmation-actions">
        <button class="cancel">Annulla</button>
        <button class="confirm">Conferma</button>
      </div>
    </div>
  `;
  
  dialog.querySelector('.cancel').addEventListener('click', () => {
    document.body.removeChild(dialog);
    if (onCancel) onCancel();
  });
  
  dialog.querySelector('.confirm').addEventListener('click', () => {
    document.body.removeChild(dialog);
    onConfirm();
  });
  
  document.body.appendChild(dialog);
  setTimeout(() => dialog.classList.add('active'), 10);
}

function fillReservationFormWithEventData(evento) {
  const nomeInput = document.getElementById('nome');
  const dataInput = document.getElementById('data');
  const personeInput = document.getElementById('persone');
  
  console.log("Setting event data:", evento);
  
  if (dataInput) {
    try {
      const eventDate = new Date(evento.data);
      const formattedDate = eventDate.toISOString().split('T')[0];
      dataInput.value = formattedDate;
      console.log("Event date set to:", formattedDate);
      
      const today = new Date();
      dataInput.min = today.toISOString().split('T')[0];
      
      const event = new Event('change');
      dataInput.dispatchEvent(event);
    } catch (e) {
      console.error("Error setting event date:", e);
    }
    
    if (nomeInput) {
      const username = localStorage.getItem('username');
      if (username) {
        nomeInput.value = username;
      }
    }
    
    if (personeInput && !personeInput.value) {
      personeInput.value = 2;
    }
    
    const timeSelect = document.getElementById('ora');
    if (timeSelect) {
      setTimeout(() => timeSelect.focus(), 100);
    }
    
    showToast(`Stai prenotando per l'evento: ${evento.nome}`, 'info');
  } else {
    console.error("Date input element not found");
    sessionStorage.setItem('eventToBook', JSON.stringify(evento));
  }
}

// EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
  generaBarraOrizzontale();
  generaFooter();
  setupLoginRegister();

  const secondaBarraOrizzontale = document.getElementById('SecondaBarraOrizzontale');
  const secondaryLinks = [
    { href: '#', text: 'Menù', target: 'menu-giornaliero' },
    { href: '#', text: 'Eventi', target: 'eventi' },
    { href: '#', text: 'Chef', target: 'chef' },
    { href: '#', text: 'Prenotazioni', target: 'prenotazioni' }
  ];

  secondaryLinks.forEach((link, index) => {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.dataset.target = link.target;
    secondaBarraOrizzontale.appendChild(a);

    if (index < secondaryLinks.length - 1) {
      const separator = document.createElement('span');
      separator.textContent = '|';
      secondaBarraOrizzontale.appendChild(separator);
    }

    a.addEventListener('click', function (event) {
      event.preventDefault();
      const idSezione = this.dataset.target;
      mostraSezione(idSezione);
      funzionePerTarget[idSezione]();
      document.querySelectorAll('#SecondaBarraOrizzontale a').forEach(l2 => {
        l2.classList.remove('selected');
      });
      a.classList.add('selected');
      
      setTimeout(() => {
        const contentElement = document.getElementById(idSezione);
        if (contentElement) {
          const offset = 128;
          const topPosition = contentElement.getBoundingClientRect().top + window.scrollY - offset;
          window.scrollTo({
            top: topPosition,
            behavior: 'smooth'
          });
        }
      }, 350);
    });
  });

  mostraSezione('menu-giornaliero');
  document.querySelectorAll('#SecondaBarraOrizzontale a[data-target="menu-giornaliero"]')[0].classList.add('selected');
  caricaMenuGiornaliero();
});

document.addEventListener('scroll', () => {
  const barra = document.querySelector('.BarraOrizzontale');
  const home = document.querySelector('.HOME img');

  const posizioneHome = home.getBoundingClientRect();

  if (posizioneHome.bottom <= 64) {
    barra.classList.add('con-sfondo');
  } else {
    barra.classList.remove('con-sfondo');
  }
});

document.addEventListener('DOMContentLoaded', function() {
  const secondNavBar = document.getElementById('SecondaBarraOrizzontale');

  secondNavBar.addEventListener('scroll', function() {
    if (secondNavBar.scrollLeft + secondNavBar.clientWidth >= secondNavBar.scrollWidth) {
      secondNavBar.classList.add('scroll-end');
    } else {
      secondNavBar.classList.remove('scroll-end');
    }

    if (secondNavBar.scrollLeft === 0) {
      secondNavBar.classList.add('scroll-start');
    } else {
      secondNavBar.classList.remove('scroll-start');
    }
  });
});

document.addEventListener('DOMContentLoaded', function() {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.addedNodes.length) {
        const newButtons = document.querySelectorAll('.book-event-btn:not(.stars-initialized)');
        if (newButtons.length > 0) {
          setupContinuousStars();
          newButtons.forEach(btn => btn.classList.add('stars-initialized'));
        }
      }
    });
  });
  
  observer.observe(document.body, { 
    childList: true,
    subtree: true
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const existingToastContainer = document.querySelector('.toast-container');
  if (existingToastContainer) {
    existingToastContainer.remove();
  }
  
  const toastContainer = document.createElement('div');
  toastContainer.className = 'toast-container';
  document.body.appendChild(toastContainer);
});

window.addEventListener('beforeunload', clearPollingIntervals);
window.addEventListener('pagehide', clearPollingIntervals);

function deleteReservation(id, isClientView = false) {
  const body = new URLSearchParams();
  body.append('id', id);
  
  fetch('api.php?action=delete_reservation', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: body.toString()
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showToast('Prenotazione cancellata con successo', 'success');
      if (isClientView) {
        fetchClientReservations();
      } else {
        fetchAdminReservations();
      }
    } else {
      showToast(data.error || 'Errore durante la cancellazione', 'error');
    }
  })
  .catch(error => {
    console.error('Error deleting reservation:', error);
    showToast('Errore di connessione. Riprova più tardi.', 'error');
  });
}

// Admin hourly view functionality
function setupHourlyView() {
  const prevDayBtn = document.getElementById('prev-day');
  const nextDayBtn = document.getElementById('next-day');
  
  if (!prevDayBtn || !nextDayBtn) return;
  
  const newPrevDayBtn = prevDayBtn.cloneNode(true);
  const newNextDayBtn = nextDayBtn.cloneNode(true);
  prevDayBtn.parentNode.replaceChild(newPrevDayBtn, prevDayBtn);
  nextDayBtn.parentNode.replaceChild(newNextDayBtn, nextDayBtn);
  
  window.currentHourlyViewDate = window.currentHourlyViewDate || new Date();
  
  updateDateDisplay();
  loadHourlyData(window.currentHourlyViewDate);
  
  newPrevDayBtn.addEventListener('click', () => {
    const prevDate = new Date(window.currentHourlyViewDate);
    prevDate.setDate(prevDate.getDate() - 1);
    window.currentHourlyViewDate = prevDate;
    updateDateDisplay();
    loadHourlyData(prevDate);
    updateReservationTablesForDate(prevDate);
  });
  
  newNextDayBtn.addEventListener('click', () => {
    const nextDate = new Date(window.currentHourlyViewDate);
    nextDate.setDate(nextDate.getDate() + 1);
    window.currentHourlyViewDate = nextDate;
    updateDateDisplay();
    loadHourlyData(nextDate);
    updateReservationTablesForDate(nextDate);
  });
}
// Function to update reservation tables based on the selected date
function updateReservationTablesForDate(selectedDate) {
  fetch('api.php?action=get_reservations')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showToast(data.error, 'error');
        return;
      }
      
      const selectedDateStr = selectedDate.toISOString().split('T')[0];
      
      const todayReservations = [];
      const futureReservations = [];
      const pastReservations = [];
      
      data.forEach(reservation => {
        const reservationDate = new Date(reservation.data);
        reservationDate.setHours(0, 0, 0, 0);
        
        if (reservation.data === selectedDateStr) {
          todayReservations.push(reservation);
        } else if (reservationDate > selectedDate) {
          futureReservations.push(reservation);
        } else {
          pastReservations.push(reservation);
        }
      });
      
      const sortByDateAndTime = (a, b) => {
        const dateA = new Date(a.data + ' ' + a.ora);
        const dateB = new Date(b.data + ' ' + b.ora);
        return dateA - dateB;
      };
      
      todayReservations.sort((a, b) => a.ora.localeCompare(b.ora));
      
      futureReservations.sort(sortByDateAndTime);
      pastReservations.sort((a, b) => sortByDateAndTime(b, a));
      
      const todayTitle = document.querySelector('.reservation-section:nth-child(1) h3');
      if (todayTitle) {
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const formattedDate = selectedDate.toLocaleDateString('it-IT', dateOptions);
        
        const today = new Date();
        const isToday = today.toDateString() === selectedDate.toDateString();
        
        todayTitle.textContent = isToday ? 
          'Prenotazioni di Oggi' : 
          `Prenotazioni del ${formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1)}`;
      }
      
      populateReservationTable('today-reservations-table', todayReservations);
      populateReservationTable('future-reservations-table', futureReservations);
      populateReservationTable('past-reservations-table', pastReservations);
    })
    .catch(error => {
      console.error('Error fetching reservations for date:', error);
      showToast('Errore durante il caricamento delle prenotazioni', 'error');
    });
}

function updateDateDisplay() {
  const dateDisplay = document.getElementById('current-date-display');
  if (!dateDisplay) return;
  
  const options = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  const formattedDate = window.currentHourlyViewDate.toLocaleDateString('it-IT', options);
  
  const today = new Date();
  const isToday = today.toDateString() === window.currentHourlyViewDate.toDateString();
  
  let displayText = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);
  if (isToday) {
    displayText = `<span class="current-day-highlight">Oggi</span>, ${displayText}`;
  }
  
  dateDisplay.innerHTML = displayText;
  
  const prevDayBtn = document.getElementById('prev-day');
  const nextDayBtn = document.getElementById('next-day');
  
  if (prevDayBtn && !prevDayBtn.classList.contains('prev-btn')) {
    prevDayBtn.classList.add('prev-btn');
    prevDayBtn.innerHTML = 'Giorno Precedente';
  }
  
  if (nextDayBtn && !nextDayBtn.classList.contains('next-btn')) {
    nextDayBtn.classList.add('next-btn');
    nextDayBtn.innerHTML = 'Giorno Successivo';
  }
}

function loadHourlyData(date) {
  const formattedDate = date.toISOString().split('T')[0];
  
  fetch(`api.php?action=get_hourly_reservations&date=${formattedDate}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        showToast(data.error, 'error');
        return;
      }
      
      displayHourlyData(data);
    })
    .catch(error => {
      console.error('Error loading hourly data:', error);
      showToast('Errore durante il caricamento dei dati orari', 'error');
    });
}

function displayHourlyData(data) {
  const hourlyStatsContent = document.getElementById('hourly-stats-content');
  const totalCovers = document.getElementById('total-covers');
  const totalReservations = document.getElementById('total-reservations');
  
  if (!hourlyStatsContent || !totalCovers || !totalReservations) return;
  
  hourlyStatsContent.innerHTML = '';
  
  const table = document.createElement('table');
  table.className = 'hourly-table';
  
  const headerRow = document.createElement('tr');
  const timeHeader = document.createElement('th');
  timeHeader.textContent = 'Orario';
  headerRow.appendChild(timeHeader);
  
  const reservationsHeader = document.createElement('th');
  reservationsHeader.textContent = 'Prenotazioni';
  headerRow.appendChild(reservationsHeader);
  
  const coversHeader = document.createElement('th');
  coversHeader.textContent = 'Coperti';
  headerRow.appendChild(coversHeader);
  
  table.appendChild(headerRow);
  
  Object.entries(data.hourly_data).forEach(([hour, stats]) => {
    const row = document.createElement('tr');
    
    const timeCell = document.createElement('td');
    timeCell.textContent = hour;
    row.appendChild(timeCell);
    
    const reservationsCell = document.createElement('td');
    reservationsCell.textContent = stats.reservations;
    row.appendChild(reservationsCell);
    
    const coversCell = document.createElement('td');
    coversCell.textContent = stats.covers;
    row.appendChild(coversCell);
    
    table.appendChild(row);
  });
  
  hourlyStatsContent.appendChild(table);
  
  totalCovers.textContent = data.totals.covers;
  totalReservations.textContent = data.totals.reservations;
}
