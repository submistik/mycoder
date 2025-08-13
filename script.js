// === Данные ===
let projects = JSON.parse(localStorage.getItem('codehub-projects')) || [];
let currentProject = null;
let currentFile = null;
let openTabs = [];
const assistantPanel = document.getElementById('assistant-panel');
let assistantVisible = true;

// === DOM ===
const projectList = document.getElementById('projects');
const fileList = document.getElementById('files');
const tabsContainer = document.getElementById('tabs');
const editor = document.getElementById('editor');
const assistantMessages = document.getElementById('assistant-messages');
const assistantQuery = document.getElementById('assistant-query');

// === Модалки ===
const projectModal = document.getElementById('project-modal');
const fileModal = document.getElementById('file-modal');
const projectNameInput = document.getElementById('project-name');
const fileNameInput = document.getElementById('file-name');

// === Инициализация ===
function init() {
  renderProjects();
  if (projects.length > 0) {
    openProject(projects[0].id);
  }
}

// === Рендер проектов ===
function renderProjects() {
  projectList.innerHTML = '';
  projects.forEach(p => {
    const div = document.createElement('div');
    div.className = `project-item ${currentProject && currentProject.id === p.id ? 'active' : ''}`;
    div.textContent = p.name;
    div.onclick = () => openProject(p.id);
    projectList.appendChild(div);
  });
}

// === Открыть проект ===
function openProject(id) {
  currentProject = projects.find(p => p.id === id);
  renderFiles();
  renderTabs();
}

// === Рендер файлов ===
function renderFiles() {
  fileList.innerHTML = '';
  if (!currentProject) return;
  currentProject.files.forEach(f => {
    const div = document.createElement('div');
    div.className = `file-item ${currentFile && currentFile.id === f.id ? 'active' : ''}`;
    div.textContent = f.name;
    div.onclick = () => openFile(f.id);
    fileList.appendChild(div);
  });
}

// === Открыть файл ===
function openFile(id) {
  if (!currentProject) return;
  const file = currentProject.files.find(f => f.id === id);
  if (!file) return;

  currentFile = file;
  editor.value = file.content || '';
  if (!openTabs.find(t => t.id === file.id)) {
    openTabs.push({ id: file.id, name: file.name });
    renderTabs();
  }
  setActiveTab(file.id);
  renderFiles();
}

// === Рендер вкладок ===
function renderTabs() {
  tabsContainer.innerHTML = '';
  openTabs.forEach(tab => {
    const div = document.createElement('div');
    div.className = `tab ${currentFile && currentFile.id === tab.id ? 'active' : ''}`;
    div.innerHTML = `${tab.name} <span class="close" onclick="closeTab('${tab.id}');event.stopPropagation()">✕</span>`;
    div.onclick = () => setActiveTab(tab.id);
    tabsContainer.appendChild(div);
  });
}

// === Установить активную вкладку ===
function setActiveTab(id) {
  const tab = openTabs.find(t => t.id === id);
  if (!tab) return;
  const file = currentProject.files.find(f => f.id === id);
  if (file) {
    currentFile = file;
    editor.value = file.content || '';
    renderFiles();
    renderTabs();
  }
}

// === Закрыть вкладку ===
function closeTab(id) {
  openTabs = openTabs.filter(t => t.id !== id);
  if (currentFile && currentFile.id === id) {
    if (openTabs.length > 0) {
      setActiveTab(openTabs[openTabs.length - 1].id);
    } else {
      currentFile = null;
      editor.value = '';
    }
  }
  renderTabs();
}

// === Сохранение при вводе ===
editor.addEventListener('input', () => {
  if (currentFile) {
    currentFile.content = editor.value;
    saveToStorage();
  }
});

// === Сохранение в localStorage ===
function saveToStorage() {
  localStorage.setItem('codehub-projects', JSON.stringify(projects));
}

// === Модалки ===
document.getElementById('add-project').onclick = () => {
  projectModal.classList.remove('hidden');
  projectNameInput.value = '';
};

document.getElementById('cancel-project').onclick = () => {
  projectModal.classList.add('hidden');
};

document.getElementById('save-project').onclick = () => {
  const name = projectNameInput.value.trim();
  if (name) {
    const newProject = {
      id: Date.now().toString(),
      name,
      files: []
    };
    projects.push(newProject);
    saveToStorage();
    renderProjects();
    openProject(newProject.id);
    projectModal.classList.add('hidden');
  }
};

document.getElementById('new-file-btn').onclick = () => {
  if (!currentProject) {
    alert('Сначала создайте проект!');
    return;
  }
  fileModal.classList.remove('hidden');
  fileNameInput.value = '';
};

document.getElementById('cancel-file').onclick = () => {
  fileModal.classList.add('hidden');
};

document.getElementById('save-file').onclick = () => {
  const name = fileNameInput.value.trim();
  if (name && currentProject) {
    const newFile = {
      id: Date.now().toString(),
      name,
      content: ''
    };
    currentProject.files.push(newFile);
    saveToStorage();
    renderFiles();
    openFile(newFile.id);
    fileModal.classList.add('hidden');
  }
};

// === Помощник по коду ===
document.getElementById('send-query').onclick = () => {
  const query = assistantQuery.value.trim();
  if (!query) return;

  // Показать вопрос
  addMessage('user', query);
  assistantQuery.value = '';

  // Ответ
  const response = getAssistantResponse(query);
  setTimeout(() => {
    addMessage('bot', response);
  }, 500);
};

function addMessage(sender, text) {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${sender === 'bot' ? 'CodeHelper' : 'Вы'}:</strong> ${text}`;
  assistantMessages.appendChild(p);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function getAssistantResponse(query) {
  query = query.toLowerCase();
  if (query.includes('массив') && query.includes('js')) {
    return 'В JavaScript массив создается так: `let arr = [1, 2, 3];` или `let arr = new Array(1, 2, 3);`';
  } else if (query.includes('цикл') && query.includes('js')) {
    return 'Пример цикла: `for (let i = 0; i < 10; i++) { console.log(i); }`';
  } else if (query.includes('функция') && query.includes('js')) {
    return 'Функция в JS: `function myFunc() { return "Hello"; }` или стрелочная: `const myFunc = () => "Hello";`';
  } else if (query.includes('html') && query.includes('тег')) {
    return 'Пример HTML: `<div><p>Текст</p></div>` — `div` и `p` — это теги.';
  } else if (query.includes('css') && query.includes('стиль')) {
    return 'CSS: `p { color: red; font-size: 14px; }` — задаёт цвет и размер текста.';
  } else if (query.includes('пока') || query.includes('спасибо')) {
    return 'Обращайся! Я всегда здесь, чтобы помочь с кодом.';
  } else {
    return 'Я не совсем понял вопрос. Попробуй уточнить, например: "Как создать функцию в JS?"';
  }
}

// Переключение видимости помощника
document.getElementById('assistant-toggle').onclick = () => {
  assistantVisible = !assistantVisible;
  assistantPanel.style.display = assistantVisible ? 'flex' : 'none';
  document.getElementById('assistant-toggle').textContent = assistantVisible ? 'Скрыть' : 'Показать';
};

// === Запуск ===
init();
