document.addEventListener('DOMContentLoaded', function () {
    const contenuto = document.getElementById('contenuto');

    fetch('data/cantina.json')
        .then(response => response.json())
        .then(data => {
            data.forEach(vino => {
                const sezione = document.createElement('div');
                sezione.className = 'sezione';
                sezione.style.backgroundImage = `url('${vino.img}')`;

                const contenutoDiv = document.createElement('div');
                contenutoDiv.className = 'contenuto';

                const cella = document.createElement('div');
                cella.className = 'cella';

                const h1 = document.createElement('h1');
                h1.textContent = vino.nome;

                const p = document.createElement('p');
                const anno = document.createElement('strong');
                anno.textContent = 'Anno: ';
                const annoText = document.createTextNode(vino.anno);
                p.appendChild(anno);
                p.appendChild(document.createElement('br'));
                p.appendChild(annoText);
                p.appendChild(document.createElement('br'));

                const descrizione = document.createElement('strong');
                descrizione.textContent = 'Descrizione: ';
                const descrizioneText = document.createTextNode(vino.descrizione);
                p.appendChild(descrizione);
                p.appendChild(document.createElement('br'));
                p.appendChild(descrizioneText);
                p.appendChild(document.createElement('br'));

                const luogo = document.createElement('strong');
                luogo.textContent = 'Luogo: ';
                const luogoText = document.createTextNode(vino.luogo);
                p.appendChild(luogo);
                p.appendChild(document.createElement('br'));
                p.appendChild(luogoText);
                p.appendChild(document.createElement('br'));

                const prezzo = document.createElement('strong');
                prezzo.textContent = 'Prezzo: ';
                const prezzoText = document.createTextNode(`€${vino.prezzo.toFixed(2)}`);
                p.appendChild(prezzo);
                p.appendChild(document.createElement('br'));
                p.appendChild(prezzoText);

                const imageDiv = document.createElement('div');
                imageDiv.className = 'image';

                const img = document.createElement('img');
                img.src = `${vino.img}`;
                img.alt = vino.nome;

                const mapDiv = document.createElement('div');
                mapDiv.className = 'map';
                const iframe = document.createElement('iframe');
                iframe.classList.add('pos');
                iframe.src = `https://www.google.com/maps?q=${encodeURIComponent(vino.luogo)}&t=k&output=embed&z=15&disableDefaultUI=true`;
                iframe.frameBorder = '0';
                iframe.style.border = '0';
                iframe.allowFullscreen = true;
                mapDiv.appendChild(iframe);

                cella.appendChild(h1);
                cella.appendChild(p);
                cella.appendChild(mapDiv);
                contenutoDiv.appendChild(cella);
                imageDiv.appendChild(img);
                contenutoDiv.appendChild(imageDiv);
                sezione.appendChild(contenutoDiv);
                contenuto.appendChild(sezione);
            });
        });
});