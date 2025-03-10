// Funzione per caricare un file JSON
function caricaJSON(file) {
  return fetch(file)
    .then(response => response.json())
    .catch(error => console.error('Errore nel caricamento del JSON:', error));
}

// Funzione per mostrare una sezione specifica con effetto di transizione
function mostraSezione(idSezione) {
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
    }
  }, 300);
}

// Enhanced function to handle the display of reservation content based on login status
function updateReservationSection() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const username = localStorage.getItem('username');
  const isAdmin = username === 'admin';

  // Get elements, safely checking if they exist
  const loginContainer = document.getElementById('login-register-container');
  const clientArea = document.getElementById('client-area');
  const adminDashboard = document.getElementById('admin-dashboard');

  // Only update display if elements exist
  if (loginContainer) {
    loginContainer.style.display = isLoggedIn ? 'none' : 'block';
  }
  
  if (clientArea) {
    clientArea.style.display = (isLoggedIn && !isAdmin) ? 'block' : 'none';
  }
  
  if (adminDashboard) {
    adminDashboard.style.display = (isLoggedIn && isAdmin) ? 'block' : 'none';
  }

  if (isLoggedIn) {
    if (isAdmin) {
      fetchAdminReservations();
    } else {
      fetchClientReservations();
    }
  }
}

// Fetch all reservations for admin
function fetchAdminReservations() {
  fetch('api.php?action=get_reservations')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      const tableBody = document.querySelector('#reservations-table tbody');
      tableBody.innerHTML = '';

      data.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${reservation.nome_cliente}</td>
          <td>${reservation.data}</td>
          <td>${reservation.ora}</td>
          <td>${reservation.persone}</td>
          <td>${reservation.contatto}</td>
          <td>
            <button class="edit-btn" data-id="${reservation.id}">Modifica</button>
            <button class="delete-btn" data-id="${reservation.id}">Elimina</button>
          </td>
        `;
        tableBody.appendChild(row);
      });

      // Add event listeners to edit and delete buttons
      document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          editReservation(id);
        });
      });

      document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          if (confirm('Sei sicuro di voler eliminare questa prenotazione?')) {
            deleteReservation(id);
          }
        });
      });
    })
    .catch(error => console.error('Error fetching reservations:', error));
}

// Fetch user's reservations
function fetchClientReservations() {
  fetch('api.php?action=get_user_reservations')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        console.error(data.error);
        return;
      }

      const container = document.getElementById('client-reservations-container');
      container.innerHTML = '';

      if (data.length === 0) {
        container.innerHTML = '<p>Non hai ancora effettuato prenotazioni.</p>';
        return;
      }

      data.forEach(reservation => {
        const card = document.createElement('div');
        card.classList.add('reservation-card');
        card.innerHTML = `
          <div class="reservation-details">
            <h4>Prenotazione per ${reservation.persone} persone</h4>
            <p>Data: ${reservation.data} alle ${reservation.ora}</p>
            <p>Nome: ${reservation.nome_cliente}</p>
            <p>Contatto: ${reservation.contatto}</p>
          </div>
          <div class="reservation-actions">
            <button class="delete-btn" data-id="${reservation.id}">Cancella</button>
          </div>
        `;
        container.appendChild(card);
      });

      // Add event listeners to delete buttons
      document.querySelectorAll('#client-reservations-container .delete-btn').forEach(btn => {
        btn.addEventListener('click', function() {
          const id = this.getAttribute('data-id');
          if (confirm('Sei sicuro di voler cancellare questa prenotazione?')) {
            deleteReservation(id, true);
          }
        });
      });
    })
    .catch(error => console.error('Error fetching user reservations:', error));
}

// Edit reservation function
function editReservation(id) {
  fetch(`api.php?action=get_reservation&id=${id}`)
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      // Create a modal for editing
      const modal = document.createElement('div');
      modal.classList.add('modal');
      modal.innerHTML = `
        <div class="modal-content">
          <span class="close">&times;</span>
          <h3>Modifica Prenotazione</h3>
          <form id="edit-form">
            <input type="hidden" id="edit-id" value="${data.id}">
            <div class="form-row">
              <label for="edit-nome">Nome</label>
              <input type="text" id="edit-nome" value="${data.nome_cliente}" required>
            </div>
            <div class="form-row">
              <label for="edit-data">Data</label>
              <input type="date" id="edit-data" value="${data.data}" required>
            </div>
            <div class="form-row">
              <label for="edit-ora">Ora</label>
              <input type="time" id="edit-ora" value="${data.ora}" required>
            </div>
            <div class="form-row">
              <label for="edit-persone">Numero di persone</label>
              <input type="number" id="edit-persone" value="${data.persone}" min="1" max="20" required>
            </div>
            <div class="form-row">
              <label for="edit-contatto">Contatto</label>
              <input type="text" id="edit-contatto" value="${data.contatto}" required>
            </div>
            <button type="submit">Salva Modifiche</button>
          </form>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // Close button functionality
      modal.querySelector('.close').addEventListener('click', () => {
        document.body.removeChild(modal);
      });
      
      // Submit form functionality
      modal.querySelector('#edit-form').addEventListener('submit', function(e) {
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
    })
    .catch(error => console.error('Error getting reservation details:', error));
}

// Update reservation
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
      alert('Prenotazione aggiornata con successo');
      document.body.removeChild(modal);
      fetchAdminReservations();
    } else {
      alert(data.error || 'Errore durante l\'aggiornamento');
    }
  })
  .catch(error => console.error('Error updating reservation:', error));
}

// Delete reservation
function deleteReservation(id, isClient = false) {
  fetch('api.php?action=delete_reservation', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `id=${id}`
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      alert('Prenotazione eliminata con successo');
      if (isClient) {
        fetchClientReservations();
      } else {
        fetchAdminReservations();
      }
    } else {
      alert(data.error || 'Errore durante l\'eliminazione');
    }
  })
  .catch(error => console.error('Error deleting reservation:', error));
}

// Modify the form submission handler for creating reservations
function setupReservationForm() {
  const form = document.getElementById('reservation-form');
  if (form) {
    form.addEventListener('submit', function(event) {
      event.preventDefault();
      
      const formData = {
        nome: document.getElementById('nome').value,
        data: document.getElementById('data').value,
        ora: document.getElementById('ora').value,
        persone: document.getElementById('persone').value,
        contatto: document.getElementById('contatto').value
      };
      
      const body = new URLSearchParams();
      for (const key in formData) {
        body.append(key, formData[key]);
      }
      
      fetch('api.php?action=create_reservation', {
        method: 'POST',
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        body: body.toString()
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert('Prenotazione effettuata con successo');
          form.reset();
          fetchClientReservations();
        } else {
          alert(data.error || 'Errore durante la prenotazione');
        }
      })
      .catch(error => console.error('Error creating reservation:', error));
    });
  }
}

// Add logout functionality
function setupLogout() {
  const adminLogout = document.getElementById('admin-logout');
  const clientLogout = document.getElementById('client-logout');
  
  const logoutHandler = function() {
    fetch('api.php?action=logout')
      .then(response => response.json())
      .then(data => {
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('username');
        alert('Logout effettuato con successo');
        updateReservationSection();
      })
      .catch(error => console.error('Error during logout:', error));
  };
  
  if (adminLogout) adminLogout.addEventListener('click', logoutHandler);
  if (clientLogout) clientLogout.addEventListener('click', logoutHandler);
}

// Update caricaPrenotazioni function
function caricaPrenotazioni() {
  setupReservationForm();
  setupLogout();
  updateReservationSection();
}

async function caricaMenuGiornaliero() {
  try {
    const response = await fetch('./data/menu.json');
    const data = await response.json();

    const oggi = new Date().toLocaleString('it-IT', { weekday: 'long' }).toLowerCase();
    const menu = data.menù[oggi];
    const menuDiv = document.getElementById('menu-giornaliero');

    if (!menu || !menu.piatti || menu.piatti.length === 0) {
      menuDiv.innerHTML = `<p>Non ci sono piatti disponibili per oggi (${oggi}).</p>`;
      return;
    }

    menuDiv.innerHTML = '';

    // Titolo del menu
    const titolo = document.createElement('h2');
    titolo.innerText = `Menù del Giorno (${oggi.charAt(0).toUpperCase() + oggi.slice(1)})`;
    menuDiv.appendChild(titolo);

    // Contenitore dei piatti
    const piattiContainer = document.createElement('div');
    piattiContainer.classList.add('piatti-container');
    menuDiv.appendChild(piattiContainer);

    // Piatti del menu
    menu.piatti.forEach((piatto) => {
      const piattoDiv = document.createElement('div');
      piattoDiv.classList.add('piatto');
      piattoDiv.style.backgroundImage = `url(${piatto.immagine})`;

      const infoPiatto = document.createElement('div');
      infoPiatto.classList.add('info-piatto');

      const nomePiatto = document.createElement('h3');
      nomePiatto.innerText = piatto.nome;
      infoPiatto.appendChild(nomePiatto);

      const descrizionePiatto = document.createElement('p');
      descrizionePiatto.innerText = piatto.descrizione;
      infoPiatto.appendChild(descrizionePiatto);

      const prezzoPiatto = document.createElement('p');
      prezzoPiatto.innerHTML = `<strong>Prezzo:</strong> ${piatto.prezzo}`;
      infoPiatto.appendChild(prezzoPiatto);

      const arrowRight = document.createElement('div');
      arrowRight.classList.add('arrow-right');
      arrowRight.innerHTML = '&#9654;'; // Right arrow symbol

      const arrowLeft = document.createElement('div');
      arrowLeft.classList.add('arrow-left');
      arrowLeft.innerHTML = '&#9664;'; // Left arrow symbol

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

// Funzione per mostrare solo gli eventi futuri (inclusi quelli di oggi)
function mostraEventiFuturi(eventi) {
  const oggi = new Date();
  oggi.setHours(0, 0, 0, 0);

  return eventi.filter(evento => {
    const dataEvento = new Date(evento.data);
    dataEvento.setHours(0, 0, 0, 0);
    return dataEvento >= oggi;
  });
}

// Funzione per ordinare gli eventi per data
function ordinaEventiPerData(eventi) {
  return eventi.sort((a, b) => {
    const dataA = new Date(a.data);
    const dataB = new Date(b.data);
    return dataA - dataB;
  });
}

// Funzione per caricare e visualizzare gli eventi
function caricaEventi() {
  caricaJSON('./data/eventi.json').then(data => {
    const eventiDiv = document.getElementById('eventi');

    eventiDiv.innerHTML = '';
    // Titolo
    const titolo = document.createElement('h2');
    titolo.innerText = "Eventi Speciali";
    eventiDiv.appendChild(titolo);

    // Ordina gli eventi per data
    const eventiOrdinati = ordinaEventiPerData(data.eventi);
    const eventiFuturi = mostraEventiFuturi(eventiOrdinati);

    // Crea una galleria per gli eventi
    const galleriaDiv = document.createElement('div');
    galleriaDiv.classList.add('galleria-eventi');

    // Aggiungi gli eventi alla galleria
    eventiFuturi.forEach(evento => {
      const eventoDiv = document.createElement('div');
      eventoDiv.classList.add('evento');

      // Crea l'immagine dell'evento
      const immagineEvento = document.createElement('img');
      immagineEvento.src = evento.foto;
      immagineEvento.alt = `Immagine evento ${evento.nome}`;
      eventoDiv.appendChild(immagineEvento);

      // Crea la data sopra l'immagine
      const dataEvento = document.createElement('div');
      dataEvento.classList.add('data');
      dataEvento.innerText = evento.data;
      eventoDiv.appendChild(dataEvento);

      // Crea il nome dell'evento sotto l'immagine
      const nomeEvento = document.createElement('div');
      nomeEvento.classList.add('nome-evento');
      nomeEvento.innerText = evento.nome;
      eventoDiv.appendChild(nomeEvento);

      // Crea la descrizione dell'evento, inizialmente nascosta
      const descrizioneEvento = document.createElement('div');
      descrizioneEvento.classList.add('descrizione');
      descrizioneEvento.innerText = evento.descrizione;
      eventoDiv.appendChild(descrizioneEvento);

      // Aggiungi l'evento alla galleria
      galleriaDiv.appendChild(eventoDiv);
    });

    // Aggiungi la galleria di eventi alla sezione
    eventiDiv.appendChild(galleriaDiv);
  });
}

function caricaChef() {
  caricaJSON('./data/chef.json').then(data => {
    const chefDiv = document.getElementById('chef');

    chefDiv.innerHTML = '';
    const galleriaChef = document.createElement('div');
    galleriaChef.classList.add('galleria-chef');

    data.chef.forEach(chef => {
      const chefContainer = document.createElement('div');
      chefContainer.classList.add('chef');

      // Immagine dello chef
      const chefImg = new Image();
      chefImg.src = chef.foto;
      chefImg.alt = `Foto di ${chef.nome}`;
      chefContainer.appendChild(chefImg);

      // Nome dello chef (in basso, visibile sempre)
      const nomeChef = document.createElement('div');
      nomeChef.classList.add('nome-chef');
      nomeChef.innerText = chef.nome;
      chefContainer.appendChild(nomeChef);

      // Biografia dello chef (in basso, visibile al hover)
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

// Mappa le funzioni ai target
const funzionePerTarget = {
  'menu-giornaliero': caricaMenuGiornaliero,
  'eventi': caricaEventi,
  'chef': caricaChef,
  'prenotazioni': caricaPrenotazioni,
};

// Aggiungi gli event listener ai link della barra orizzontale
document.querySelectorAll('#SecondaBarraOrizzontale a').forEach(link => {
  link.addEventListener('click', function (event) {
    event.preventDefault();
    const idSezione = this.dataset.target;
    mostraSezione(idSezione);
    funzionePerTarget[idSezione]();
    document.querySelectorAll('#SecondaBarraOrizzontale a').forEach(l2 => {
      l2.classList.remove('selected')
    })
    link.classList.add('selected')
  });
});

function generaBarraOrizzontale() {
  const barraOrizzontale = document.querySelector('.BarraOrizzontale');
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
    footer.innerHTML = '';

    // Contatti
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

    // Social Media
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

    // Mappa
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

    // Orari di Apertura
    const orariSection = document.createElement('div');
    orariSection.classList.add('footer-section');
    const orariTitle = document.createElement('h3');
    orariTitle.textContent = 'Orari di Apertura';
    orariSection.appendChild(orariTitle);

    const orari = document.createElement('p');
    orari.innerText = `Lun-Dom: 19:00 - 23:00`;
    orariSection.appendChild(orari);

    footer.appendChild(orariSection);

    // Metodi di Pagamento
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

document.addEventListener('DOMContentLoaded', () => {
  generaBarraOrizzontale();
  generaFooter();
  setupLoginRegister(); // Add this call to initialize login/register functionality

  // Create the secondary navigation bar
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
    });
  });

  // Show default section
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

// Extract login/register setup to a separate function to avoid duplication
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
    
    // Reset error messages
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
    
    // Simple display toggle instead of animation to fix bugs
    loginForm.style.display = 'flex';
    registerForm.style.display = 'none';
  }

  function showRegisterForm() {
    formToggle.setAttribute('data-active', 'register');
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    
    // Reset error messages
    if (loginError) loginError.textContent = '';
    if (registerError) registerError.textContent = '';
    
    // Simple display toggle instead of animation to fix bugs
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
        
        // Navigate to prenotazioni section after successful login
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
    
    // Test the API connection first
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
        alert('Registration successful');
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

  // Show login form by default
  showLoginForm();
}