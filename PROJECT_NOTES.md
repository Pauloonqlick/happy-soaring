# Happy Soaring — Notas do Projeto

Resumo de contexto para continuar o trabalho numa nova conversa/sessão, sem perder o histórico de decisões.

## Estado atual (2026-07-01)

- Landing page criada e publicada em produção.
- Site: **https://happysoaring.com** (também acessível em https://happy-soaring.pages.dev)
- Código: **https://github.com/Pauloonqlick/happy-soaring** (repositório público)
- Deploy: Cloudflare Pages, projeto `happy-soaring`
- Domínio `happysoaring.com` comprado na Cloudflare e ligado ao projeto Pages via dashboard (Workers & Pages → happy-soaring → Custom domains)

## Stack técnica

- React + Vite (sem TypeScript, sem router — página única)
- Sem backend, sem login, sem loja, sem painel admin (por decisão explícita do utilizador — é só uma landing page rápida)
- Deploy manual via `wrangler pages deploy dist --project-name=happy-soaring` (ainda não há CI/CD automático ligado ao GitHub)

## Estrutura de ficheiros

```
HappySoaring/
├── public/
│   ├── images/           ← imagens do slideshow (slides 2-3 ainda placeholders SVG; slides 1 e 4 são imagens reais)
│   └── favicon.svg       ← ainda o favicon default do Vite, substituir
├── src/
│   ├── components/
│   │   ├── Slideshow.jsx / .css       ← slideshow do topo (autoplay 5s, ver detalhes abaixo)
│   │   ├── FlowParagliders.jsx / .css ← secção "dealers Flow Paragliders" (única secção azul)
│   │   └── Footer.jsx / .css
│   ├── App.jsx / App.css   ← layout geral da página
│   ├── index.css           ← variáveis de cor da marca (--hs-orange, --hs-black, --hs-blue, etc.)
│   └── main.jsx
└── index.html
```

## Decisões de design

- Cores da marca: laranja, preto, branco em todo o site.
- Azul **apenas** na secção Flow Paragliders (regra explícita do utilizador).
- Mobile-first, visual limpo/premium.
- Imagens do slideshow (slides 2-3) são placeholders (gradientes SVG) — substituir em `public/images/slide-2.svg`, `slide-3.svg` por fotos reais assim que existirem (ajustar caminhos em `Slideshow.jsx` se os nomes dos ficheiros mudarem).

## Slideshow — uma imagem por slide (2026-07-02)

- Cada slide tem **um único campo `image`**, usado tal e qual tanto em desktop como em mobile (`background-size: cover` faz o recorte automático conforme o ecrã). Não há distinção `imageMobile` — chegámos a ter essa separação (ver histórico do git, commits à volta de `efc708b`) mas foi propositadamente revertida a pedido do utilizador para simplificar a manutenção.
- **Proporção de referência para novas imagens**: 1920×1200 (rácio 8:5, paisagem). Ao ser cortada em ecrãs estreitos (`cover`), o conteúdo importante deve estar centrado horizontalmente.
- Slide 1: foto real (`slide-1.jpg`, 1920×1200), com overlay de título+subtítulo.
- Slides 2-3: placeholders SVG, com overlay de título+subtítulo.
- **Slide 4** (parceria Happy Soaring × Fello Fly, "Every pilot has a color"): usa `slide-4.jpg` (1920×1200), uma versão landscape criada manualmente pelo utilizador a partir do poster vertical original — o design tem o conteúdo do poster centrado com um fundo desfocado/esticado a preencher as laterais, o que funciona bem tanto em desktop como cortado (`cover`) em mobile. Tem `noOverlay: true` porque a imagem já traz o texto da campanha embutido.
- Pendente: substituir slides 2-3 por fotos reais na mesma proporção (1920×1200).

## Comandos úteis

```
npm install          # instalar dependências
npm run dev           # correr localmente (http://localhost:5173)
npm run build          # gerar build de produção (pasta dist/)
npx wrangler pages deploy dist --project-name=happy-soaring --branch=master   # publicar manualmente
```

## Contas envolvidas

- GitHub: conta `Pauloonqlick`
- Cloudflare: conta associada a `paulo.reggae@gmail.com` (autenticado via `wrangler login`, OAuth — sem tokens/senhas guardados por mim)

## Notas de processo (para o assistente)

- Esta conversa foi originalmente criada com o projeto **ParakiteLog** como pasta principal da sessão; o HappySoaring foi adicionado como pasta adicional, não como raiz. Nunca foi criado nem alterado nenhum ficheiro dentro do ParakiteLog durante este trabalho.
- Para próximos passos: considerar configurar deploy automático (GitHub → Cloudflare Pages) para não depender de deploy manual a cada alteração.
- Por fazer / pendente: substituir imagens placeholder do slideshow (slides 2-3) e o favicon por assets reais da marca.
