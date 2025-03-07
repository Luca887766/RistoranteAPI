document.addEventListener("DOMContentLoaded", function() {
    fetch('data/data.json')
        .then(response => response.json())
        .then(data => {
            const contenuto = document.getElementById("contenuto");
            const items = data.items;

            // Create slider
            const slider = document.createElement("div");
            slider.className = "slider";

            const slides = document.createElement("div");
            slides.className = "slides";

            // Add slides for each item
            items.forEach(item => {
                const slide = document.createElement("div");
                slide.className = "slide";
                slide.style.backgroundImage = `url(${item.immagine})`;
                slide.style.backgroundSize = "cover";
                slide.style.backgroundPosition = "center";
                slide.style.width = "100vw";
                slide.style.height = "100vh";

                const textContent = document.createElement("div");
                textContent.className = "text-content";

                const title = document.createElement("h2");
                title.textContent = item.titolo;

                const content = document.createElement("p");
                content.innerHTML = item.contenuto;

                textContent.appendChild(title);
                textContent.appendChild(content);
                slide.appendChild(textContent);
                slides.appendChild(slide);
            });

            slider.appendChild(slides);

            let currentIndex = 0;

            const updateSliderPosition = () => {
                slides.style.transform = `translateX(-${currentIndex * 100}vw)`;
            };

            const prevButton = document.createElement("button");
            prevButton.className = "slider-button";
            prevButton.textContent = "<";
            prevButton.addEventListener("click", () => {
                if (currentIndex > 0) {
                    currentIndex--;
                    updateSliderPosition();
                }
            });

            const nextButton = document.createElement("button");
            nextButton.className = "slider-button";
            nextButton.textContent = ">";
            nextButton.addEventListener("click", () => {
                if (currentIndex < items.length - 1) {
                    currentIndex++;
                    updateSliderPosition();
                }
            });

            const sliderButtons = document.createElement("div");
            sliderButtons.className = "slider-buttons";
            sliderButtons.appendChild(prevButton);
            sliderButtons.appendChild(nextButton);

            slider.appendChild(sliderButtons);
            contenuto.appendChild(slider);

            window.addEventListener("resize", updateSliderPosition);
        })
        .catch(error => console.error('Errore nel caricamento dei dati:', error));
});
