#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir, { withFileTypes: true });
  list.forEach((d) => {
    const res = path.resolve(dir, d.name);
    if (d.isDirectory()) results = results.concat(walk(res));
    else results.push(res);
  });
  return results;
}

function readFiles(globDir) {
  try {
    return walk(globDir).filter((f) => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.tsx'));
  } catch (err) {
    return [];
  }
}

function extractFrontendEndpoints(files) {
  const endpoints = new Set();
  const usages = [];
  const axiosRegex = /axios\.(get|post|put|patch|delete)\s*\(\s*([`'\"])([\s\S]*?)\2/gm;

  files.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = axiosRegex.exec(src)) !== null) {
      const method = m[1].toUpperCase();
      const raw = m[3];
      const cleaned = raw.replace(/\${[^}]+}/g, ':param').trim();
      endpoints.add(`${method} ${cleaned}`);
      usages.push({ file: path.relative(process.cwd(), file), method, raw: cleaned });
    }
  });
  return { endpoints: Array.from(endpoints).sort(), usages };
}

function detectFrontendBaseURL() {
  const axiosPath = path.resolve('frontend', 'src', 'lib', 'axios.js');
  if (!fs.existsSync(axiosPath)) return '';
  try {
    const src = fs.readFileSync(axiosPath, 'utf8');
    const m = src.match(/baseURL\s*:\s*([`'\"])(.*?)\1/);
    if (m && m[2]) return m[2];
  } catch (err) {}
  return '';
}

function extractBackendRoutes(files) {
  const routes = [];
  // Capture method, route path, and the remaining handler/middlewares args
  const routerRegex = /router\.(get|post|put|patch|delete)\s*\(\s*([`'\"])(.*?)\2\s*(?:,\s*([\s\S]*?)\))?/gm;
  files.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    let m;
    while ((m = routerRegex.exec(src)) !== null) {
      const method = m[1].toUpperCase();
      const routePath = m[3];
      const args = (m[4] || '').trim();
      // Attempt to extract handler name (last identifier) and list of middleware tokens
      let handlerName = null;
      let middlewares = [];
      if (args) {
        // split by commas but ignore those inside parentheses (basic)
        const parts = args.split(',').map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
          // last part may end with ')' if our regex captured up to it; strip trailing )
          let last = parts[parts.length - 1].replace(/\)\s*;?$/, '').trim();
          // remove inline async wrappers like async (req, res) => { ... }
          const idMatch = last.match(/^([A-Za-z0-9_$]+)/);
          if (idMatch) handlerName = idMatch[1];
          middlewares = parts.slice(0, parts.length - 1).map(p => p.replace(/\)\s*;?$/, '').trim());
        }
      }
      // detect protect/management in args
      const hasProtect = /\bprotectRoute\b/.test(args);
      const hasManagement = /\bmanagementRoute\b/.test(args) || /\bmanagementOnly\b/.test(args);
      routes.push({ file: path.relative(process.cwd(), file), method, route: routePath, handlerName, middlewares, hasProtect, hasManagement });
    }
  });
  return routes;
}

function mapAppUses(serverFiles) {
  const mapping = {};
  // First, detect ESM imports of route modules: import name from './routes/foo.route.js'
  const importRegex = /import\s+(\w+)\s+from\s+([`'\"])(.*?routes\/.+?)\2/gm;
  // Then detect app.use('/api/prefix', routerName) patterns
  const useRegex = /app\.use\s*\(\s*([`'\"])(.*?)\1\s*,\s*(\w+)\s*\)/gm;

  serverFiles.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    const localImports = {};
    let m;
    while ((m = importRegex.exec(src)) !== null) {
      const localName = m[1];
      const reqPath = m[3];
      const filename = path.basename(reqPath).replace(/\.js$/, '') + '.js';
      localImports[localName] = filename;
    }

    while ((m = useRegex.exec(src)) !== null) {
      const prefix = m[2];
      const routerName = m[3];
      const filename = localImports[routerName];
      if (filename) mapping[filename] = prefix;
    }
  });

  // Fallback: also detect CommonJS require style
  const requireUseRegex = /app\.use\s*\(\s*([`'\"])(.*?)\1\s*,\s*require\(\s*([`'\"])(.*?routes\\?(.+?))\3\s*\)\s*\)/gm;
  serverFiles.forEach((file) => {
    const src = fs.readFileSync(file, 'utf8');
    let m2;
    while ((m2 = requireUseRegex.exec(src)) !== null) {
      const prefix = m2[2];
      const reqPath = m2[4];
      const filename = path.basename(reqPath).replace(/\.js$/, '') + '.js';
      mapping[filename] = mapping[filename] || prefix;
    }
  });

  return mapping;
}

function mapControllerExports(controllersDir) {
  const map = {};
  if (!fs.existsSync(controllersDir)) return map;
  const files = walk(controllersDir).filter(f => f.endsWith('.js') || f.endsWith('.cjs') || f.endsWith('.mjs'));
  files.forEach((f) => {
    const src = fs.readFileSync(f, 'utf8');
    const exports = new Set();
    let m;
    const namedRegex = /export\s*\{([^}]+)\}/gm;
    while ((m = namedRegex.exec(src)) !== null) {
      m[1].split(',').map(s => s.trim()).forEach(name => { if (name) exports.add(name.replace(/as\s+.+/, '').trim()); });
    }
    const constRegex = /export\s+(?:const|let|var)\s+([A-Za-z0-9_$]+)\s*=/gm;
    while ((m = constRegex.exec(src)) !== null) exports.add(m[1]);
    const funcRegex = /export\s+function\s+([A-Za-z0-9_$]+)\s*\(/gm;
    while ((m = funcRegex.exec(src)) !== null) exports.add(m[1]);
    const defaultRegex = /export\s+default\s+([A-Za-z0-9_$]+)/gm;
    while ((m = defaultRegex.exec(src)) !== null) exports.add('default');
    map[path.basename(f)] = Array.from(exports);
  });
  return map;
}

function findControllerImportsInRouter(routerFile) {
  const src = fs.readFileSync(routerFile, 'utf8');
  const imports = [];
  // named imports: import { a, b } from '../controllers/x.controller.js'
  const namedRegex = /import\s*\{([^}]+)\}\s*from\s*([`'\"])(.*?controllers\/(.*?))\2/gm;
  let m;
  while ((m = namedRegex.exec(src)) !== null) {
    const names = m[1].split(',').map(s => s.trim().split(' as ')[0].trim()).filter(Boolean);
    const req = path.basename(m[3]).replace(/\.js$/, '') + '.js';
    imports.push({ controllerFile: req, names });
  }
  // default import: import foo from '../controllers/x.controller.js'
  const defRegex = /import\s+([A-Za-z0-9_$]+)\s+from\s*([`'\"])(.*?controllers\/(.*?))\2/gm;
  while ((m = defRegex.exec(src)) !== null) {
    const local = m[1];
    const req = path.basename(m[3]).replace(/\.js$/, '') + '.js';
    imports.push({ controllerFile: req, names: [local] });
  }
  return imports;
}

function findServerFiles() {
  const candidates = [
    path.resolve('backend', 'server.js'),
    path.resolve('backend', 'index.js'),
    path.resolve('server.js'),
    path.resolve('index.js'),
  ];
  return candidates.filter((p) => fs.existsSync(p));
}

function main() {
  console.log('Scanning frontend stores for axios calls...');
  const frontendDir = path.resolve('frontend', 'src');
  const frontendFiles = fs.existsSync(frontendDir) ? readFiles(frontendDir) : [];
  const { endpoints, usages } = extractFrontendEndpoints(frontendFiles);

  console.log('Scanning backend route files...');
  const backendRoutesDir = path.resolve('backend', 'routes');
  const backendFiles = fs.existsSync(backendRoutesDir) ? readFiles(backendRoutesDir) : readFiles(path.resolve('backend'));
  const backendRoutes = extractBackendRoutes(backendFiles);

  const serverFiles = findServerFiles();
  const appUseMap = mapAppUses(serverFiles);

  // Build controller export map for validation
  const controllersDir = path.resolve('backend', 'controllers');
  const controllerExports = mapControllerExports(controllersDir);
  const frontendBase = detectFrontendBaseURL();

  const backendWithPrefix = backendRoutes.map((r) => {
    const file = path.basename(r.file);
    const prefix = appUseMap[file] || '';
    // find controller imports for this router file to help map handlerName -> controller file
    const absRouterPath = path.resolve(r.file);
    let importedControllers = [];
    try { importedControllers = findControllerImportsInRouter(absRouterPath); } catch (err) { importedControllers = []; }

    // verify handler
    let handlerFound = false;
    let handlerFile = null;
    let handlerInline = false;
    if (!r.handlerName) {
      handlerInline = true;
    } else {
      // check among imported controllers first
      for (const imp of importedControllers) {
        if (imp.names && imp.names.includes(r.handlerName)) {
          handlerFound = true;
          handlerFile = imp.controllerFile;
          break;
        }
      }
      // fallback: search in controllerExports map
      if (!handlerFound) {
        for (const [cf, names] of Object.entries(controllerExports)) {
          if (names.includes(r.handlerName)) {
            handlerFound = true;
            handlerFile = cf;
            break;
          }
        }
      }
    }

    return { ...r, prefix, importedControllers, handlerFound, handlerFile, handlerInline };
  });

  // Normalization helper: coerce param tokens to :param and strip queries
  const normalize = (p) => (p || '').replace(/:\\w+/g, ':param').replace(/\?[^\s]*/g, '').replace(/\\/g, '/').replace(/\/+/g, '/');

  const report = usages.map((u) => {
    const usagePath = normalize(u.raw.split('?')[0]);
    // Prepare candidates to check: raw usage, and prefixed with frontend base (if any)
    const usageCandidates = [usagePath];
    if (frontendBase) {
      // ensure leading slash
      const b = frontendBase.startsWith('/') ? frontendBase : `/${frontendBase}`;
      usageCandidates.push(normalize(path.posix.join(b, usagePath)));
    }

    const entry = backendWithPrefix.find((b) => {
      const candidate = normalize(path.posix.join(b.prefix || '', b.route));
      // match if any usage candidate equals candidate or candidate endsWith usagePath
      return usageCandidates.some((uc) => candidate === uc || candidate.endsWith(uc));
    });
    return { usage: u, matched: entry || null };
  });

  const outDir = path.resolve('outputs');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
  const jsonPath = path.join(outDir, 'route_store_crossref.json');
  fs.writeFileSync(jsonPath, JSON.stringify({ endpoints, backendRoutes: backendWithPrefix, report }, null, 2));
  console.log('Wrote', jsonPath);

  const csvPath = path.join(outDir, 'route_store_crossref.csv');
  const csvLines = ['frontend_file,method,frontend_endpoint,backend_file,backend_method,backend_route,backend_prefix'];
  report.forEach((r) => {
    const f = r.usage.file.replace(/,/g, '%2C');
    const fm = r.usage.method;
    const fe = (r.usage.raw || '').replace(/,/g, '%2C');
    if (r.matched) {
      csvLines.push([f, fm, fe, r.matched.file, r.matched.method, r.matched.route, r.matched.prefix].join(','));
    } else {
      csvLines.push([f, fm, fe, '', '', '', ''].join(','));
    }
  });
  fs.writeFileSync(csvPath, csvLines.join('\n'));
  console.log('Wrote', csvPath);
  console.log('Scan complete. Open outputs/route_store_crossref.json for details.');
}

main();
