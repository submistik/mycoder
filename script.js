let projects = JSON.parse(localStorage.getItem('mycoder-projects')) || [];
let currentProject = null;
let currentFile = null;
let openTabs = [];
let assistantVisible = true;

const projectList = document.getElementById('projects');
const fileList = document.getElementById('files');
const tabsContainer = document.getElementById('tabs');
const editor = document.getElementById('editor');
const assistantMessages = document.getElementById('assistant-messages');
const assistantQuery = document.getElementById('assistant-query');

const projectModal = document.getElementById('project-modal');
const fileModal = document.getElementById('file-modal');
const projectNameInput = document.getElementById('project-name');
const fileNameInput = document.getElementById('file-name');

function init() {
  renderProjects();
  if (projects.length > 0) {
    openProject(projects[0].id);
  }
}

function renderProjects() {
  projectList.innerHTML = '';
  projects.forEach(p => {
    const div = document.createElement('div');
    div.className = `project-item ${currentProject?.id === p.id ? 'active' : ''}`;
    div.textContent = p.name;
    div.onclick = () => openProject(p.id);
    projectList.appendChild(div);
  });
}

function openProject(id) {
  currentProject = projects.find(p => p.id === id);
  renderFiles();
  renderTabs();
}

function renderFiles() {
  fileList.innerHTML = '';
  if (!currentProject) return;
  currentProject.files.forEach(f => {
    const div = document.createElement('div');
    div.className = `file-item ${currentFile?.id === f.id ? 'active' : ''}`;
    div.textContent = f.name;
    div.onclick = () => openFile(f.id);
    fileList.appendChild(div);
  });
}

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

function renderTabs() {
  tabsContainer.innerHTML = '';
  openTabs.forEach(tab => {
    const div = document.createElement('div');
    div.className = `tab ${currentFile?.id === tab.id ? 'active' : ''}`;
    div.innerHTML = `${tab.name} <span class="close" onclick="closeTab('${tab.id}')">✕</span>`;
    div.onclick = () => setActiveTab(tab.id);
    tabsContainer.appendChild(div);
  });
}

function setActiveTab(id) {
  const tab = openTabs.find(t => t.id === id);
  if (!tab) return;
  const file = currentProject?.files.find(f => f.id === id);
  if (file) {
    currentFile = file;
    editor.value = file.content || '';
    renderFiles();
    renderTabs();
  }
}

function closeTab(id) {
  openTabs = openTabs.filter(t => t.id !== id);
  if (currentFile?.id === id) {
    if (openTabs.length > 0) {
      setActiveTab(openTabs[openTabs.length - 1].id);
    } else {
      currentFile = null;
      editor.value = '';
    }
  }
  renderTabs();
}

editor.addEventListener('input', () => {
  if (currentFile) {
    currentFile.content = editor.value;
    saveToStorage();
  }
});

function saveToStorage() {
  localStorage.setItem('mycoder-projects', JSON.stringify(projects));
}

// --- Модалки ---

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
    alert('Создайте сначала проект!');
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

// --- Помощник по коду ---

document.getElementById('send-query').onclick = () => {
  const query = assistantQuery.value.trim();
  if (!query) return;

  addMessage('user', query);
  assistantQuery.value = '';

  const response = getAssistantResponse(query);
  setTimeout(() => addMessage('bot', response), 600);
};

function addMessage(sender, text) {
  const p = document.createElement('p');
  p.innerHTML = `<strong>${sender === 'bot' ? 'CodeHelper' : 'Вы'}:</strong> ${text}`;
  assistantMessages.appendChild(p);
  assistantMessages.scrollTop = assistantMessages.scrollHeight;
}

function getAssistantResponse(query) {
  query = query.toLowerCase();
  if (query.includes('массив') && query.includes('python')) {
    return 'В Python: `arr = [1, 2, 3]` или `arr = list(range(5))`';
  } else if (query.includes('цикл') && query.includes('python')) {
    return 'Цикл: `for i in range(10): print(i)` или `while x > 0: ...`';
  } else if (query.includes('функция') && query.includes('python')) {
    return 'Функция: `def my_func(x): return x * 2`';
  } else if (query.includes('класс') && query.includes('c++')) {
    return 'Класс в C++:\n```cpp\nclass MyClass {\npublic:\n    int x;\n    MyClass(int val) { x = val; }\n};\n```';
  } else if (query.includes('html') && query.includes('форма')) {
    return 'Форма: `<form action="/submit"><input type="text" name="name"/><button>Отправить</button></form>`';
  } else if (query.includes('css') && query.includes('анимация')) {
    return 'Анимация:\n```css\n@keyframes move {\n  0% { transform: translateX(0); }\n  100% { transform: translateX(100px); }\n}\n```';
  } else if (query.includes('js') && query.includes('объект')) {
    return 'Объект в JS: `let obj = { name: "Alex", age: 25 };`';
  } else {
    return 'Не понял. Попробуй: "цикл в Python", "класс в C++", "анимация в CSS"';
  }
}

// --- Показать/скрыть помощника ---

document.getElementById('assistant-toggle').onclick = () => {
  assistantVisible = !assistantVisible;
  document.getElementById('assistant-panel').style.display = assistantVisible ? 'flex' : 'none';
  document.getElementById('assistant-toggle').textContent = assistantVisible ? 'Скрыть' : 'Показать';
};

// --- Запуск ---
init();
