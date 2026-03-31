import * as esbuild from 'esbuild';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 5173;
const BUILD_DIR = path.join(__dirname, 'dist');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Ensure dist directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Copy index.html to dist
const htmlContent = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
fs.writeFileSync(path.join(BUILD_DIR, 'index.html'), htmlContent);

// Create esbuild context for rebuild
const buildConfig = {
  entryPoints: [path.join(__dirname, 'src/main.jsx')],
  bundle: true,
  outfile: path.join(BUILD_DIR, 'main.js'),
  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.gif': 'file',
    '.svg': 'file',
    '.css': 'css',
  },
  publicPath: '/',
};

async function start() {
  const ctx = await esbuild.context(buildConfig);

  // Initial build
  await ctx.rebuild();
  console.log('✓ Initial build complete');

  // Watch for changes
  await ctx.watch();
  console.log('✓ Watching for changes...');

  // Start HTTP server
  http.createServer((req, res) => {
    const requestPath = (req.url || '/').split('?')[0].replace(/^\/+/, '');
    const isCropImage = requestPath.startsWith('crop_images/');
    const baseDir = isCropImage ? PUBLIC_DIR : BUILD_DIR;
    const filepath = path.join(baseDir, requestPath || 'index.html');

    try {
      const content = fs.readFileSync(filepath);
      const ext = path.extname(filepath);
      const mimeTypes = {
        '.js': 'text/javascript',
        '.jsx': 'text/javascript',
        '.json': 'application/json',
        '.css': 'text/css',
        '.html': 'text/html',
        '.svg': 'image/svg+xml',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain' });
      res.end(content);
    } catch (e) {
      if (req.url !== '/' && req.url.startsWith('/api')) {
        res.writeHead(404);
        res.end('API proxy would go here');
      } else {
        // Fallback to index.html for client-side routing
        try {
          const indexContent = fs.readFileSync(path.join(BUILD_DIR, 'index.html'));
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(indexContent);
        } catch {
          res.writeHead(404);
          res.end('Not found');
        }
      }
    }
  }).listen(PORT, () => {
    console.log(`\n✓ Dev server running at http://localhost:${PORT}\n`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
