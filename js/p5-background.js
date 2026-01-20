// FlowOFF p5.js Background Effects
// Efeitos visuais interativos para o PWA FlowOFF
// Baseado no design system NEØ

let particles = [];
let connections = [];
let mouseWaves = []; // Array para ondas do mouse
let flowoffColors = {
  neon: '#ff2fb3',
  violet: '#7a2cff',
  blue: '#00d0ff',
  bg: '#0a0a0f',
  panel: '#0f0f16',
};

let mousePos = { x: 0, y: 0 };
let isMobile = window.innerWidth <= 768;
let particleCount = isMobile ? 8 : 15; // Menos partículas para efeito de estrelas

function setup() {
  // Criar canvas de fundo
  let canvas = createCanvas(windowWidth, windowHeight);
  canvas.parent('app');
  canvas.style('position', 'fixed');
  canvas.style('top', '0');
  canvas.style('left', '0');
  canvas.style('z-index', '-1');
  canvas.style('pointer-events', 'none');

  // Inicializar partículas
  for (let i = 0; i < particleCount; i++) {
    particles.push(new FlowoffParticle());
  }

  // Configurar cores
  colorMode(HSB, 360, 100, 100, 100);
}

function draw() {
  // Background escuro para contraste com estrelas
  background(240, 100, 2, 5); // Muito escuro e sutil

  // Atualizar estrelas
  particles.forEach((particle) => {
    particle.update();
    particle.display();
  });

  // Desenhar conexões sutis entre estrelas
  drawConnections();

  // Efeito de mouse interaction
  if (mouseX > 0 && mouseY > 0) {
    mousePos.x = mouseX;
    mousePos.y = mouseY;
    drawMouseInteraction();
  }

  // Limpeza periódica das ondas (a cada 5 segundos)
  if (frameCount % 300 === 0) {
    mouseWaves = mouseWaves.filter((wave) => wave.life > 0.1);
  }
}

class FlowoffParticle {
  constructor() {
    this.x = random(width);
    this.y = random(height);
    this.vx = random(-0.1, 0.1); // Movimento muito lento para estrelas
    this.vy = random(-0.1, 0.1);
    this.size = random(1, 3); // Tamanho menor para estrelas
    this.depth = random(0.3, 1.0); // Profundidade (0.3 = fundo, 1.0 = frente)
    this.alpha = random(40, 80); // Alpha baseado na profundidade
    this.pulse = random(0, TWO_PI);
    this.pulseSpeed = random(0.005, 0.015); // Pulsação muito lenta
    this.twinkle = random(0, TWO_PI); // Brilho piscante
    this.twinkleSpeed = random(0.02, 0.05);
  }

  update() {
    // Movimento muito lento baseado na profundidade
    this.x += this.vx * this.depth;
    this.y += this.vy * this.depth;

    // Wrap around nas bordas (estrelas aparecem do outro lado)
    if (this.x < 0) this.x = width;
    if (this.x > width) this.x = 0;
    if (this.y < 0) this.y = height;
    if (this.y > height) this.y = 0;

    // Pulsação baseada na profundidade
    this.pulse += this.pulseSpeed * this.depth;
    this.currentSize = this.size * this.depth + sin(this.pulse) * 0.3;

    // Brilho piscante (twinkle)
    this.twinkle += this.twinkleSpeed;
    this.twinkleAlpha = map(sin(this.twinkle), -1, 1, 0.3, 1.0);

    // Alpha baseado na profundidade e twinkle
    this.currentAlpha = this.alpha * this.depth * this.twinkleAlpha;

    // Interação sutil com mouse (apenas estrelas próximas)
    let distance = dist(this.x, this.y, mousePos.x, mousePos.y);
    if (distance < 80) {
      let force = map(distance, 0, 80, 0.02, 0) * this.depth;
      let angle = atan2(this.y - mousePos.y, this.x - mousePos.x);
      this.vx += cos(angle) * force;
      this.vy += sin(angle) * force;
    }

    // Limitar velocidade baseado na profundidade
    this.vx = constrain(this.vx, -0.5 * this.depth, 0.5 * this.depth);
    this.vy = constrain(this.vy, -0.5 * this.depth, 0.5 * this.depth);
  }

  display() {
    // Cor branca para estrelas
    let starColor = color(255, 255, 255); // Branco puro
    starColor.setAlpha(this.currentAlpha);

    // Desenhar estrela principal
    fill(starColor);
    noStroke();
    ellipse(this.x, this.y, this.currentSize);

    // Efeito de brilho baseado na profundidade
    if (this.depth > 0.7) {
      // Apenas estrelas próximas têm brilho
      // Brilho central
      starColor.setAlpha(this.currentAlpha * 0.3);
      fill(starColor);
      ellipse(this.x, this.y, this.currentSize * 2);

      // Brilho externo
      starColor.setAlpha(this.currentAlpha * 0.1);
      fill(starColor);
      ellipse(this.x, this.y, this.currentSize * 4);
    }

    // Efeito de profundidade com desfoque
    if (this.depth < 0.5) {
      // Estrelas distantes ficam desfocadas
      starColor.setAlpha(this.currentAlpha * 0.5);
      fill(starColor);
      ellipse(this.x, this.y, this.currentSize * 1.5);
    }
  }
}

function drawConnections() {
  // Conexões muito sutis entre estrelas próximas
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      let distance = dist(
        particles[i].x,
        particles[i].y,
        particles[j].x,
        particles[j].y
      );

      if (distance < 80) {
        // Distância menor para estrelas
        let alpha = map(distance, 0, 80, 10, 0); // Alpha muito baixo
        let strokeColor = color(255, 255, 255); // Branco sutil
        strokeColor.setAlpha(alpha);
        stroke(strokeColor);
        strokeWeight(0.2); // Linha muito fina
        line(particles[i].x, particles[i].y, particles[j].x, particles[j].y);
      }
    }
  }
}

// Classe para ondas do mouse com fade out
class MouseWave {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = 50;
    this.alpha = 40;
    this.life = 1.0;
    this.speed = 3;
    this.fadeSpeed = 0.03; // Fade mais rápido
  }

  update() {
    this.radius += this.speed;
    this.life -= this.fadeSpeed;
    this.alpha = 40 * this.life * this.life; // Fade quadrático para desaparecer completamente

    // Remover quando alpha for muito baixo ou vida acabar
    return this.life > 0.01 && this.alpha > 0.1;
  }

  display() {
    if (this.life <= 0.01 || this.alpha <= 0.1) return;

    noFill();
    let waveColor = color(flowoffColors.blue);
    waveColor.setAlpha(this.alpha);
    stroke(waveColor);
    strokeWeight(0.8);
    ellipse(this.x, this.y, this.radius * 2);
  }
}

function drawMouseInteraction() {
  // Atualizar e desenhar ondas existentes
  for (let i = mouseWaves.length - 1; i >= 0; i--) {
    if (mouseWaves[i].update()) {
      mouseWaves[i].display();
    } else {
      // Remover onda quando vida acabar ou alpha muito baixo
      mouseWaves.splice(i, 1);
    }
  }

  // Limpeza adicional: remover ondas muito antigas
  if (mouseWaves.length > 5) {
    mouseWaves.splice(0, mouseWaves.length - 5);
  }
}

// Função para criar nova onda no clique do mouse
function mousePressed() {
  if (mouseX > 0 && mouseY > 0) {
    // Limpar ondas muito antigas antes de criar nova
    if (mouseWaves.length > 3) {
      mouseWaves.splice(0, mouseWaves.length - 3);
    }
    mouseWaves.push(new MouseWave(mouseX, mouseY));
  }
}

// Função para limpar todas as ondas (útil para debug)
function clearAllWaves() {
  mouseWaves = [];
}

// Responsividade
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  isMobile = window.innerWidth <= 768;

  // Ajustar número de partículas
  let newCount = isMobile ? 20 : 40;
  if (particles.length !== newCount) {
    particles = [];
    for (let i = 0; i < newCount; i++) {
      particles.push(new FlowoffParticle());
    }
  }
}

// Pausar animação quando não visível (performance)
document.addEventListener('visibilitychange', function () {
  if (document.hidden) {
    // Pausar animação quando página não está visível
    if (typeof noLoop === 'function') {
      noLoop();
    }
  } else {
    // Retomar animação quando página volta a ficar visível
    if (typeof loop === 'function') {
      loop();
    }
  }
});

// Inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    // p5.js será inicializado automaticamente
  });
}
