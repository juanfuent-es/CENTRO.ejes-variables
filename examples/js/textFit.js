const str = "Insurgentes";
const fontSize = 64;
let font;

function preload() {
  font = loadFont('./fonts/MonaSans-VF.ttf');
}

function setup() {
  createCanvas(windowWidth, windowHeight);
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

function draw() {
  clear();
  textAlign(CENTER, CENTER);
  fill('white');
  //
  textFont(font, {
    fontVariationSettings: `'wdth' 900`
  });
  textSize(fontSize);
  text(str.toUpperCase(), width * 0.5, height * 0.5);
}