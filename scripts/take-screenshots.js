#!/usr/bin/env node
/**
 * take-screenshots.js
 * Starts each project's dev server, navigates with Playwright,
 * captures a 1200×800 screenshot, and saves to assets/screenshots/.
 * Falls back to an SVG placeholder if the server fails to start.
 *
 * Usage: node scripts/take-screenshots.js [project-name|all]
 * Examples:
 *   node scripts/take-screenshots.js
 *   node scripts/take-screenshots.js all
 *   node scripts/take-screenshots.js video-task-manager
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.resolve(__dirname, '../../../..');
const OUT_DIR = path.resolve(__dirname, '../assets/screenshots');

const PROJECTS = [
  {
    id: 'video-task-manager',
    name: 'Video-TaskManager',
    dir: path.join(ROOT, 'workspaces/Video-TaskManager'),
    cmd: 'npm run dev',
    port: 3000,
    route: '/',
    brandColor: '#35998f',
    category: 'Gestão de Produção',
  },
  {
    id: 'hidden-hype',
    name: 'Hidden Hype',
    dir: path.join(ROOT, 'workspaces/hidden_hype'),
    cmd: 'npm run dev',
    port: 3001,
    route: '/',
    brandColor: '#C9A84C',
    category: 'Eventos & Ticketing',
  },
  {
    id: 'hype-gest',
    name: 'Hype-Gest (EventOS)',
    dir: path.join(ROOT, 'workspaces/hype-gest/frontend'),
    cmd: 'npm run dev -- --port 5174',
    port: 5174,
    route: '/',
    brandColor: '#4a9a4a',
    category: 'Gestão de Eventos',
  },
  {
    id: 'timetable-contracts',
    name: 'Timetable Contracts',
    dir: path.join(ROOT, 'workspaces/timetable-contracts'),
    cmd: 'npm run dev -- -p 3003',
    port: 3003,
    route: '/',
    brandColor: '#B89A5E',
    category: 'Contratos Digitais',
  },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function log(msg) { process.stdout.write(`${msg}\n`); }
function ok(msg)  { process.stdout.write(`  ✓ ${msg}\n`); }
function err(msg) { process.stderr.write(`  ✗ ${msg}\n`); }

function waitForPort(port, timeout = 45000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      const req = http.get({ hostname: 'localhost', port, path: '/', timeout: 1000 }, (res) => {
        res.destroy();
        resolve();
      });
      req.on('error', () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Port ${port} did not open within ${timeout}ms`));
        } else {
          setTimeout(check, 800);
        }
      });
      req.end();
    };
    check();
  });
}

function generateSvgPlaceholder(project) {
  const { id, name, category, brandColor } = project;
  const safeCategory = category.replace(/&/g, '&amp;');
  const safeName = name.replace(/&/g, '&amp;');
  return `<svg width="1200" height="800" viewBox="0 0 1200 800" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="1" cy="1" r="1.2" fill="${brandColor}" opacity="0.3"/>
    </pattern>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${brandColor}" stop-opacity="0.25"/>
      <stop offset="100%" stop-color="${brandColor}" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="800" fill="#0a0a0a"/>
  <rect width="1200" height="800" fill="url(#dots)"/>
  <ellipse cx="600" cy="400" rx="400" ry="250" fill="url(#glow)"/>
  <text x="600" y="360" font-family="monospace" font-size="18" fill="${brandColor}" opacity="0.7"
        text-anchor="middle" letter-spacing="4" font-weight="500">${id.toUpperCase()}</text>
  <text x="600" y="415" font-family="sans-serif" font-size="42" font-weight="700" fill="#dcdcdc"
        text-anchor="middle">${safeName}</text>
  <text x="600" y="462" font-family="sans-serif" font-size="20" fill="${brandColor}" opacity="0.8"
        text-anchor="middle">${safeCategory}</text>
  <rect x="480" y="495" width="240" height="2" rx="1" fill="${brandColor}" opacity="0.35"/>
</svg>`;
}

async function screenshotWithPlaywright(project) {
  let browser;
  let serverProc;

  // Test if chromium launches before starting any server
  try {
    const { chromium } = require('playwright');
    const testBrowser = await chromium.launch({ headless: true });
    await testBrowser.close();
  } catch (launchErr) {
    throw new Error(`Chromium não disponível: ${launchErr.message.split('\n')[0]}`);
  }

  log(`\n[${project.id}] Iniciando dev server (porta ${project.port})...`);

  // Start dev server
  const shell = process.env.SHELL || '/bin/sh';
  serverProc = spawn(shell, ['-c', project.cmd], {
    cwd: project.dir,
    stdio: 'ignore',
    detached: true,
  });
  serverProc.on('error', () => {}); // suppress unhandled spawn errors
  serverProc.unref();

  try {
    await waitForPort(project.port);
    ok(`Servidor a responder em localhost:${project.port}`);
  } catch (e) {
    err(`Timeout a aguardar servidor: ${e.message}`);
    throw e;
  }

  // Playwright screenshot
  const { chromium } = require('playwright');
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1200, height: 800 });

  try {
    await page.goto(`http://localhost:${project.port}${project.route}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    // Brief pause for animations to settle
    await page.waitForTimeout(1500);

    const outPath = path.join(OUT_DIR, `${project.id}.png`);
    await page.screenshot({ path: outPath, fullPage: false });
    ok(`Screenshot guardado: assets/screenshots/${project.id}.png`);
  } finally {
    await browser.close();
    // Kill the dev server process group
    try {
      process.kill(-serverProc.pid, 'SIGTERM');
    } catch (_) {
      // Server may have already exited
    }
  }
}

function writeSvgPlaceholder(project) {
  const outPath = path.join(OUT_DIR, `${project.id}.svg`);
  fs.writeFileSync(outPath, generateSvgPlaceholder(project), 'utf8');
  ok(`Placeholder SVG gerado: assets/screenshots/${project.id}.svg`);
}

function checkPlaywright() {
  try {
    require.resolve('playwright');
    return true;
  } catch (_) {}
  // Check global/npx availability
  try {
    execSync('npx --yes playwright --version', { stdio: 'ignore', timeout: 10000 });
    return 'npx';
  } catch (_) {}
  return false;
}

// ── main ──────────────────────────────────────────────────────────────────────

async function run() {
  const arg = process.argv[2] || 'all';

  const targets = arg === 'all'
    ? PROJECTS
    : PROJECTS.filter(p => p.id === arg);

  if (targets.length === 0) {
    err(`Projecto não encontrado: ${arg}`);
    err(`Opções: all, ${PROJECTS.map(p => p.id).join(', ')}`);
    process.exit(1);
  }

  log(`\nNodeGrid — Screenshot Capture`);
  log(`Output: ${OUT_DIR}`);
  log(`Projectos: ${targets.map(p => p.id).join(', ')}\n`);

  // Ensure output directory exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pwAvailable = checkPlaywright();
  if (!pwAvailable) {
    log('⚠  Playwright não encontrado — a gerar placeholders SVG para todos os projectos.');
    log('   Para instalar: npm i -D playwright && npx playwright install chromium\n');
    for (const project of targets) {
      writeSvgPlaceholder(project);
    }
    log('\nDone. Substitui os SVG por screenshots reais quando instalares o Playwright.\n');
    return;
  }

  // If using npx, install playwright module temporarily
  if (pwAvailable === 'npx') {
    log('Playwright via npx — a instalar localmente...');
    execSync('npm i -D playwright', { cwd: path.resolve(__dirname, '..'), stdio: 'inherit' });
    execSync('npx playwright install chromium --with-deps', {
      cwd: path.resolve(__dirname, '..'),
      stdio: 'inherit',
    });
  }

  let successCount = 0;

  for (const project of targets) {
    try {
      await screenshotWithPlaywright(project);
      successCount++;
    } catch (e) {
      err(`Playwright falhou para ${project.id}: ${e.message}`);
      log(`  → A gerar placeholder SVG como fallback...`);
      writeSvgPlaceholder(project);
    }
  }

  log(`\n✓ Concluído — ${successCount}/${targets.length} screenshots reais capturados.\n`);

  if (successCount < targets.length) {
    log('Nota: os ficheiros .svg gerados são placeholders.');
    log('Actualiza os src nas <img> em portfolio.html de .png para .svg para os ver,');
    log('ou corre este script novamente quando os servidores estiverem disponíveis.\n');
  }
}

run().catch(e => {
  err(`Erro fatal: ${e.message}`);
  process.exit(1);
});
