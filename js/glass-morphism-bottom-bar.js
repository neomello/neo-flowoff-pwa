// === GLASS MORPHISM BOTTOM BAR - NEO.FLOWOFF ===
// Adaptado do código original mantendo nossas funções e nomes

// Global variables
let navItems = [];
let selectedItemIndex = -1;
let exchangeButtonRadius = 45;

// Variables para el efecto de glassmorfismo
let pg; // Lienzo oculto (graphics buffer) para el desenfoque
let orb1, orb2; // Orbes para el fondo dinámico

function setup() {
  createCanvas(800, 600);

  // Crear el lienzo oculto para el efecto de desenfoque
  pg = createGraphics(width, height);

  // Inicializar los orbes del fondo con nuestras colores NEO.FLOWOFF
  orb1 = {
    x: 150,
    y: 250,
    r: 250,
    vx: 0.6,
    vy: 0.8,
    color: color(255, 47, 179, 150),
  }; // --neon (rosa)
  orb2 = {
    x: 600,
    y: 350,
    r: 300,
    vx: -0.8,
    vy: -0.6,
    color: color(0, 208, 255, 150),
  }; // --blue (azul ciano)

  // Definir los elementos de navegación - ADAPTADOS PARA NOSSO PROJETO
  navItems = [
    { label: 'Home', x: 180, y: 480, icon: 'home' },
    { label: 'Projetos', x: 280, y: 480, icon: 'projects' },
    { label: 'Start', x: 380, y: 480, icon: 'start' },
    { label: 'MiniApp', x: 480, y: 480, icon: 'miniapp' },
    { label: 'Eco', x: 580, y: 480, icon: 'ecosystem' },
  ];

  textAlign(CENTER, TOP);
  textSize(14);
  textFont('Arial');
}

function draw() {
  // 1. Fondo dinámico
  // Dibuja el fondo base y los orbes en movimiento en el lienzo principal
  background(10, 10, 20);
  drawAndMoveOrbs(this); // 'this' se refiere al lienzo principal de p5

  // 2. Preparar la capa desenfocada
  // Dibuja los mismos orbes en el lienzo oculto y aplica el desenfoque
  pg.background(10, 10, 20);
  drawAndMoveOrbs(pg);
  pg.filter(BLUR, 12); // Nivel de desenfoque

  // 3. Dibujar el panel de cristal
  let cardX = 50;
  let cardY = 50;
  let cardW = 700;
  let cardH = 500;
  let cardRadius = 20;

  // Sombra para dar efecto de profundidad y flotación
  drawingContext.shadowOffsetX = 5;
  drawingContext.shadowOffsetY = 10;
  drawingContext.shadowBlur = 25;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.4)';

  // Dibuja la porción desenfocada del lienzo oculto en la posición de la tarjeta
  image(pg.get(cardX, cardY, cardW, cardH), cardX, cardY, cardW, cardH);

  // Resetear la sombra para los elementos interiores
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 0;

  // Añade el tinte y el borde para el acabado de cristal
  noStroke();
  fill(255, 255, 255, 40); // Tinte blanco semitransparente
  rect(cardX, cardY, cardW, cardH, cardRadius);

  stroke(255, 255, 255, 100); // Borde blanco sutil
  strokeWeight(1.5);
  noFill();
  rect(cardX, cardY, cardW, cardH, cardRadius);

  // 4. Dibujar el contenido de la UI sobre el cristal
  drawPlaceholderContent(cardX, cardY, cardW, 350);

  // Fondo de la barra de navegación (una capa de cristal ligeramente más opaca)
  fill(255, 255, 255, 50);
  noStroke();
  rect(cardX, 400, cardW, 150, 0, 0, cardRadius, cardRadius);

  // 5. Dibujar los elementos de navegación
  updateSelection();
  for (let i = 0; i < navItems.length; i++) {
    let item = navItems[i];
    // Usar nuestras cores NEO.FLOWOFF para ícones e texto
    let iconColor =
      i === selectedItemIndex && item.icon !== 'start'
        ? color(255, 47, 179)
        : color(230); // --neon quando selecionado
    let textColor =
      i === selectedItemIndex && item.icon !== 'start'
        ? color(255, 47, 179)
        : color(230); // --neon quando selecionado

    if (i === selectedItemIndex && item.icon !== 'start') {
      drawGreenIndicator(item.x, item.y + 45);
    }

    if (item.icon === 'start') {
      drawStartButton(item.x, item.y - 15);
    } else {
      drawIcon(item.icon, item.x, item.y - 15, iconColor);
      fill(textColor);
      noStroke();
      text(item.label, item.x, item.y + 15);
    }
  }
}

// NUEVA FUNCIÓN: Dibuja y mueve los orbes en un lienzo específico (g)
function drawAndMoveOrbs(g) {
  // Mover orbe 1
  orb1.x += orb1.vx;
  orb1.y += orb1.vy;
  if (orb1.x < orb1.r || orb1.x > g.width - orb1.r) orb1.vx *= -1;
  if (orb1.y < orb1.r || orb1.y > g.height - orb1.r) orb1.vy *= -1;

  // Mover orbe 2
  orb2.x += orb2.vx;
  orb2.y += orb2.vy;
  if (orb2.x < orb2.r || orb2.x > g.width - orb2.r) orb2.vx *= -1;
  if (orb2.y < orb2.r || orb2.y > g.height - orb2.r) orb2.vy *= -1;

  // Dibujar orbes
  g.noStroke();
  g.fill(orb1.color);
  g.ellipse(orb1.x, orb1.y, orb1.r * 2);
  g.fill(orb2.color);
  g.ellipse(orb2.x, orb2.y, orb2.r * 2);
}

function drawPlaceholderContent(x, y, w, h) {
  fill(255, 255, 255, 50); // Elementos de contenido semitransparentes
  noStroke();
  ellipse(x + 100, y + 100, 60, 60);
  rect(x + 150, y + 85, 200, 20, 5);
  rect(x + 150, y + 115, 150, 20, 5);
  ellipse(x + 100, y + 200, 60, 60);
  rect(x + 150, y + 185, 200, 20, 5);
  rect(x + 150, y + 215, 150, 20, 5);
  rect(x + 100, y + 280, 500, 20, 5);
  rect(x + 100, y + 310, 400, 20, 5);
}

function drawIcon(type, x, y, c) {
  stroke(c);
  strokeWeight(2);
  noFill();
  switch (type) {
    case 'home':
      triangle(x, y - 20, x - 15, y - 5, x + 15, y - 5);
      rect(x - 15, y - 5, 30, 20, 3);
      break;
    case 'projects':
      rect(x - 20, y - 10, 40, 25, 5);
      line(x, y - 10, x, y + 15);
      line(x - 20, y - 10, x + 20, y - 10);
      break;
      break;
    case 'miniapp': // Ícone de Smartphone/Bot
      rect(x - 10, y - 18, 20, 36, 4); // Corpo do celular
      line(x - 5, y + 12, x + 5, y + 12); // Botão home
      ellipse(x, y - 10, 8, 8); // Câmera/Logo
      break;
    case 'ecosystem':
      rect(x - 15, y - 10, 30, 20, 3);
      line(x + 15, y - 10, x + 20, y - 15);
      arc(x + 20, y - 15, 10, 10, PI, TWO_PI);
      ellipse(x - 10, y + 10, 8, 8);
      ellipse(x + 10, y + 10, 8, 8);
      break;
  }
}

function drawStartButton(x, y) {
  let btnColor = color(255, 47, 179, 200); // --neon (rosa) com transparência
  let innerColor = color(255);
  let d = dist(mouseX, mouseY, x, y);
  let glowAmount = map(d, 0, 80, 30, 0, true);

  drawingContext.filter = `blur(${glowAmount}px)`;
  fill(btnColor);
  noStroke();
  ellipse(x, y, exchangeButtonRadius * 2, exchangeButtonRadius * 2);
  drawingContext.filter = 'none';

  fill(btnColor);
  ellipse(x, y, exchangeButtonRadius * 2, exchangeButtonRadius * 2);

  fill(innerColor);
  noStroke();
  ellipse(x, y - 10, 10, 10);
  ellipse(x, y + 10, 10, 10);
  rect(x - 2, y - 5, 4, 10, 2);
}

function drawGreenIndicator(x, y) {
  let indicatorColor = color(0, 208, 255); // --blue (azul ciano) para indicador
  let indicatorWidth = 50;
  let indicatorHeight = 5;
  let glow = 15;

  drawingContext.filter = `blur(${glow}px)`;
  fill(indicatorColor);
  noStroke();
  rect(x - indicatorWidth / 2, y, indicatorWidth, indicatorHeight, 5);
  drawingContext.filter = 'none';

  fill(indicatorColor);
  rect(x - indicatorWidth / 2, y, indicatorWidth, indicatorHeight, 5);
}

function updateSelection() {
  selectedItemIndex = -1;
  for (let i = 0; i < navItems.length; i++) {
    let item = navItems[i];
    let iconCenterY = item.y - 15;
    let hitAreaWidth = 80;
    let hitAreaHeight = 80;
    if (
      mouseX > item.x - hitAreaWidth / 2 &&
      mouseX < item.x + hitAreaWidth / 2 &&
      mouseY > iconCenterY - hitAreaHeight / 2 &&
      mouseY < iconCenterY + hitAreaHeight / 2
    ) {
      selectedItemIndex = i;
      break;
    }
  }
}

// === INTEGRAÇÃO COM NOSSO SISTEMA DE ROTAS ===
function mousePressed() {
  for (let i = 0; i < navItems.length; i++) {
    let item = navItems[i];
    let iconCenterY = item.y - 15;
    let hitAreaWidth = 80;
    let hitAreaHeight = 80;

    if (
      mouseX > item.x - hitAreaWidth / 2 &&
      mouseX < item.x + hitAreaWidth / 2 &&
      mouseY > iconCenterY - hitAreaHeight / 2 &&
      mouseY < iconCenterY + hitAreaHeight / 2
    ) {
      // Mapear para nossas rotas existentes
      const routeMap = {
        home: 'home',
        projects: 'projects',
        start: 'start',
        miniapp: 'miniapp', // Nova rota
        ecosystem: 'ecosystem',
      };

      const route = routeMap[item.icon];
      if (route && typeof go === 'function') {
        go(route);
      }
      break;
    }
  }
}
