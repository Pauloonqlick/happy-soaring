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
│   ├── images/           ← imagens do slideshow (slides 1-3 ainda placeholders SVG; slide 4 é imagem real)
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
- Imagens do slideshow (slides 1-3) são placeholders (gradientes SVG) — substituir em `public/images/slide-1.svg`, `slide-2.svg`, `slide-3.svg` por fotos reais assim que existirem (ajustar caminhos em `Slideshow.jsx` se os nomes dos ficheiros mudarem).

## Slideshow — imagens desktop vs mobile e slide 4 (2026-07-01)

- Cada slide pode ter `image` (desktop) e `imageMobile` (telemóvel). O componente troca o `background-image` via CSS custom properties (`--bg-desktop` / `--bg-mobile`) com `@media (max-width: 767px)` em `Slideshow.css`.
- **Proporções de referência**: desktop 1600×1000 (rácio 8:5, paisagem); mobile 800×1200 (rácio 2:3, retrato). Para fotos reais, exportar em resolução mais alta mantendo o mesmo rácio (ex: desktop 1920×1200, mobile 1200×1800).
- Slides 1-3: têm `image` + `imageMobile` (placeholders SVG landscape/portrait) e overlay de título+subtítulo por cima da imagem.
- **Slide 4** (novo, parceria Happy Soaring × Fello Fly, "Every pilot has a color"): só tem `imageMobile` (`public/images/slide-4-mobile.jpg`, 1200×1800, ~400 KB, redimensionado a partir do original em `Downloads/every pilot has a color.png` que já vinha em 2400×3600 = rácio 2:3, perfeito para mobile). Não tem `image` (desktop) porque o design é um poster vertical — não há versão landscape ainda.
- Por isso o `Slideshow.jsx` deteta o viewport via `window.matchMedia('(max-width: 767px)')`: em **mobile mostra os 4 slides**; em **desktop filtra e mostra só os 3 slides que têm `image`** (o slide 4 fica invisível em ecrãs ≥768px).
- Slide 4 tem `noOverlay: true` — não mostra título/subtítulo sobreposto, porque a imagem já tem o texto da campanha embutido no design ("Every pilot has a color", "Happy Soaring and Fello Fly make it possible", etc.).
- Pendente: se um dia houver uma versão landscape deste design da parceria, adicionar o campo `image` ao slide 4 em `Slideshow.jsx` para também aparecer em desktop.

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
- Por fazer / pendente: substituir imagens placeholder do slideshow (slides 1-3) e o favicon por assets reais da marca; criar versão landscape do design do slide 4 (parceria Fello Fly) para também aparecer em desktop.
