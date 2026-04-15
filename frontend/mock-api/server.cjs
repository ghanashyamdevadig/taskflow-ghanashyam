const http = require('http');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-secret-key-change-in-production';
const EXPIRY = '24h';
const PORT = process.env.PORT || 4000;

const DB_PATH = path.join(__dirname, 'db.json');

function loadDb() {
  const data = fs.readFileSync(DB_PATH, 'utf-8');
  return JSON.parse(data);
}

function saveDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function sendError(res, statusCode, error) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(error));
}

function authenticate(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 401, { error: 'unauthorized' });
    return null;
  }
  
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    sendError(res, 401, { error: 'unauthorized' });
    return null;
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method;
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Users endpoint - make it public (no auth required)
  if (url.pathname === '/users' && method === 'GET') {
    const db = loadDb();
    const users = db.users.map(u => ({ id: u.id, name: u.name, email: u.email }));
    sendJson(res, 200, { users });
    return;
  }
  
  if (url.pathname === '/auth/register' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const db = loadDb();
      const { name, email, password } = JSON.parse(body);
      
      if (!name || !email || !password) {
        sendError(res, 400, { error: 'validation failed', fields: { name: !name ? 'is required' : '', email: !email ? 'is required' : '', password: !password ? 'is required' : '' } });
        return;
      }
      
      const existing = db.users.find(u => u.email === email);
      if (existing) {
        sendError(res, 400, { error: 'validation failed', fields: { email: 'already exists' } });
        return;
      }
      
      const id = 'user-' + Date.now();
      const user = { id, name, email, password, created_at: new Date().toISOString() };
      db.users.push(user);
      saveDb(db);
      
      const token = jwt.sign({ user_id: id, email }, JWT_SECRET, { expiresIn: EXPIRY });
      const { password: _, ...userWithoutPassword } = user;
      sendJson(res, 201, { token, user: userWithoutPassword });
    });
    return;
  }
  
  if (url.pathname === '/auth/login' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const db = loadDb();
      const { email, password } = JSON.parse(body);
      
      if (!email || !password) {
        sendError(res, 400, { error: 'validation failed', fields: { email: !email ? 'is required' : '', password: !password ? 'is required' : '' } });
        return;
      }
      
      const user = db.users.find(u => u.email === email && u.password === password);
      if (!user) {
        sendError(res, 401, { error: 'unauthorized' });
        return;
      }
      
      const token = jwt.sign({ user_id: user.id, email: user.email }, JWT_SECRET, { expiresIn: EXPIRY });
      const { password: _, ...userWithoutPassword } = user;
      sendJson(res, 200, { token, user: userWithoutPassword });
    });
    return;
  }
  
  const user = authenticate(req, res);
  if (!user) return;
  
  if (url.pathname === '/projects' && method === 'GET') {
    const db = loadDb();
    const ownedProjects = db.projects.filter(p => p.owner_id === user.user_id);
    const taskProjectIds = db.tasks.filter(t => t.assignee_id === user.user_id).map(t => t.project_id);
    const taskProjects = db.projects.filter(p => taskProjectIds.includes(p.id));
    const allProjects = [...ownedProjects, ...taskProjects];
    const uniqueProjects = allProjects.filter((p, i, a) => a.findIndex(t => t.id === p.id) === i);
    sendJson(res, 200, { projects: uniqueProjects });
    return;
  }
  
  if (url.pathname === '/projects' && method === 'POST') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const db = loadDb();
      const { name, description } = JSON.parse(body);
      
      if (!name) {
        sendError(res, 400, { error: 'validation failed', fields: { name: 'is required' } });
        return;
      }
      
      const id = 'proj-' + Date.now();
      const project = { id, name, description: description || '', owner_id: user.user_id, created_at: new Date().toISOString() };
      db.projects.push(project);
      saveDb(db);
      
      sendJson(res, 201, project);
    });
    return;
  }
  
  if (url.pathname.startsWith('/projects/') && url.pathname.endsWith('/') === false) {
    const projectId = url.pathname.split('/')[2];
    
    if (method === 'GET') {
      const db = loadDb();
      const project = db.projects.find(p => p.id === projectId);
      if (!project) {
        sendError(res, 404, { error: 'not found' });
        return;
      }
      const isOwner = project.owner_id === user.user_id;
      const hasAssignedTask = db.tasks.some(t => t.project_id === projectId && t.assignee_id === user.user_id);
      if (!isOwner && !hasAssignedTask) {
        sendError(res, 404, { error: 'not found' });
        return;
      }
      const tasks = db.tasks.filter(t => t.project_id === projectId);
      sendJson(res, 200, { ...project, tasks });
      return;
    }
    
    if (method === 'PATCH') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const db = loadDb();
        const idx = db.projects.findIndex(p => p.id === projectId);
        if (idx === -1 || db.projects[idx].owner_id !== user.user_id) {
          sendError(res, 404, { error: 'not found' });
          return;
        }
        
        const updates = JSON.parse(body);
        db.projects[idx] = { ...db.projects[idx], ...updates };
        saveDb(db);
        sendJson(res, 200, db.projects[idx]);
      });
      return;
    }
    
    if (method === 'DELETE') {
      const db = loadDb();
      const idx = db.projects.findIndex(p => p.id === projectId);
      if (idx === -1 || db.projects[idx].owner_id !== user.user_id) {
        sendError(res, 404, { error: 'not found' });
        return;
      }
      
      db.projects.splice(idx, 1);
      db.tasks = db.tasks.filter(t => t.project_id !== projectId);
      saveDb(db);
      
      res.writeHead(204);
      res.end();
      return;
    }
  }
  
  if (url.pathname.startsWith('/projects/') && url.pathname.includes('/tasks')) {
    const projectId = url.pathname.split('/')[2];
    
    if (method === 'GET') {
      const db = loadDb();
      const project = db.projects.find(p => p.id === projectId);
      if (!project) {
        sendError(res, 404, { error: 'not found' });
        return;
      }
      
      let tasks = db.tasks.filter(t => t.project_id === projectId);
      const status = url.searchParams.get('status');
      if (status) {
        tasks = tasks.filter(t => t.status === status);
      }
      sendJson(res, 200, { tasks });
      return;
    }
    
    if (method === 'POST') {
      let body = '';
      req.on('data', chunk => body += chunk);
      req.on('end', () => {
        const db = loadDb();
        const { title, description, status, priority, due_date, assignee_id } = JSON.parse(body);
        
        if (!title) {
          sendError(res, 400, { error: 'validation failed', fields: { title: 'is required' } });
          return;
        }
        
        const id = 'task-' + Date.now();
        const task = { 
          id, 
          title, 
          description: description || '', 
          status: status || 'todo', 
          priority: priority || 'medium',
          project_id: projectId,
          assignee_id: assignee_id || null,
          due_date: due_date || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        db.tasks.push(task);
        saveDb(db);
        
        sendJson(res, 201, task);
      });
      return;
    }
  }
  
  if (url.pathname.startsWith('/tasks/') && method === 'PATCH') {
    const taskId = url.pathname.split('/')[2];
    
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      const db = loadDb();
      const taskIdx = db.tasks.findIndex(t => t.id === taskId);
      if (taskIdx === -1) {
        sendError(res, 404, { error: 'not found' });
        return;
      }
      
      const task = db.tasks[taskIdx];
      const project = db.projects.find(p => p.id === task.project_id);
      if (project.owner_id !== user.user_id && task.assignee_id !== user.user_id) {
        sendError(res, 403, { error: 'forbidden' });
        return;
      }
      
      const updates = JSON.parse(body);
      db.tasks[taskIdx] = { ...task, ...updates, updated_at: new Date().toISOString() };
      saveDb(db);
      sendJson(res, 200, db.tasks[taskIdx]);
    });
    return;
  }
  
  if (url.pathname.startsWith('/tasks/') && method === 'DELETE') {
    const taskId = url.pathname.split('/')[2];
    
    const db = loadDb();
    const taskIdx = db.tasks.findIndex(t => t.id === taskId);
    if (taskIdx === -1) {
      sendError(res, 404, { error: 'not found' });
      return;
    }
    
    const task = db.tasks[taskIdx];
    const project = db.projects.find(p => p.id === task.project_id);
    if (project.owner_id !== user.user_id && task.assignee_id !== user.user_id) {
      sendError(res, 403, { error: 'forbidden' });
      return;
    }
    
    db.tasks.splice(taskIdx, 1);
    saveDb(db);
    
    res.writeHead(204);
    res.end();
    return;
  }
  
  sendError(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
  console.log(`Mock API running on port ${PORT}`);
});