
let currentUser = null;
let allCourses = [];

const loginScreen = document.getElementById('loginScreen');
const mainScreen = document.getElementById('mainScreen');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginError = document.getElementById('loginError');
const userWelcome = document.getElementById('userWelcome');
const userRole = document.getElementById('userRole');
const adminPanel = document.getElementById('adminPanel');
const studentsInfo = document.getElementById('studentsInfo');
const coursesList = document.getElementById('coursesList');
const videoSection = document.getElementById('videoSection');
const videoPlayer = document.getElementById('videoPlayer');
const videoTitle = document.getElementById('videoTitle');
const closeVideoBtn = document.getElementById('closeVideoBtn');
const congratsSection = document.getElementById('congratsSection');
const nextModuleBtn = document.getElementById('nextModuleBtn');

loginBtn.addEventListener('click', handleLogin);

passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleLogin();
});

async function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!username || !password) {
        showError('Por favor ingresa usuario y contraseña');
        return;
    }
    
    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = data.user;
            showMainScreen();
        } else {
            showError(data.message || 'Credenciales inválidas');
        }
    } catch (error) {
        console.error('Error en login:', error);
        showError('Error al conectar con el servidor');
    }
}

function showError(message) {
    loginError.textContent = message;
    loginError.style.display = 'block';
    setTimeout(() => {
        loginError.style.display = 'none';
    }, 3000);
}

async function showMainScreen() {
    loginScreen.classList.remove('active');
    mainScreen.classList.add('active');
    
    userWelcome.textContent = `Bienvenido, ${currentUser.name}`;
    userRole.textContent = currentUser.role.toUpperCase();
    userRole.className = `badge badge-${currentUser.role}`;
    
    if (currentUser.role === 'admin') {
        await loadAdminPanel();
    }
    
    await loadCourses();
}

async function loadAdminPanel() {
    try {
        const response = await fetch('/api/admin/students');
        const data = await response.json();
        
        if (data.success) {
            adminPanel.style.display = 'block';
            
            let html = '<table class="admin-table"><thead><tr><th>Estudiante</th><th>Cursos Inscritos</th></tr></thead><tbody>';
            
            data.students.forEach(student => {
                const coursesList = student.courses.length > 0 
                    ? student.courses.map(c => c.title).join(', ')
                    : 'Sin cursos';
                
                html += `
                    <tr>
                        <td><strong>${student.name}</strong> (${student.username})</td>
                        <td>${coursesList}</td>
                    </tr>
                `;
            });
            
            html += '</tbody></table>';
            studentsInfo.innerHTML = html;
        }
    } catch (error) {
        console.error('Error cargando panel admin:', error);
    }
}

async function loadCourses() {
    try {
        const response = await fetch('/api/courses');
        const data = await response.json();
        
        if (data.success) {
            allCourses = data.courses;
            renderCourses();
        }
    } catch (error) {
        console.error('Error cargando cursos:', error);
        coursesList.innerHTML = '<p class="error">Error al cargar los cursos</p>';
    }
}

function renderCourses() {
    let coursesToShow = allCourses;
    
    // Filtrar cursos según rol
    if (currentUser.role === 'student') {
        coursesToShow = allCourses.filter(course => 
            course.students.includes(currentUser.username)
        );
    } else if (currentUser.role === 'teacher') {
        coursesToShow = allCourses.filter(course => 
            course.teacher === currentUser.username
        );
    }
    
    if (coursesToShow.length === 0) {
        coursesList.innerHTML = '<p>No tienes cursos asignados.</p>';
        return;
    }
    
    let html = '';
    coursesToShow.forEach(course => {
        html += `
            <div class="course-card">
                <h3>${course.title}</h3>
                <p class="course-info">Profesor: ${course.teacher} | ${course.modules.length} módulos</p>
                <div class="modules-list">
                    ${course.modules.map(module => `
                        <div class="module-item">
                            <span class="module-title">${module.title}</span>
                            <button class="btn btn-small btn-play" onclick="playVideo('${course.title}', '${module.title}', '${module.video}')">
                                ▶ Reproducir
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });
    
    coursesList.innerHTML = html;
}

function playVideo(courseTitle, moduleTitle, videoFile) {
    videoSection.style.display = 'block';
    videoTitle.textContent = `${courseTitle} - ${moduleTitle}`;
    congratsSection.style.display = 'none';
    
    videoPlayer.src = `/videos/${videoFile}`;
    videoPlayer.load();
    videoPlayer.play();
    
    videoSection.scrollIntoView({ behavior: 'smooth' });
}

videoPlayer.addEventListener('ended', () => {
    console.log('Video terminado');
    congratsSection.style.display = 'block';
});

closeVideoBtn.addEventListener('click', () => {
    videoSection.style.display = 'none';
    videoPlayer.pause();
    videoPlayer.src = '';
});

nextModuleBtn.addEventListener('click', () => {
    congratsSection.style.display = 'none';
    videoSection.style.display = 'none';
    videoPlayer.pause();
    videoPlayer.src = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

logoutBtn.addEventListener('click', () => {
    currentUser = null;
    allCourses = [];
    usernameInput.value = '';
    passwordInput.value = '';
    mainScreen.classList.remove('active');
    loginScreen.classList.add('active');
    adminPanel.style.display = 'none';
    videoSection.style.display = 'none';
    videoPlayer.pause();
    videoPlayer.src = '';
});
