import FitText from '../src/FitText.js';
import { GUIController } from '../src/fitText/GUIController.js';

// Crear GUI para controlar slant y roundness
const gui = new window.lil.GUI();
// Inicializar FitText para todos los elementos con la clase
const htmlElements = document.querySelectorAll('.fit-text-container');
let fitTextElements = [];

htmlElements.forEach((item, idx) => {
    console.log(idx)
    const fitText = new FitText(item);
    fitText.fit();
    fitTextElements.push(fitText)
    //
    // GUI controlará todas las instancia de FitText
    console.log("fitText", fitText)
    const guiController = new GUIController(gui, {
        fitTextInstance: fitText, // Principal
        initialSlant: -5,
        initialRoundness: 0,
        onUpdate: (values) => {
            // Actualizar todas las instancias cuando cambien los valores GUI
            fitText.update({ slnt: values.slnt, ROND: values.ROND });
        }
    });
})

// Manejar redimensionamiento de ventana
let resizeTimeout;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        // fitText.fit();
    }, 100);
});