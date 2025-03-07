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

let x = document.getElementById("login-form");
let y = document.getElementById("register-form");
let z = document.getElementById("btn");
let formContainer = document.querySelector(".form-container");

function register() {
  formContainer.style.transform = "translateX(-100%)";
  z.style.left = "110px";
}

function login() {
  formContainer.style.transform = "translateX(0)";
  z.style.left = "0";
}

// New function to handle the display of reservation content based on login status
function updateReservationSection() {
  const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
  const isAdmin = localStorage.getItem('username') === 'admin';

  document.getElementById('login-register-container').style.display = isLoggedIn ? 'none' : 'block';
  document.getElementById('reservation-form-container').style.display = (isLoggedIn && !isAdmin) ? 'block' : 'none';
  document.getElementById('admin-reservations').style.display = (isLoggedIn && isAdmin) ? 'block' : 'none';

  if (isAdmin) {
    fetchReservations();
  }
}

function fetchReservations() {
  fetch('api.php?action=get_reservations')
    .then(response => response.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }

      const tableBody = document.querySelector('#admin-reservations #reservations-table tbody');
      tableBody.innerHTML = '';

      data.forEach(reservation => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${reservation.nome_cliente}</td>
          <td>${reservation.data}</td>
          <td>${reservation.ora}</td>
          <td>${reservation.persone}</td>
          <td>${reservation.contatto}</td>
        `;
        tableBody.appendChild(row);
      });
    })
    .catch(error => console.error('Error fetching reservations:', error));
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

// Funzione per generare il modulo di prenotazione e il calendario
function caricaPrenotazioni() {
  // This function is now only responsible for setting up event listeners
  const loginForm = document.getElementById('login-form');
  const registerForm = document.getElementById('register-form');
  const reservationForm = document.getElementById('reservation-form');

  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    fetch('api.php?action=login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${username}&password=${password}`,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('username', data.username);
          updateReservationSection();
        } else {
          alert(data.error);
        }
      })
      .catch(error => console.error('Error logging in:', error));
  });

  registerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    fetch('api.php?action=register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${username}&password=${password}`,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.success);
          // Clear registration form fields
          document.getElementById('register-username').value = '';
          document.getElementById('register-password').value = '';
          // Switch to login form
          login();
        } else {
          alert(data.error);
        }
      })
      .catch(error => console.error('Error registering:', error));
  });

  reservationForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const nome = document.getElementById('nome').value;
    const data = document.getElementById('data').value;
    const ora = document.getElementById('ora').value;
    const persone = document.getElementById('persone').value;
    const contatto = document.getElementById('contatto').value;

    fetch('api.php?action=create_reservation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `nome=${nome}&data=${data}&ora=${ora}&persone=${persone}&contatto=${contatto}`,
    })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          alert(data.success);
          reservationForm.reset();
        } else {
          alert(data.error);
        }
      })
      .catch(error => console.error('Error creating reservation:', error));
  });

  // Initial update of reservation section based on login status
  login(); // Ensure login form is visible by default
  updateReservationSection();
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