import VFont from '../../src/VFont.Core.js';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
document.body.appendChild(canvas);

// Controles GUI (lil-gui)
const gui = new window.lil.GUI();

const font = new VFont('../fonts/EcosDelAnden-VF.woff2');

font.loaded(() => {
    console.log('Font loaded', variation.getAxes());
    resizeCanvas();
    render();
});

window.addEventListener('resize', () => {
    if (!variation.ready) return;
    resizeCanvas();
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

function animate() {
    requestAnimationFrame(animate);
    render();
}

animate();