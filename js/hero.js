
/**
 * Hero Character Variation Logic
 * Handles per-character variable font animations with high-contrast axis values.
 */

class HeroEffect {
    constructor(selector, fps = 8) {
        this.elements = document.querySelectorAll(selector);
        this.chars = [];
        this.fps = fps;
        this.fpsInterval = 1000 / this.fps;
        this.then = performance.now();
        
        // Debugging FPS
        this.frameCount = 0;
        this.lastFpsUpdate = performance.now();
        
        this.init();
    }

    init() {
        this.elements.forEach(element => {
            const text = element.innerText.trim();
            element.innerHTML = '';
            
            [...text].forEach(char => {
                const span = document.createElement('span');
                span.innerText = char === ' ' ? '\u00A0' : char;
                span.classList.add('hero-char');
                element.appendChild(span);
                this.chars.push({
                    element: span,
                    seed: Math.random() * 100,
                    phase: Math.random() * Math.PI * 2
                });
            });
        });

        this.render(performance.now());
        //this.animate(performance.now());
    }

    animate(now) {
        this.rafId = requestAnimationFrame((t) => this.animate(t));

        const elapsed = now - this.then;

        if (elapsed >= this.fpsInterval) {
            // Strictly set then to now to avoid "catch-up" frames that look smooth
            this.then = now;
            
            this.render(now);
            
            // Debug FPS calculation (optional, keeping local state)
            this.frameCount++;
            const sinceLastUpdate = now - this.lastFpsUpdate;
            if (sinceLastUpdate >= 1000) {
                this.frameCount = 0;
                this.lastFpsUpdate = now;
            }
        }
    }

    render(now) {
        const time = now * 0.001;

        this.chars.forEach((charObj) => {
            const { element, seed, phase } = charObj;
            const t = time + phase;
            
            const wght = this.lerpExtreme(600, 1000, (Math.sin(t * 1.5 + seed * 0.7) + 1) / 2);
            const wdth = this.lerpExtreme(100, 151, (Math.cos(t * 1.2 + seed * 0.3) + 1) / 2);
            const grad = this.lerpExtreme(0, 100, (Math.sin(t * 2.5 + seed * 0.9) + 1) / 2);
            const rond = this.lerpExtreme(2, 22, (Math.cos(t * 0.9 + seed * 1.1) + 1) / 2);
            const opsz = this.lerpExtreme(6, 144, (Math.sin(t * 0.6 + seed * 1.4) + 1) / 2);
            const slnt = this.lerpExtreme(-10, -1, (Math.sin(t * 1.1 + seed * 0.5) + 1) / 2);

            element.style.fontVariationSettings = `
                "wght" ${wght}, 
                "wdth" ${wdth}, 
                "GRAD" ${grad}, 
                "ROND" ${rond}, 
                "opsz" ${opsz},
                "slnt" ${slnt}
            `;
        });
    }

    stop() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
    }

    lerpExtreme(min, max, t) {
        const p = 5;
        const smoothT = t < 0.5 
            ? Math.pow(t * 2, p) / 2 
            : 1 - Math.pow((1 - t) * 2, p) / 2;
        
        return min + (max - min) * smoothT;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Default to 8fps as requested by user manually previously
    new HeroEffect('.hero h1 .letrero', 8);
});
