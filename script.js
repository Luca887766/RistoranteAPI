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
  const prenotazioniDiv = document.getElementById('prenotazioni');
  prenotazioniDiv.innerHTML = '';

  const formPrenotazione = document.createElement('form');
  formPrenotazione.id = 'form-prenotazione';

  const titoloForm = document.createElement('h2');
  titoloForm.textContent = 'Prenota un Tavolo';
  formPrenotazione.appendChild(titoloForm);

  const formRow1 = document.createElement('div');
  formRow1.className = 'form-row';

  const labelNome = document.createElement('label');
  labelNome.setAttribute('for', 'nome');
  labelNome.textContent = 'Nome:';
  formRow1.appendChild(labelNome);

  const inputNome = document.createElement('input');
  inputNome.type = 'text';
  inputNome.id = 'nome';
  inputNome.name = 'nome';
  inputNome.required = true;
  formRow1.appendChild(inputNome);

  const labelContatto = document.createElement('label');
  labelContatto.setAttribute('for', 'contatto');
  labelContatto.textContent = 'Contatto:';
  formRow1.appendChild(labelContatto);

  const inputContatto = document.createElement('input');
  inputContatto.type = 'tel';
  inputContatto.id = 'contatto';
  inputContatto.name = 'contatto';
  inputContatto.required = true;
  formRow1.appendChild(inputContatto);

  const labelPersone = document.createElement('label');
  labelPersone.setAttribute('for', 'persone');
  labelPersone.textContent = 'Numero di Persone (max 10):';
  formRow1.appendChild(labelPersone);

  const inputPersone = document.createElement('input');
  inputPersone.type = 'number';
  inputPersone.id = 'persone';
  inputPersone.name = 'persone';
  inputPersone.min = '1';
  inputPersone.max = '10';
  inputPersone.required = true;
  formRow1.appendChild(inputPersone);

  formPrenotazione.appendChild(formRow1);

  const formRow2 = document.createElement('div');
  formRow2.className = 'form-row';

  const labelData = document.createElement('label');
  labelData.setAttribute('for', 'data');
  labelData.textContent = 'Data:';
  formRow2.appendChild(labelData);

  const inputData = document.createElement('input');
  inputData.type = 'date';
  inputData.id = 'data';
  inputData.name = 'data';
  inputData.required = true;
  formRow2.appendChild(inputData);

  const labelOra = document.createElement('label');
  labelOra.setAttribute('for', 'ora');
  labelOra.textContent = 'Ora:';
  formRow2.appendChild(labelOra);

  const inputOra = document.createElement('select');
  inputOra.id = 'ora';
  inputOra.name = 'ora';
  inputOra.required = true;
  formRow2.appendChild(inputOra);

  formPrenotazione.appendChild(formRow2);

  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.textContent = 'Prenota';
  formPrenotazione.appendChild(submitButton);

  const calendarioDiv = document.createElement('div');
  calendarioDiv.id = 'calendario';

  const titoloCalendario = document.createElement('h2');
  titoloCalendario.textContent = 'Calendario Prenotazioni';
  calendarioDiv.appendChild(titoloCalendario);

  const tabella = document.createElement('table');
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const thData = document.createElement('th');
  thData.textContent = 'Data';
  const thPosti = document.createElement('th');
  thPosti.textContent = 'Posti Disponibili';
  trHead.appendChild(thData);
  trHead.appendChild(thPosti);
  thead.appendChild(trHead);
  tabella.appendChild(thead);

  const tbody = document.createElement('tbody');
  tbody.id = 'calendario-body';
  tabella.appendChild(tbody);

  calendarioDiv.appendChild(tabella);

  prenotazioniDiv.appendChild(formPrenotazione);
  prenotazioniDiv.appendChild(calendarioDiv);

  const calendarioBody = document.getElementById('calendario-body');

  formPrenotazione.addEventListener('submit', function (event) {
    event.preventDefault();

    const nome = document.getElementById('nome').value;
    const data = document.getElementById('data').value;
    const ora = document.getElementById('ora').value;
    const persone = parseInt(document.getElementById('persone').value);
    const contatto = document.getElementById('contatto').value;

    let valid = true;

    // Validazione del nome
    const nomeRegex = /^[a-zA-Z\s]+$/;
    if (!nomeRegex.test(nome)) {
      inputNome.style.borderColor = 'red';
      valid = false;
    } else {
      inputNome.style.borderColor = '';
    }

    // Validazione della data
    const oggi = new Date();
    const dataPrenotazione = new Date(data);
    if (dataPrenotazione <= oggi) {
      inputData.style.borderColor = 'red';
      valid = false;
    } else {
      inputData.style.borderColor = '';
    }

    // Validazione dell'ora
    const oraRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!oraRegex.test(ora) || (parseInt(ora.split(':')[0]) < 12 || (parseInt(ora.split(':')[0]) > 15 && parseInt(ora.split(':')[0]) < 19))) {
      inputOra.style.borderColor = 'red';
      valid = false;
    } else {
      inputOra.style.borderColor = '';
    }

    // Validazione del contatto
    const contattoRegex = /^\d{10}$/;
    if (!contattoRegex.test(contatto)) {
      inputContatto.style.borderColor = 'red';
      valid = false;
    } else {
      inputContatto.style.borderColor = '';
    }

    if (!valid) {
      alert('Per favore, correggi i campi evidenziati in rosso.');
      return;
    }

    let prenotazioni = JSON.parse(localStorage.getItem('prenotazioni')) || { prenotazioni: [] };
    if (!Array.isArray(prenotazioni.prenotazioni)) {
      prenotazioni.prenotazioni = [];
    }

    // Check available seats
    const postiDisponibili = {};
    prenotazioni.prenotazioni.forEach(prenotazione => {
      const data = prenotazione.data;
      if (!postiDisponibili[data]) {
        postiDisponibili[data] = 50; // Posti disponibili ogni giorno
      }
      postiDisponibili[data] -= prenotazione.persone;
    });

    if (postiDisponibili[data] !== undefined && postiDisponibili[data] - persone < 0) {
      alert('Non ci sono abbastanza posti disponibili per la data selezionata.');
      return;
    }

    const prenotazione = {
      nome_cliente: nome,
      data: data,
      ora: ora,
      persone: persone,
      contatto: contatto
    };

    prenotazioni.prenotazioni.push(prenotazione);
    localStorage.setItem('prenotazioni', JSON.stringify(prenotazioni));
    console.log('Prenotazione salvata:', prenotazione);

    alert('Prenotazione effettuata con successo!');
    formPrenotazione.reset();
    caricaCalendario();
  });

  function caricaCalendario() {
    let prenotazioni = JSON.parse(localStorage.getItem('prenotazioni')) || { prenotazioni: [] };
    const postiDisponibili = {};

    prenotazioni.prenotazioni.forEach(prenotazione => {
      const data = prenotazione.data;
      if (!postiDisponibili[data]) {
        postiDisponibili[data] = 50; // Posti disponibili ogni giorno
      }
      postiDisponibili[data] -= prenotazione.persone;
    });

    calendarioBody.innerHTML = '';
    const oggi = new Date();
    const futureDates = Object.keys(postiDisponibili).filter(data => new Date(data) >= oggi).sort((a, b) => new Date(a) - new Date(b));
    futureDates.forEach(data => {
      const tr = document.createElement('tr');
      const tdData = document.createElement('td');
      tdData.textContent = data;
      const tdPosti = document.createElement('td');
      tdPosti.textContent = postiDisponibili[data];
      tdPosti.className = postiDisponibili[data] > 0 ? 'available' : 'unavailable';
      tr.appendChild(tdData);
      tr.appendChild(tdPosti);
      calendarioBody.appendChild(tr);
    });
  }

  inputData.addEventListener('change', function () {
    const dataSelezionata = this.value;
    const prenotazioni = JSON.parse(localStorage.getItem('prenotazioni')) || { prenotazioni: [] };
    const orariDisponibili = ['19:00', '19:30', '20:00', '20:30', '21:00', '21:30'];

    inputOra.innerHTML = '';
    orariDisponibili.forEach(ora => {
      const option = document.createElement('option');
      option.value = ora;
      option.textContent = ora;
      inputOra.appendChild(option);
    });
  });

  caricaCalendario();
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