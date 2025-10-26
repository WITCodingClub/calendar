import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const extensionDir = path.join(__dirname, 'extension');
const immutableDir = path.join(extensionDir, 'scripts', 'immutable');
const assetsDir = path.join(immutableDir, 'assets');
const indexPath = path.join(extensionDir, 'index.html');

function findAndRenameFiles() {
  const renames = [];

  if (fs.existsSync(immutableDir)) {
    const files = fs.readdirSync(immutableDir);
    const jsFile = files.find(f => f.startsWith('bundle') && f.endsWith('.js'));
    
    if (jsFile && jsFile !== 'bundle.js') {
      const oldPath = path.join(immutableDir, jsFile);
      const newPath = path.join(immutableDir, 'bundle.js');
      fs.renameSync(oldPath, newPath);
      renames.push({ old: `scripts/immutable/${jsFile}`, new: 'scripts/immutable/bundle.js' });
      console.log(`Renamed ${jsFile} -> bundle.js`);
    }
  }

  if (fs.existsSync(assetsDir)) {
    const files = fs.readdirSync(assetsDir);
    const cssFile = files.find(f => f.startsWith('bundle') && f.endsWith('.css'));
    
    if (cssFile && cssFile !== 'style.css') {
      const oldPath = path.join(assetsDir, cssFile);
      const newPath = path.join(assetsDir, 'style.css');
      fs.renameSync(oldPath, newPath);
      renames.push({ old: `scripts/immutable/assets/${cssFile}`, new: 'scripts/immutable/assets/style.css' });
      console.log(`Renamed ${cssFile} -> style.css`);
    }
  }

  return renames;
}

function updateIndexHtml(renames) {
  if (!fs.existsSync(indexPath)) {
    console.log('index.html not found');
    return;
  }

  let html = fs.readFileSync(indexPath, 'utf-8');

  for (const { old, new: newPath } of renames) {
    const patterns = [
      new RegExp(old, 'g'),
      new RegExp('\\./' + old, 'g')
    ];
    
    for (const pattern of patterns) {
      html = html.replace(pattern, './' + newPath);
    }
  }

  const inlineScriptMatch = html.match(/<script>\s*\{\s*(__sveltekit_\w+)\s*=[\s\S]*?import\("\.\/\.\/scripts\/immutable\/bundle\.js"\)[\s\S]*?\}\s*<\/script>/);
  
  if (inlineScriptMatch) {
    const svelteKitVar = inlineScriptMatch[1];
    console.log(`Found SvelteKit variable: ${svelteKitVar}`);
    
    const initJsContent = `globalThis.${svelteKitVar} = {
	base: new URL(".", location).pathname.slice(0, -1)
};

const element = document.body.querySelector('div[style*="display: contents"]');

import("./immutable/bundle.js").then((app) => {
	app.start(element, {
		node_ids: [0, 2],
		data: [null,null],
		form: null,
		error: null
	})
});
`;
    
    const initJsPath = path.join(extensionDir, 'scripts', 'init.js');
    fs.writeFileSync(initJsPath, initJsContent, 'utf-8');
    console.log('Created init.js with correct SvelteKit variable');
    
    html = html.replace(inlineScriptMatch[0], '<script src="././scripts/init.js" type="module"></script>');
  }

  fs.writeFileSync(indexPath, html, 'utf-8');
  console.log('Updated index.html with new file references');
}

const renames = findAndRenameFiles();
updateIndexHtml(renames);