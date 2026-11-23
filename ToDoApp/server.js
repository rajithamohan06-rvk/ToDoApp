import http from 'node:http';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'todos.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

// MIME types for static file serving
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.png': 'image/png'
};

// Ensure data folder and todos.json exist
async function ensureDataFile() {
  const dataDir = path.dirname(DATA_FILE);
  if (!existsSync(dataDir)) {
    await fs.mkdir(dataDir, { recursive: true });
  }
  if (!existsSync(DATA_FILE)) {
    await fs.writeFile(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

// Read todos from JSON file
async function readTodos() {
  await ensureDataFile();
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data || '[]');
  } catch (err) {
    console.error('Error reading todos:', err.message);
    return [];
  }
}

// Write todos to JSON file
async function writeTodos(todos) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(todos, null, 2), 'utf-8');
}

// Helper: Read JSON request body
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 1e6) {
        // Prevent payload overload
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });
    req.on('error', reject);
  });
}

// Helper: Send JSON response
function sendJSON(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(payload));
}

// Helper: Serve static files
async function serveStaticFile(res, reqPath) {
  let cleanPath = reqPath.split('?')[0].split('#')[0];
  cleanPath = cleanPath.replace(/^[/\\]+/, '');
  if (!cleanPath) {
    cleanPath = 'index.html';
  }

  const safePath = path.normalize(cleanPath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);

  // Security check: ensure path stays within PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    const content = await fs.readFile(filePath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 Not Found');
    } else {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('500 Internal Server Error');
    }
  }
}

// HTTP Server
const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = urlObj.pathname;
  const method = req.method;

  // Handle CORS Preflight
  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // --- API Endpoints ---

  // GET /api/todos - Retrieve all tasks
  if (pathname === '/api/todos' && method === 'GET') {
    const todos = await readTodos();
    return sendJSON(res, 200, todos);
  }

  // POST /api/todos - Add a new task
  if (pathname === '/api/todos' && method === 'POST') {
    try {
      const body = await parseRequestBody(req);
      const title = (body.title || '').trim();

      if (!title) {
        return sendJSON(res, 400, { error: 'Task title is required.' });
      }

      const todos = await readTodos();
      const newTodo = {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: new Date().toISOString()
      };

      todos.unshift(newTodo); // Add to the top
      await writeTodos(todos);

      return sendJSON(res, 201, newTodo);
    } catch (err) {
      return sendJSON(res, 400, { error: err.message });
    }
  }

  // POST /api/todos/clear-completed - Clear all completed tasks
  if (pathname === '/api/todos/clear-completed' && method === 'POST') {
    const todos = await readTodos();
    const remaining = todos.filter(t => !t.completed);
    const removedCount = todos.length - remaining.length;
    await writeTodos(remaining);
    return sendJSON(res, 200, { success: true, count: removedCount });
  }

  // PATCH /api/todos/:id - Update completion or title
  if (pathname.startsWith('/api/todos/') && method === 'PATCH') {
    const id = pathname.replace('/api/todos/', '');
    try {
      const body = await parseRequestBody(req);
      const todos = await readTodos();
      const todo = todos.find(t => t.id === id);

      if (!todo) {
        return sendJSON(res, 404, { error: 'Task not found.' });
      }

      if (typeof body.completed === 'boolean') {
        todo.completed = body.completed;
      }
      if (typeof body.title === 'string' && body.title.trim()) {
        todo.title = body.title.trim();
      }

      await writeTodos(todos);
      return sendJSON(res, 200, todo);
    } catch (err) {
      return sendJSON(res, 400, { error: err.message });
    }
  }

  // DELETE /api/todos/:id - Delete a task
  if (pathname.startsWith('/api/todos/') && method === 'DELETE') {
    const id = pathname.replace('/api/todos/', '');
    const todos = await readTodos();
    const index = todos.findIndex(t => t.id === id);

    if (index === -1) {
      return sendJSON(res, 404, { error: 'Task not found.' });
    }

    const [deleted] = todos.splice(index, 1);
    await writeTodos(todos);

    return sendJSON(res, 200, { success: true, id: deleted.id });
  }

  // --- Static Files ---
  if (!pathname.startsWith('/api/')) {
    return serveStaticFile(res, pathname);
  }

  // Fallback 404
  sendJSON(res, 404, { error: 'Endpoint not found.' });
});

// Start listening
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n==================================================`);
  console.log(`  To-Do App Server is running!`);
  console.log(`  URL: http://localhost:${PORT}`);
  console.log(`  Local: http://127.0.0.1:${PORT}`);
  console.log(`==================================================\n`);
});
