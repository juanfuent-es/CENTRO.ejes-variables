# Ejes Variables
La tipografía variable como herramienta funcional para el diseño de la señalética del transporte de CDMX.

Proyecto académico-experimental que propone el uso de tipografías variables como solución funcional a la inconsistencia espacial y visual presente en la señalética del transporte público de la Ciudad de México. Inspirado en los letreros de rutas y paradas de la red capitalina, el proyecto demuestra cómo el control de los ejes de variación de una tipografía, (En este caso wdth, wght, opsz) permite ajustar dinámicamente la forma de las letras al ancho y alto del contenedor, preservando la legibilidad sin distorsión.

La investigación culmina en un Configurador Interactivo, una herramienta educativa que permite diseñar letreros con ajustes automáticos y manuales en tiempo real, generando composiciones tipográficas precisas y exportables en formato SVG y PNG.

La tipografía objeto de estudio fue "Open Sans" importada desde google fonts, esta selección por su trazo sans-serif, trazo y estilo que evoca el principal uso de tipografías de usadas en los medios de transporte.

A través de ejercicios en HTML, CSS y SVG, se exploran métodos de distribución proporcional de texto por filas y módulos, emulando la estructura de los sistemas de transporte urbano y evidenciando cómo la tipografía variable puede operar como un sistema adaptable dentro del diseño visual contemporáneo, manteniendo la legibilidad y aplicando correcto escalado sin necesidad de recurrir a la deformación estética o la compresión manual.

## p5.variableFont.js - Extensión para p5.js

Este proyecto incluye una extensión nativa de p5.js para trabajar con fuentes variables de manera funcional y eficiente.

### Características

- ✅ **Carga de fuentes variables**: Soporte para TTF, OTF, WOFF, WOFF2
- ✅ **Medición precisa**: Métodos para medir ancho, alto y métricas completas de texto
- ✅ **Control de ejes variables**: Lectura y configuración de ejes (wght, wdth, opsz, etc.)
- ✅ **Ajuste automático**: `textFit()` y `textFitMultiline()` para ajustar texto a contenedores
- ✅ **Interpolación**: Interpolación suave entre configuraciones de ejes
- ✅ **Compatible con p5.js v2.0+**: Integración nativa con p5.js

### Instalación

```html
<!-- Cargar p5.js -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js"></script>

<!-- Cargar Typr.js (requerido) -->
<script src="https://cdn.jsdelivr.net/gh/photopea/Typr.js@gh-pages/src/Typr.js"></script>
<script src="https://cdn.jsdelivr.net/gh/photopea/Typr.js@gh-pages/src/Typr.U.js"></script>

<!-- Cargar la extensión -->
<script src="src/p5.variableFont.js"></script>
```

### Uso Básico

```javascript
let variableFont;

function setup() {
  createCanvas(800, 600);
  
  // Cargar fuente variable
  loadVariableFont('fonts/OpenSans-Variable.ttf', 'OpenSans', (fontData) => {
    console.log('Fuente cargada:', fontData);
    variableFont = fontData;
  });
}

function draw() {
  background(240);
  
  if (!variableFont) return;
  
  // Ajustar texto a un contenedor
  const result = textFit(
    'TRANSPORTE PÚBLICO',
    400,  // ancho máximo
    200,  // alto máximo
    'OpenSans',
    {
      minFontSize: 12,
      maxFontSize: 200,
      adjustAxes: true
    }
  );
  
  // Dibujar texto ajustado
  textVariable(
    result.text,
    100, 100,
    'OpenSans',
    result.fontSize,
    result.axes
  );
}
```

### Métodos Principales

- `loadVariableFont(source, name, callback)` - Carga una fuente variable
- `getVariableAxes(name)` - Obtiene ejes disponibles
- `getAxisRange(fontName, axisTag)` - Obtiene rango de un eje
- `measureVariableText(text, fontName, fontSize, axesValues)` - Mide ancho de texto
- `measureVariableTextHeight(text, fontName, fontSize, axesValues)` - Mide altura
- `getVariableTextMetrics(text, fontName, fontSize, axesValues)` - Métricas completas
- `textVariable(text, x, y, fontName, fontSize, axesValues)` - Dibuja texto con ejes
- `textFit(text, maxWidth, maxHeight, fontName, options)` - Ajusta texto a contenedor
- `textFitMultiline(text, maxWidth, maxHeight, fontName, options)` - Ajuste multilínea
- `interpolateAxes(axes1, axes2, t, fontName)` - Interpola entre configuraciones

### Ejemplos

Ver la carpeta `examples/` para ejemplos completos:

- `basic.html` - Uso básico de fuentes variables
- `textFit.html` - Ejemplo de ajuste automático de texto
- `axes-explorer.html` - Explorador interactivo de ejes
- `complete-example.html` - Ejemplo completo de señalética de transporte

### Documentación Completa

Ver [API.md](API.md) para documentación completa de la API.

### Tecnologías Utilizadas

- **p5.js**: Biblioteca de JavaScript para programación creativa
- **Typr.js**: Parser de fuentes en JavaScript (ligero y rápido)
- **Fuentes Variables**: OpenType Variable Fonts

### Licencia

GPL-3.0
