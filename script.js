let editor;

const loadMonaco = () => {
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js';
  script.onload = () => {
    require.config({
      paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs' }
    });
    window.MonacoEnvironment = {
      getWorkerUrl: function() {
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(`
          self.MonacoEnvironment = {
            baseUrl: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/'
          };
          importScripts('https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/base/worker/workerMain.js');`
        )}`;
      }
    };
    require(['vs/editor/editor.main'], function() {
      editor = monaco.editor.create(document.getElementById('editor'), {
        value: localStorage.getItem('savedCode') || '# Type your code here\nprint("Hello World!")',
        language: 'python',
        theme: 'vs-dark',
        automaticLayout: true
      });
    });
  };
  document.body.appendChild(script);
};

window.onload = function() {
  loadMonaco();
  switchTab('editor-tab');
};

function toggleMenu() {
  document.getElementById('menu-dropdown').classList.toggle('show');
}

window.onclick = function(event) {
  if (!event.target.matches('.menu-btn')) {
    const dropdowns = document.getElementsByClassName('menu-content');
    for (let dropdown of dropdowns) {
      if (dropdown.classList.contains('show')) {
        dropdown.classList.remove('show');
      }
    }
  }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.classList.remove('active');
  });
  document.getElementById(tabId).classList.add('active');
}

function saveCode() {
  if (!editor) return;
  const code = editor.getValue();
  localStorage.setItem('savedCode', code);
  alert('Code saved successfully!');
}

function runCode() {
  if (!editor) return;
  const code = editor.getValue();
  const model = editor.getModel();
  const language = model ? model.getLanguageId() : 'python';
  const output = document.getElementById('code-output');
  
  try {
    // Clear previous output
    output.innerHTML = '';
    
    if (language === 'python') {
      // Use Pyodide or similar Python runtime (placeholder)
      output.innerHTML = 'Python code execution is coming soon!';
    } else {
      // JavaScript execution
      const originalLog = console.log;
      const logs = [];
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      const result = eval(code);
      console.log = originalLog;
      
      output.innerHTML = logs.join('\n');
      if (result !== undefined && logs.length === 0) {
        output.innerHTML = result;
      }
    }
    
    // Switch to runcode tab
    switchTab('runcode-tab');
  } catch (error) {
    output.innerHTML = 'Error: ' + error.message;
    switchTab('runcode-tab');
  }
}

const files = {};

function createNewFile() {
  const filename = document.getElementById('filename').value;
  const language = document.getElementById('language-select').value;
  
  if (!filename) {
    alert('Please enter a filename');
    return;
  }

  if (files[filename]) {
    alert('File already exists');
    return;
  }

  files[filename] = {
    content: `// New ${language} file\n`,
    language: language
  };

  updateFileList();
  document.getElementById('filename').value = '';
}

function updateFileList() {
  const fileList = document.getElementById('file-list');
  fileList.innerHTML = '';
  
  Object.keys(files).forEach(filename => {
    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';
    
    const nameSpan = document.createElement('span');
    nameSpan.textContent = filename;
    
    const buttonsDiv = document.createElement('div');
    
    const openBtn = document.createElement('button');
    openBtn.textContent = 'Open';
    openBtn.onclick = () => openFile(filename);
    
    const renameBtn = document.createElement('button');
    renameBtn.textContent = 'Rename';
    renameBtn.onclick = () => renameFile(filename);
    
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteFile(filename);
    
    buttonsDiv.appendChild(openBtn);
    buttonsDiv.appendChild(renameBtn);
    buttonsDiv.appendChild(deleteBtn);
    fileItem.appendChild(nameSpan);
    fileItem.appendChild(buttonsDiv);
    fileList.appendChild(fileItem);
  });
}

function openFile(filename) {
  const file = files[filename];
  if (editor) {
    editor.setValue(file.content);
    const model = editor.getModel();
    if (model) {
      // Handle HTML files
      if (filename.endsWith('.html')) {
        monaco.editor.setModelLanguage(model, 'html');
        file.language = 'html';
      } else {
        monaco.editor.setModelLanguage(model, file.language);
      }
    }
    switchTab('editor-tab');
  }
}

function deleteFile(filename) {
  if (confirm(`Delete ${filename}?`)) {
    delete files[filename];
    updateFileList();
  }
}

function saveCode() {
  if (!editor) return;
  const code = editor.getValue();
  const model = editor.getModel();
  const language = model ? model.getLanguageId() : 'plaintext';
  
  // Find current file
  const currentFilename = Object.keys(files).find(filename => 
    files[filename].content === localStorage.getItem('savedCode')
  );
  
  if (currentFilename) {
    files[currentFilename].content = code;
    files[currentFilename].language = language;
  } else {
    // Create new file if none is open
    const newFilename = `untitled.${getFileExtension(language)}`;
    files[newFilename] = {
      content: code,
      language: language
    };
    updateFileList();
  }
  
  localStorage.setItem('savedCode', code);
  alert('Code saved successfully!');
}

function renameFile(oldFilename) {
  const newFilename = prompt(`Enter new name for ${oldFilename}:`);
  if (!newFilename) return;
  
  if (files[newFilename]) {
    alert('A file with that name already exists');
    return;
  }
  
  files[newFilename] = files[oldFilename];
  delete files[oldFilename];
  updateFileList();
}

function getFileExtension(language) {
  const extensions = {
    'javascript': 'js',
    'python': 'py',
    'html': 'html',
    'css': 'css',
    'typescript': 'ts',
    'plaintext': 'txt'
  };
  return extensions[language] || 'txt';
}