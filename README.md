# NodeGrid Landing Page

Site estático da NodeGrid — HTML/CSS vanilla com design system de tokens.

## Estrutura

```
nodegrid-landing/
├── index.html          # Landing page principal
├── portfolio.html      # Página de portfolio
├── css/
│   └── tokens.css      # Design system tokens (cores, tipografia, espaçamentos)
├── assets/
│   └── screenshots/    # Screenshots dos projectos (gerados automaticamente)
├── scripts/
│   └── take-screenshots.js  # Script de captura automática de screenshots
└── brand/              # Materiais de identidade de marca
```

## Desenvolvimento

Abrir directamente no browser:
```bash
open index.html
open portfolio.html
```

Ou com um servidor local:
```bash
npx serve .
# → http://localhost:3000
```

## Screenshots do Portfolio

O portfolio em `portfolio.html` usa screenshots automáticos dos projectos. Para capturar/actualizar:

```bash
# Capturar todos os projectos
node scripts/take-screenshots.js

# Capturar projecto específico
node scripts/take-screenshots.js video-task-manager
node scripts/take-screenshots.js hidden-hype
node scripts/take-screenshots.js hype-gest
node scripts/take-screenshots.js timetable-contracts
```

### Pré-requisitos para screenshots

```bash
npm i -D playwright
npx playwright install chromium
```

O script inicia automaticamente o servidor de desenvolvimento de cada projecto, captura o screenshot (1200×800px) e guarda em `assets/screenshots/`. Se um projecto não estiver disponível, gera um placeholder SVG com a cor de marca.

### Projectos e portas

| Projecto | Directório | Porta |
|----------|-----------|-------|
| Video-TaskManager | `workspaces/Video-TaskManager` | 3000 |
| Hidden Hype | `workspaces/hidden_hype` | 3001 |
| Hype-Gest (frontend) | `workspaces/hype-gest/frontend` | 5174 |
| Timetable Contracts | `workspaces/timetable-contracts` | 3003 |

## Deploy

O projecto está configurado para Netlify (`netlify.toml`). Push para o branch main dispara deploy automático.
