// Para onde o convite é enviado.
// Com um número em "whatsapp" (só dígitos, com 55 e DDD), o formulário abre o WhatsApp
// com a mensagem pronta. Sem número, copia o texto e leva pro direct do Instagram.
const CONFIG = {
  whatsapp: '',
  instagram: 'brunomeirab_',
};

const form = document.getElementById('form-convite');
const erro = document.getElementById('form-erro');
const saida = document.getElementById('form-saida');
const texto = document.getElementById('form-texto');
const direct = document.getElementById('form-direct');

function formatarData(valor) {
  if (!valor) return '';
  const [ano, mes, dia] = valor.split('-');
  return `${dia}/${mes}/${ano}`;
}

function montarMensagem(dados) {
  const linhas = [
    'Convite para o Bruno Meira',
    `Nome: ${dados.nome}`,
    `Igreja ou evento: ${dados.igreja}`,
    `Cidade: ${dados.cidade}`,
    dados.data && `Data prevista: ${formatarData(dados.data)}`,
    `Tipo de evento: ${dados.tipo}`,
    dados.publico && `Público estimado: ${dados.publico}`,
    `WhatsApp: ${dados.whats}`,
    dados.mensagem && `Sobre o evento: ${dados.mensagem}`,
  ];
  return linhas.filter(Boolean).join('\n');
}

form.addEventListener('submit', async (evento) => {
  evento.preventDefault();

  const dados = Object.fromEntries(
    [...new FormData(form)].map(([chave, valor]) => [chave, String(valor).trim()])
  );

  let invalido = false;
  for (const campo of form.querySelectorAll('[required]')) {
    const vazio = !campo.value.trim();
    campo.setAttribute('aria-invalid', String(vazio));
    if (vazio && !invalido) {
      invalido = true;
      campo.focus();
    }
  }
  erro.hidden = !invalido;
  if (invalido) {
    saida.hidden = true;
    return;
  }

  const mensagem = montarMensagem(dados);

  if (CONFIG.whatsapp) {
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(mensagem)}`, '_blank', 'noopener');
    return;
  }

  try {
    await navigator.clipboard.writeText(mensagem);
  } catch {
    // sem permissão de área de transferência: o texto fica visível pra copiar à mão
  }
  texto.textContent = mensagem;
  direct.href = `https://ig.me/m/${CONFIG.instagram}`;
  saida.hidden = false;
  saida.scrollIntoView({ block: 'nearest' });
});
