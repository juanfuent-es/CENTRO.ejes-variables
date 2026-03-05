import FitText from '../src/FitText.js';
import { GUIController } from '../src/fitText/GUIController.js';
import GoogleSansFlexStrategy from '../src/fitText/GoogleSansFlexStrategy.js';

// Instanciar la estrategia específica para esta tipografía
const strategy = new GoogleSansFlexStrategy();

// Crear GUI para controlar los ejes
const gui = new window.lil.GUI();

// Inicializar FitText para todos los elementos con la clase
const htmlElements = document.querySelectorAll('.fit-text-container');
let fitTextElements = [];

htmlElements.forEach((item, idx) => {
    const fitText = new FitText(item, { strategy });
    fitText.fit();
    fitTextElements.push(fitText);
    
    // El GUI controlará las instancias
    const guiController = new GUIController(gui, {
        fitTextInstance: fitText,
        onUpdate: (values) => {
            // Sincronizar otros si se desea
            fitTextElements.forEach(ft => {
                if (ft !== fitText) ft.update(values);
            });
        }
    });
});

// Manejar redimensionamiento de ventana
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        fitTextElements.forEach(ft => ft.fit());
    }, 100);
});