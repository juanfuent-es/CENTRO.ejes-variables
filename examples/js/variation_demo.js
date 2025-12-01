import Variation from '../../src/variation.js';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

const variation = new Variation({
    font: './fonts/HubotSans-VF.ttf',
    txt: 'EJES VARIABLES',
    fontSize: 100,
    wght: 200,
    wdth: 80,
    lineHeight: 0.8
});

variation.whenReady(() => {
    resizeCanvas();
    render();
});

window.addEventListener('resize', () => {
    if (!variation.ready) return;
    resizeCanvas();
    render();
});

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';

    const offsetX = (canvas.width - variation.getTextWidth()) / 2;
    const offsetY = (canvas.height - variation.getLineHeight()) / 2;
    variation.draw(ctx, { offsetX, offsetY });
}

