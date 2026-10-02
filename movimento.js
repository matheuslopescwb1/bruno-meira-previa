// Movimento do site conforme a rolagem.
// É só acabamento: sem este arquivo o site continua inteiro e legível.
// Quem pede menos animação no sistema (prefers-reduced-motion) vê o site parado,
// só com o menu fixo, a barra de leitura e a seção atual marcada no menu.

const reduzido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const computador = window.matchMedia('(min-width: 760px)');

const limitar = (valor, min = 0, max = 1) => Math.min(max, Math.max(min, valor));

// Distância até o topo da página sem contar transform (as revelações deslocam os elementos).
function topoNaPagina(el) {
  let topo = 0;
  for (let atual = el; atual; atual = atual.offsetParent) topo += atual.offsetTop;
  return topo;
}

const nav = document.querySelector('.nav');
const abertura = document.querySelector('.abertura');
const progresso = document.querySelector('.progresso');

// ---------- medidas, refeitas quando a página muda de tamanho ----------

const medida = { vh: 0, rolagemMax: 0, abertura: 0 };
const paralaxes = [];
const linhas = [];
let manifesto = null;
let quarto = null;

function medir() {
  medida.vh = window.innerHeight;
  medida.rolagemMax = document.documentElement.scrollHeight - medida.vh;
  medida.abertura = abertura.offsetHeight;

  for (const p of paralaxes) {
    p.topo = topoNaPagina(p.el);
    p.altura = p.el.offsetHeight;
  }
  for (const l of linhas) {
    l.topo = topoNaPagina(l.el);
    l.altura = l.el.offsetHeight;
    // o ponto de cada marco fica 13px abaixo do topo dele
    for (const m of l.marcos) m.ponto = topoNaPagina(m.el) + 13;
  }
  if (manifesto) {
    manifesto.topo = topoNaPagina(manifesto.el);
    manifesto.altura = manifesto.el.offsetHeight;
  }
  if (quarto) quarto.alvoTopo = topoNaPagina(quarto.alvo);

  agendar();
}

// ---------- a cada quadro de rolagem: só conta com scrollY, sem ler o layout ----------

let agendado = false;
let ancora = window.scrollY;

function agendar() {
  if (agendado) return;
  agendado = true;
  requestAnimationFrame(quadro);
}

function quadro() {
  agendado = false;
  const y = window.scrollY;
  const { vh } = medida;

  // menu: vira cápsula assim que a rolagem começa; depois da abertura, some ao descer e volta ao subir
  nav.classList.toggle('nav--solta', y > 60);
  const longe = y > medida.abertura * .6;
  if (!longe || reduzido) {
    nav.classList.remove('nav--escondida');
    ancora = y;
  } else if (y > ancora + 24) {
    nav.classList.add('nav--escondida');
    ancora = y;
  } else if (y < ancora - 24) {
    nav.classList.remove('nav--escondida');
    ancora = y;
  }

  progresso.style.transform = `scaleX(${medida.rolagemMax > 0 ? limitar(y / medida.rolagemMax) : 0})`;

  if (reduzido) return;

  abertura.style.setProperty('--sai', limitar(y / medida.abertura).toFixed(3));

  for (const p of paralaxes) {
    const valor = limitar((p.topo + p.altura / 2 - (y + vh / 2)) / (vh / 2 + p.altura / 2), -1, 1);
    if (valor !== p.valor) {
      p.valor = valor;
      p.el.style.setProperty('--p', valor.toFixed(3));
    }
  }

  if (manifesto) {
    // começa quando o texto entra pela parte de baixo e termina quando ele passa do meio da tela
    const lido = limitar((y + vh * .85 - manifesto.topo) / (manifesto.altura + vh * .4));
    const acesas = Math.round(lido * manifesto.palavras.length);
    if (acesas !== manifesto.acesas) {
      manifesto.palavras.forEach((palavra, i) => palavra.classList.toggle('acesa', i < acesas));
      manifesto.acesas = acesas;
    }
  }

  // a linha da trajetória se enche até um ponto a 62% da altura da tela
  const ponto = y + vh * .62;
  for (const l of linhas) {
    const enche = limitar((ponto - l.topo) / l.altura);
    if (enche !== l.enche) {
      l.enche = enche;
      l.el.style.setProperty('--enche', enche.toFixed(4));
    }
    for (const m of l.marcos) m.el.classList.toggle('aceso', ponto >= m.ponto);
  }

  if (quarto) {
    // no computador a foto fica parada ao lado do texto e clareia quando a leitura chega em "Era Jesus."
    const luz = computador.matches ? limitar((y + vh * .9 - quarto.alvoTopo) / (vh * .45)) : 1;
    quarto.el.style.setProperty('--luz', luz.toFixed(3));
    quarto.el.style.setProperty('--brilho', computador.matches ? luz.toFixed(3) : '0');
  }
}

// ---------- seção atual marcada no menu ----------

const links = new Map([...nav.querySelectorAll('.nav__links a')].map((a) => [a.hash.slice(1), a]));
const secaoAtual = new IntersectionObserver((entradas) => {
  for (const e of entradas) links.get(e.target.id).classList.toggle('ativo', e.isIntersecting);
}, { rootMargin: '-45% 0px -54% 0px' });
for (const id of links.keys()) secaoAtual.observe(document.getElementById(id));

// ---------- só com movimento liberado ----------

if (!reduzido) {
  // fotos que andam mais devagar que a página
  for (const el of document.querySelectorAll('.citacao, .alcance, .creio__foto, .convite__foto')) {
    paralaxes.push({ el });
  }

  // manifesto palavra por palavra
  const texto = document.querySelector('.manifesto__texto');
  const palavras = texto.textContent.trim().split(/\s+/);
  texto.textContent = '';
  palavras.forEach((palavra, i) => {
    const span = document.createElement('span');
    span.className = 'palavra';
    span.textContent = palavra;
    texto.append(span, i < palavras.length - 1 ? ' ' : '');
  });
  manifesto = { el: texto, palavras: [...texto.querySelectorAll('.palavra')], acesas: -1 };

  // linha da trajetória
  for (const el of document.querySelectorAll('.linha')) {
    el.classList.add('linha--viva');
    linhas.push({ el, marcos: [...el.querySelectorAll('.marco')].map((m) => ({ el: m })) });
  }

  const cenaQuarto = document.querySelector('.quarto');
  quarto = { el: cenaQuarto, alvo: cenaQuarto.querySelector('.quarto__destaque') };

  // elementos que entram na tela; os que chegam juntos entram em sequência
  const revelar = new IntersectionObserver((entradas) => {
    entradas
      .filter((e) => e.isIntersecting)
      .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left)
      .forEach((e, i) => {
        e.target.style.setProperty('--atraso', `${Math.min(i, 6) * 90}ms`);
        e.target.classList.add('visivel');
        revelar.unobserve(e.target);
      });
  }, { rootMargin: '0px 0px -10% 0px' });

  const grupos = {
    revela: '.cabeca .sobretitulo, .pilulas li, .citacao blockquote footer, .marco, .quarto__texto > :not(.quarto__titulo):not(.quarto__destaque), .creio__foto, .crenca, .frente, .alcance .sobretitulo, .numeros > div, .convite__lado .sobretitulo, .convite__apoio, .convite__foto, .formulario',
    'revela--titulo': '.titulo, .citacao blockquote p, .quarto__titulo, .quarto__destaque',
    traco: '.circulo',
  };
  for (const [classe, seletor] of Object.entries(grupos)) {
    for (const el of document.querySelectorAll(seletor)) {
      el.classList.add(classe);
      revelar.observe(el);
    }
  }

  // números do Awake contando; leitor de tela recebe o número final direto
  const contar = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (!e.isIntersecting) continue;
      contar.unobserve(e.target);
      const { visual, modelo, alvo } = e.target._conta;
      const inicio = performance.now();
      const passo = (t) => {
        const k = limitar((t - inicio) / 1800);
        visual.textContent = modelo.replace(/\d+/, Math.round(alvo * (1 - (1 - k) ** 3)));
        if (k < 1) requestAnimationFrame(passo);
      };
      requestAnimationFrame(passo);
    }
  }, { threshold: .6 });

  for (const numero of document.querySelectorAll('[data-conta]')) {
    const modelo = numero.textContent;
    const visual = document.createElement('span');
    visual.setAttribute('aria-hidden', 'true');
    visual.textContent = modelo.replace(/\d+/, '0');
    const leitor = document.createElement('span');
    leitor.className = 'sr';
    leitor.textContent = modelo;
    numero.replaceChildren(visual, leitor);
    numero._conta = { visual, modelo, alvo: Number(numero.dataset.conta) };
    contar.observe(numero);
  }

  iniciarFaixa();
}

// ---------- faixa de frases: corre sozinha e acelera com a rolagem, no sentido dela ----------

function iniciarFaixa() {
  const faixa = document.querySelector('.faixa');
  const trilho = faixa.querySelector('.faixa__trilho');
  const itens = trilho.children;
  let periodo = 0;
  let x = 0;
  let velocidade = 0;
  let impulso = 0;
  let sentido = 1;
  let yAnterior = window.scrollY;
  let tAnterior = 0;
  let visivel = false;
  let rodando = false;

  // a faixa tem o texto duas vezes; o período é a distância até o começo da segunda cópia
  const medirFaixa = () => {
    periodo = itens[itens.length / 2].offsetLeft - itens[0].offsetLeft;
  };

  function passo(t) {
    if (!visivel || !periodo) {
      rodando = false;
      return;
    }
    const dt = Math.min((t - tAnterior) / 1000, .05);
    tAnterior = t;
    const y = window.scrollY;
    const dy = y - yAnterior;
    yAnterior = y;
    if (dy !== 0) sentido = dy > 0 ? 1 : -1;

    const base = periodo / 38; // a mesma velocidade da animação em CSS
    // o impulso sobe na hora e decai aos poucos: cada giro da roda do mouse vira um empurrão visível
    const rolagem = dt > 0 ? Math.min(Math.abs(dy) / dt, 6000) : 0;
    impulso = Math.max(impulso * Math.exp(-dt * 3), rolagem * .25);
    velocidade += (sentido * (base + Math.min(impulso, base * 18)) - velocidade) * Math.min(1, dt * 8);

    x = (x - velocidade * dt) % periodo;
    if (x > 0) x -= periodo;
    const inclinacao = limitar((velocidade - sentido * base) / base * .3, -5, 5);
    trilho.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0) skewX(${inclinacao.toFixed(2)}deg)`;
    requestAnimationFrame(passo);
  }

  faixa.classList.add('faixa--viva');
  medirFaixa();
  window.addEventListener('resize', medirFaixa);
  document.fonts?.ready.then(medirFaixa);

  new IntersectionObserver(([e]) => {
    visivel = e.isIntersecting;
    if (visivel && !rodando) {
      rodando = true;
      tAnterior = performance.now();
      yAnterior = window.scrollY;
      requestAnimationFrame(passo);
    }
  }).observe(faixa);
}

// ---------- ligar ----------

window.addEventListener('scroll', agendar, { passive: true });
window.addEventListener('resize', medir);
window.addEventListener('load', medir);
computador.addEventListener('change', medir);
document.fonts?.ready.then(medir);
new ResizeObserver(medir).observe(document.body);
medir();
