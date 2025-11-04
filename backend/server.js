const express = require('express');
const axios = require('axios');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const VIDEO_BASE = process.env.VIDEO_BASE || 'http://localhost:8000';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ✅ NUEVO: Servir videos desde la carpeta local 'videos'
app.use('/videos', express.static(path.join(__dirname, 'videos')));

const dataPath = path.join(__dirname, 'data.json');
let data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  console.log(`[LOGIN] Intento de login: ${username}`);
  
  const user = data.users.find(u => u.username === username && u.password === password);
  
  if (user) {
    console.log(`[LOGIN] Login exitoso: ${username} (${user.role})`);
    res.json({
      success: true,
      user: {
        username: user.username,
        name: user.name,
        role: user.role
      }
    });
  } else {
    console.log(`[LOGIN] Login fallido: ${username}`);
    res.status(401).json({
      success: false,
      message: 'Credenciales inválidas'
    });
  }
});

app.get('/api/courses', (req, res) => {
  console.log('[COURSES] Enviando lista de cursos');
  res.json({
    success: true,
    courses: data.courses
  });
});

app.get('/api/admin/students', (req, res) => {
  console.log('[ADMIN] Solicitando panel de estudiantes');
  
  const studentsInfo = [];
  
  const students = data.users.filter(u => u.role === 'student');
  
  students.forEach(student => {
    const enrolledCourses = data.courses.filter(course => 
      course.students.includes(student.username)
    );
    
    studentsInfo.push({
      username: student.username,
      name: student.name,
      courses: enrolledCourses.map(c => ({
        id: c.id,
        title: c.title
      }))
    });
  });
  
  res.json({
    success: true,
    students: studentsInfo
  });
});

app.get('/video/:filename', async (req, res) => {
  const filename = req.params.filename;
  const videoUrl = `${VIDEO_BASE}/${filename}`;
  
  console.log(`[VIDEO] Solicitando video: ${filename} desde ${videoUrl}`);
  
  try {
    const response = await axios({
      method: 'GET',
      url: videoUrl,
      responseType: 'stream',
      headers: {
        'Range': req.headers.range || 'bytes=0-'
      }
    });
    
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }
    if (response.headers['content-range']) {
      res.setHeader('Content-Range', response.headers['content-range']);
    }
    if (response.headers['accept-ranges']) {
      res.setHeader('Accept-Ranges', response.headers['accept-ranges']);
    }
    
    res.status(response.status);
    response.data.pipe(res);
    
  } catch (error) {
    console.error(`[VIDEO ERROR] No se pudo obtener video ${filename}:`, error.message);
    res.status(500).json({
      success: false,
      message: 'Error al cargar el video',
      error: error.message
    });
  }
});

app.put('/api/courses/:id', (req, res) => {
  const courseId = req.params.id;
  const updatedCourse = req.body;
  
  console.log(`[UPDATE] Actualizando curso ${courseId}`);
  
  const index = data.courses.findIndex(c => c.id === courseId);
  if (index !== -1) {
    data.courses[index] = { ...data.courses[index], ...updatedCourse };
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
    res.json({ success: true, course: data.courses[index] });
  } else {
    res.status(404).json({ success: false, message: 'Curso no encontrado' });
  }
});

app.listen(3000, '0.0.0.0', () => {
  console.log(`========================================`);
  console.log(`🚀 Servidor eLearning iniciado`);
  console.log(`📍 Puerto: ${PORT}`);
  console.log(`🎥 Video base: ${VIDEO_BASE}`);
  console.log(`========================================`);
});
