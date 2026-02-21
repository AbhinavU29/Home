document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================================================
       Scroll Animations (Intersection Observer)
       ========================================================================== */
    const faders = document.querySelectorAll('.fade-in');

    const appearOptions = {
        threshold: 0.15,
        rootMargin: "0px 0px -50px 0px"
    };

    const appearOnScroll = new IntersectionObserver(function (entries, observer) {
        entries.forEach(entry => {
            if (!entry.isIntersecting) {
                return;
            } else {
                entry.target.classList.add('appear');
                observer.unobserve(entry.target);
            }
        });
    }, appearOptions);

    faders.forEach(fader => {
        appearOnScroll.observe(fader);
    });

    /* ==========================================================================
       Gallery Slider Logic
       ========================================================================== */
    const track = document.getElementById('gallery-track');
    const slides = Array.from(track.children);
    const nextBtn = document.getElementById('next-btn');
    const prevBtn = document.getElementById('prev-btn');
    const indicatorContainer = document.getElementById('slider-indicators');

    let currentIndex = 0;

    // Create Indicators
    slides.forEach((_, index) => {
        const dot = document.createElement('div');
        dot.classList.add('dot');
        if (index === 0) dot.classList.add('active');
        dot.dataset.index = index;
        indicatorContainer.appendChild(dot);

        // Dot click event
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });

    const dots = Array.from(indicatorContainer.children);

    // Update Slider Position
    const updateSlider = () => {
        track.style.transform = `translateX(-${currentIndex * 100}%)`;

        // Update dots
        dots.forEach(dot => dot.classList.remove('active'));
        dots[currentIndex].classList.add('active');
    };

    // Go to specific slide
    const goToSlide = (index) => {
        currentIndex = index;
        updateSlider();
    };

    // Next Button
    nextBtn.addEventListener('click', () => {
        currentIndex = (currentIndex + 1) % slides.length; // Loop back to start
        updateSlider();
    });

    // Prev Button
    prevBtn.addEventListener('click', () => {
        currentIndex = (currentIndex - 1 + slides.length) % slides.length; // Loop to end
        updateSlider();
    });

    // Optional: Touch/Swipe Support for Mobile
    let touchStartX = 0;
    let touchEndX = 0;

    track.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50; // minimum distance to be considered a swipe
        if (touchEndX < touchStartX - threshold) {
            // Swipe Left -> Next
            currentIndex = (currentIndex + 1) % slides.length;
            updateSlider();
        }
        if (touchEndX > touchStartX + threshold) {
            // Swipe Right -> Prev
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            updateSlider();
        }
    }
});
