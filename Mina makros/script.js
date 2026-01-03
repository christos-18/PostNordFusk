// Mappning av knapp-ID till textfil i mappen 'makron'
const fileMap = {
  btn1: 'makron/uppdatera stopp (konsol).txt',
  btn2: 'makron/aktiviteter lastade (konsol).txt',
  btn3: 'makron/uppdatera bilar (konsol).txt',
  btn4: 'makron/flexa (konsol).txt',
  btn5: 'makron/excel makro (uppdatera stopp).txt',
  btn6: 'makron/excel makro (aktiviteter lastade).txt',
  btn7: 'makron/excel makro (bilar w).txt',
  btn8: 'makron/excel makro (bilar x).txt',
  btn9: 'makron/alla som är klara.txt',
  btn10:'makron/excel makro (skriva ut planering).txt'
};

// Button categories for styling
let scriptCategories = {
  'btn_v2_stops': 'api-btn',
  'btn1': 'console',
  'btn2': 'console',
  'btn3': 'console',
  'btn4': 'console',
  'btn5': 'excel',
  'btn6': 'excel',
  'btn7': 'excel',
  'btn8': 'excel',
  'btn9': 'message',
  'btn10': 'excel'
};

let scriptNames = {
  'btn_v2_stops': '⚡ Uppdatera stopp V2 ⚡<br>(Direkt från API)',
  'btn1': '📦 Uppdatera stopp 📦<br>(Konsol)',
  'btn2': '⌛ Aktiviteter lastade ⌛<br>(Konsol)',
  'btn3': '🔋 Uppdatera bilar 🔋<br>(Konsol)',
  'btn4': '⏰ Flexa ⏰<br>(Konsol)',
  'btn5': '📗 Excel makro 📗<br>(Uppdatera stopp)',
  'btn6': '📗 Excel makro 📗<br>(Aktiviteter lastade)',
  'btn7': '📗 Excel makro 📗<br>(Bilar W)',
  'btn8': '📗 Excel makro 📗<br>(Bilar X)',
  'btn9': '🚚 Alla som är klara 🚚',
  'btn10': '📗 Excel makro 📗<br>(Skriva ut planering)'
};

let scriptOrder = Object.keys(fileMap);
// Add V2 button to the beginning of the order
scriptOrder.unshift('btn_v2_stops');

let nextBtnId = 11;
let customScripts = {}; // For user-created scripts stored in localStorage

// User authentication
let currentUser = null;
const users = {
  'admin': 'admin123',
  // Lägg till fler användare här
};

// Load saved user session
const savedUser = localStorage.getItem('postnord_user');
if (savedUser) {
  currentUser = savedUser;
}

const savedData = localStorage.getItem('postnord_custom_scripts');
if (savedData) {
  try {
    const data = JSON.parse(savedData);
    customScripts = data.scripts || {};

    // Merge saved names and categories (but don't override defaults)
    Object.keys(data.names || {}).forEach(key => {
      if (!scriptNames[key]) {
        scriptNames[key] = data.names[key];
      }
    });

    Object.keys(data.categories || {}).forEach(key => {
      if (!scriptCategories[key]) {
        scriptCategories[key] = data.categories[key];
      }
    });

    // Only use saved order for custom scripts
    const customOrder = (data.order || []).filter(key => !fileMap[key] && key !== 'btn_v2_stops');
    scriptOrder = ['btn_v2_stops', ...Object.keys(fileMap), ...customOrder];

    nextBtnId = data.nextId || nextBtnId;
  } catch (e) {
    console.error('Failed to load custom scripts', e);
  }
}

let currentScript = null;
let currentScriptContent = '';

// Save custom scripts only
function saveCustomData() {
  localStorage.setItem('postnord_custom_scripts', JSON.stringify({
    scripts: customScripts,
    names: Object.fromEntries(
      Object.entries(scriptNames).filter(([key]) => !fileMap[key])
    ),
    categories: Object.fromEntries(
      Object.entries(scriptCategories).filter(([key]) => !fileMap[key])
    ),
    order: scriptOrder,
    nextId: nextBtnId
  }));
}

function updateLoginStatus() {
  const currentUserSpan = document.getElementById('currentUser');
  const logoutBtn = document.getElementById('logoutBtn');

  if (currentUserSpan && logoutBtn) {
    if (currentUser) {
      currentUserSpan.textContent = currentUser;
      logoutBtn.style.display = 'inline-block';
    } else {
      currentUserSpan.textContent = 'Ingen';
      logoutBtn.style.display = 'none';
    }
  }

  // Update user badge on main page
  if (userBadge && userNameDisplay) {
    if (currentUser) {
      userNameDisplay.textContent = currentUser;
      userBadge.style.display = 'flex';
    } else {
      userBadge.style.display = 'none';
    }
  }
}

// Modal functionality
const modal = document.getElementById('editorModal');
const settingsBtn = document.getElementById('settingsBtn');
const closeModal = document.getElementById('closeModal');
const scriptList = document.getElementById('scriptList');
const codeEditor = document.getElementById('codeEditor');
const saveBtn = document.getElementById('saveBtn');
const resetBtn = document.getElementById('resetBtn');
const statusMessage = document.getElementById('statusMessage');
const addScriptBtn = document.getElementById('addScriptBtn');
const buttonContainer = document.getElementById('buttonContainer');
const inputDialog = document.getElementById('inputDialog');
const scriptNameInput = document.getElementById('scriptNameInput');
const scriptEmojiInput = document.getElementById('scriptEmojiInput');
const dialogConfirm = document.getElementById('dialogConfirm');
const dialogCancel = document.getElementById('dialogCancel');
const confirmDialog = document.getElementById('confirmDialog');
const confirmMessage = document.getElementById('confirmMessage');
const confirmDelete = document.getElementById('confirmDelete');
const confirmCancel = document.getElementById('confirmCancel');

const loginDialog = document.getElementById('loginDialog');
const loginUsername = document.getElementById('loginUsername');
const loginPassword = document.getElementById('loginPassword');
const loginConfirm = document.getElementById('loginConfirm');
const loginCancel = document.getElementById('loginCancel');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const userBadge = document.getElementById('userBadge');
const userNameDisplay = document.getElementById('userNameDisplay');
const badgeLogoutBtn = document.getElementById('badgeLogoutBtn');

// Monitor elements
const monitorBtn = document.getElementById('monitorBtn');
const monitorPanel = document.getElementById('monitorPanel');
const monitorClose = document.getElementById('monitorClose');
const monitorChat = document.getElementById('monitorChat');
const monitorStatus = document.getElementById('monitorStatus');
const apiUrlInput = document.getElementById('apiUrl');
const startMonitorBtn = document.getElementById('startMonitor');

let scriptToDelete = null;
let monitorInterval = null;
let previousRouteStates = {};
let cachedRouteData = null; // Cache for latest route data

// Default API URL - will be auto-detected from DP system
const DEFAULT_API_BASE = 'https://dp.postnord.com/dp/routeinfo';

// Update login status on page load
updateLoginStatus();

// Monitor functionality
monitorBtn.onclick = () => {
  monitorPanel.classList.toggle('active');
};

monitorClose.onclick = () => {
  monitorPanel.classList.remove('active');
};

function addChatMessage(message, type = 'system') {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-message ${type}`;

  const time = new Date().toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  msgDiv.innerHTML = `${message}<span class="time">${time}</span>`;

  monitorChat.appendChild(msgDiv);
  monitorChat.scrollTop = monitorChat.scrollHeight;

  // Keep only last 100 messages
  if (monitorChat.children.length > 100) {
    monitorChat.removeChild(monitorChat.firstChild);
  }
}

async function fetchRouteData() {
  // Get auth token from localStorage (same as DP system uses)
  const authToken = localStorage.getItem('authToken');

  if (!authToken) {
    addChatMessage('❌ Ingen auth token hittades. Logga in i DP-systemet först!', 'error');
    return;
  }

  // Get API URL or use saved one
  let apiUrl = apiUrlInput.value.trim();

  // If no URL provided, try to auto-detect from saved URL or use default
  if (!apiUrl) {
    apiUrl = localStorage.getItem('monitor_api_url') || '';
  }

  if (!apiUrl) {
    addChatMessage('⚠️ Ingen API URL angiven. Klistra in URL från DP-systemets Network tab.', 'error');
    return;
  }

  // Ensure delta=false to get full data
  if (apiUrl.includes('delta=true')) {
    apiUrl = apiUrl.replace('delta=true', 'delta=false');
  } else if (!apiUrl.includes('delta=')) {
    const separator = apiUrl.includes('?') ? '&' : '?';
    apiUrl = apiUrl + separator + 'delta=false';
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${authToken}`,
        'content-type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Unauthorized - Token expired. Logga in i DP-systemet igen.');
      }
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    processRouteData(data);

  } catch (error) {
    addChatMessage(`❌ Fel vid hämtning: ${error.message}`, 'error');
    monitorStatus.classList.remove('active');
  }
}

function processRouteData(data) {
  // Data structure: {"route_info":[{"business_location_id":"1049236","routes":[...]}]}
  if (!data.route_info || !data.route_info[0] || !data.route_info[0].routes) {
    addChatMessage('⚠️ Ingen route-data hittades', 'error');
    return;
  }

  const routes = data.route_info[0].routes;

  // Cache the data for V2 button (and timestamp it)
  cachedRouteData = data;
  cachedRouteData.timestamp = Date.now();

  if (routes.length === 0) {
    // No routes yet, just mark as active
    monitorStatus.classList.add('active');
    return;
  }

  routes.forEach(route => {
    const routeName = route.route_name || route.route || route.name;

    // Parse stops format "62/62" or use separate fields
    let currentStops = 0;
    let totalStops = 0;

    if (route.stops && typeof route.stops === 'string' && route.stops.includes('/')) {
      const [current, total] = route.stops.split('/').map(s => parseInt(s.trim()));
      currentStops = current || 0;
      totalStops = total || 0;
    } else {
      currentStops = route.stops_completed || route.completed_stops || 0;
      totalStops = route.total_stops || route.stops || 0;
    }

    const status = route.status || '';

    if (!routeName) return;

    const currentState = {
      stops: currentStops,
      total: totalStops,
      status: status,
      completed: currentStops === totalStops || status.toLowerCase() === 'completed'
    };

    const prevState = previousRouteStates[routeName];

    // First stop detection
    if (prevState && prevState.stops === 0 && currentState.stops === 1) {
      addChatMessage(`🚀 ${routeName} har gjort sitt första stopp!`, 'first-stop');

      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('Första stoppet!', {
          body: `${routeName} har gjort sitt första stopp`,
          icon: '/bilder/ikon.png'
        });
      }
    }

    // Completion detection
    if (prevState && !prevState.completed && currentState.completed) {
      addChatMessage(`✅ ${routeName} är klar! (${currentState.stops}/${currentState.total} stopp)`, 'completed');

      // Browser notification
      if (Notification.permission === 'granted') {
        new Notification('Chaufför klar!', {
          body: `${routeName} är klar med alla stopp`,
          icon: '/bilder/ikon.png'
        });
      }
    }

    previousRouteStates[routeName] = currentState;
  });

  monitorStatus.classList.add('active');
}

startMonitorBtn.onclick = () => {
  if (monitorInterval) {
    // Stop monitoring
    clearInterval(monitorInterval);
    monitorInterval = null;
    startMonitorBtn.textContent = '🚀 Starta Monitor';
    startMonitorBtn.style.background = '#48bb78';
    monitorStatus.classList.remove('active');
    addChatMessage('⏸️ Monitor stoppad', 'system');
  } else {
    // Start monitoring
    const apiUrl = apiUrlInput.value.trim();

    if (!apiUrl) {
      addChatMessage('⚠️ Klistra in API URL från DP-systemets Network tab först', 'error');
      return;
    }

    // Check if authToken exists
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      addChatMessage('❌ Ingen auth token. Öppna DP-systemet i en annan flik först!', 'error');
      return;
    }

    // Request notification permission
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Save URL to localStorage
    localStorage.setItem('monitor_api_url', apiUrl);

    startMonitorBtn.textContent = '⏸️ Stoppa Monitor';
    startMonitorBtn.style.background = '#ed8936';
    addChatMessage('🚀 Monitor startad - uppdaterar var 30:e sekund', 'system');
    addChatMessage('ℹ️ Token hämtas automatiskt från DP-systemet', 'system');

    // Initial fetch
    fetchRouteData();

    // Set interval for 30 seconds
    monitorInterval = setInterval(fetchRouteData, 30000);
  }
};

// Load saved config
const savedApiUrl = localStorage.getItem('monitor_api_url');
if (savedApiUrl) apiUrlInput.value = savedApiUrl;

settingsBtn.onclick = () => {
  if (!currentUser) {
    // Show login dialog
    loginError.textContent = '';
    loginUsername.value = '';
    loginPassword.value = '';
    loginDialog.classList.add('active');
    loginUsername.focus();
    return;
  }

  modal.classList.add('active');
  renderScriptList();
  if (!currentScript && scriptOrder.length > 0) {
    selectScript(scriptOrder[0]);
  }
};

closeModal.onclick = () => {
  modal.classList.remove('active');
};

modal.onclick = (e) => {
  if (e.target === modal) {
    modal.classList.remove('active');
  }
};

// Render script list
function renderScriptList() {
  scriptList.innerHTML = '';
  scriptOrder.forEach(key => {
    const item = document.createElement('div');
    item.className = 'script-item';
    item.draggable = true;
    item.dataset.script = key;

    // Drag handle (hamburger icon)
    const dragHandle = document.createElement('span');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '☰';
    dragHandle.title = 'Dra för att flytta';

    const nameSpan = document.createElement('span');
    const cleanName = (scriptNames[key] || key).replace(/<br>/g, ' ');
    nameSpan.textContent = cleanName;
    nameSpan.style.flex = '1';
    nameSpan.style.cursor = 'pointer';
    nameSpan.onclick = () => selectScript(key);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'delete-script-btn';
    deleteBtn.textContent = '✕';
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      deleteScript(key);
    };

    item.appendChild(dragHandle);
    item.appendChild(nameSpan);

    // Only show delete button for custom scripts (not file-based ones)
    if (!fileMap[key] && key !== 'btn_v2_stops') {
      item.appendChild(deleteBtn);
    }

    // Drag and drop event listeners
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragleave', handleDragLeave);

    scriptList.appendChild(item);
  });
}

// Drag and drop handlers
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.innerHTML);

  // Add smooth transition
  setTimeout(() => {
    this.style.transition = 'none';
  }, 0);
}

function handleDragEnd(e) {
  this.classList.remove('dragging');
  this.style.transition = '';

  // Remove all drag-over classes with animation
  document.querySelectorAll('.script-item').forEach(item => {
    item.classList.remove('drag-over');
  });

  draggedElement = null;
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }

  this.classList.add('drag-over');
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    // Get the dragged and target script keys
    const draggedKey = draggedElement.dataset.script;
    const targetKey = this.dataset.script;

    // Find their positions in scriptOrder
    const draggedIndex = scriptOrder.indexOf(draggedKey);

    // Remove dragged item and insert at new position
    scriptOrder.splice(draggedIndex, 1);
    const newTargetIndex = scriptOrder.indexOf(targetKey);
    scriptOrder.splice(newTargetIndex, 0, draggedKey);

    // Save and re-render
    saveCustomData();
    renderScriptList();
    renderButtons();

    // Re-select current script
    if (currentScript) {
      document.querySelectorAll('.script-item').forEach(item => {
        item.classList.toggle('active', item.dataset.script === currentScript);
      });
    }
  }

  this.classList.remove('drag-over');
  return false;
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDragEnter(e) {
  this.classList.add('drag-over');
}

// Add new script
addScriptBtn.onclick = () => {
  console.log('Add script clicked');
  scriptNameInput.value = '';
  scriptEmojiInput.value = '';
  inputDialog.classList.add('active');
  scriptNameInput.focus();
};

dialogCancel.onclick = () => {
  inputDialog.classList.remove('active');
};

dialogConfirm.onclick = () => {
  const name = scriptNameInput.value.trim();
  if (!name) {
    alert('Du måste ange ett namn!');
    return;
  }

  const emoji = scriptEmojiInput.value.trim() || '📝';
  const btnId = 'btn' + nextBtnId;

  nextBtnId++;
  scriptNames[btnId] = emoji + ' ' + name;
  customScripts[btnId] = '// Nytt script\n// Skriv din kod här...';
  scriptOrder.push(btnId);
  scriptCategories[btnId] = 'custom';

  saveCustomData();
  renderButtons();
  renderScriptList();
  selectScript(btnId);
  showStatus('✅ Nytt script skapat!');

  inputDialog.classList.remove('active');
};

// Allow Enter key to confirm
scriptNameInput.onkeypress = scriptEmojiInput.onkeypress = (e) => {
  if (e.key === 'Enter') {
    dialogConfirm.click();
  }
};

// Login functionality
loginConfirm.onclick = () => {
  const username = loginUsername.value.trim();
  const password = loginPassword.value;

  if (!username || !password) {
    loginError.textContent = 'Fyll i både användarnamn och lösenord';
    return;
  }

  if (users[username] && users[username] === password) {
    currentUser = username;
    localStorage.setItem('postnord_user', username);
    updateLoginStatus();
    loginDialog.classList.remove('active');

    // Open editor after successful login
    modal.classList.add('active');
    renderScriptList();
    if (!currentScript && scriptOrder.length > 0) {
      selectScript(scriptOrder[0]);
    }
  } else {
    loginError.textContent = '❌ Felaktigt användarnamn eller lösenord';
    loginPassword.value = '';
    loginPassword.focus();
  }
};

loginCancel.onclick = () => {
  loginDialog.classList.remove('active');
};

logoutBtn.onclick = () => {
  if (confirm('Vill du logga ut?')) {
    currentUser = null;
    localStorage.removeItem('postnord_user');
    updateLoginStatus();
    modal.classList.remove('active');
    loginDialog.classList.remove('active');
  }
};

// Badge logout button
badgeLogoutBtn.onclick = () => {
  if (confirm('Vill du logga ut?')) {
    currentUser = null;
    localStorage.removeItem('postnord_user');
    updateLoginStatus();
    modal.classList.remove('active');
  }
};

// Allow Enter to login
loginUsername.onkeypress = loginPassword.onkeypress = (e) => {
  if (e.key === 'Enter') {
    loginConfirm.click();
  }
};

// Delete script (only custom scripts can be deleted)
function deleteScript(key) {
  if (key === 'btn_v2_stops') {
    alert('Du kan inte ta bort V2-knappen.');
    return;
  }

  if (fileMap[key]) {
    alert('Du kan inte ta bort original-scripten. Dessa laddas från txt-filer.');
    return;
  }

  scriptToDelete = key;
  const scriptName = (scriptNames[key] || key).replace(/<br>/g, ' ');
  confirmMessage.textContent = `Är du säker på att du vill ta bort "${scriptName}"?`;
  confirmDialog.classList.add('active');
}

confirmCancel.onclick = () => {
  confirmDialog.classList.remove('active');
  scriptToDelete = null;
};

confirmDelete.onclick = () => {
  if (scriptToDelete && scriptToDelete !== 'btn_v2_stops' && !fileMap[scriptToDelete]) {
    delete customScripts[scriptToDelete];
    delete scriptNames[scriptToDelete];
    delete scriptCategories[scriptToDelete];
    scriptOrder = scriptOrder.filter(id => id !== scriptToDelete);

    if (currentScript === scriptToDelete) {
      currentScript = scriptOrder[0] || null;
      if (currentScript) {
        selectScript(currentScript);
      } else {
        codeEditor.value = '';
      }
    }

    saveCustomData();
    renderButtons();
    renderScriptList();
    showStatus('🗑️ Script borttaget');

    confirmDialog.classList.remove('active');
    scriptToDelete = null;
  }
};

// Render buttons on main page
function renderButtons() {
  buttonContainer.innerHTML = '';

  // Guard against duplicate IDs in DOM
  const seenIds = new Set();

  scriptOrder.forEach(key => {
    // Guard: skip if duplicate key somehow exists in scriptOrder
    if (seenIds.has(key)) {
      console.warn('Duplicate button key in scriptOrder:', key);
      return;
    }
    seenIds.add(key);

    const btn = document.createElement('button');
    btn.id = key;
    btn.className = 'copy-btn';

    const category = scriptCategories[key] || 'custom';
    btn.classList.add(category);

    btn.innerHTML = scriptNames[key] || key;

    // Special handling for V2 button (API) - SINGLE SOURCE OF TRUTH HERE ✅
    if (key === 'btn_v2_stops') {
      const originalHTML = btn.innerHTML;

      btn.addEventListener('click', async (e) => {
        e.preventDefault();

        btn.classList.add('clicked');
        btn.innerHTML = '⏳ Hämtar data...';
        btn.style.pointerEvents = 'none';

        let textToCopy = '';

        // Use cached data if it’s recent (< 5 seconds)
        if (cachedRouteData) {
          const cacheAge = Date.now() - (cachedRouteData.timestamp || 0);
          if (cacheAge < 5000) {
            textToCopy = formatStopsData(cachedRouteData);
          }
        }

        // If no cached data or it’s old, fetch new data
        if (!textToCopy) {
          textToCopy = await fetchAndFormatStopsData();
        }

        if (textToCopy) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(textToCopy).catch(() => fallbackCopy(textToCopy));
          } else {
            fallbackCopy(textToCopy);
          }
          btn.innerHTML = '✅ Kopierat!';
        } else {
          btn.innerHTML = '❌ Fel!';
        }

        setTimeout(() => {
          btn.classList.remove('clicked');
          btn.innerHTML = originalHTML;
          btn.style.pointerEvents = '';
        }, 1500);
      });

      buttonContainer.appendChild(btn);
      return;
    }

    // Default buttons (fileMap/custom scripts)
    const originalHTML = btn.innerHTML;
    btn.addEventListener('click', async () => {
      let textToCopy = '';

      if (fileMap[key]) {
        try {
          const response = await fetch(fileMap[key]);
          if (!response.ok) throw new Error('Network response was not ok');
          textToCopy = await response.text();
        } catch (err) {
          console.error('Error fetching file', err);
          textToCopy = '';
        }
      } else {
        textToCopy = customScripts[key] || '';
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(textToCopy).catch(() => fallbackCopy(textToCopy));
      } else {
        fallbackCopy(textToCopy);
      }

      btn.classList.add('clicked');
      btn.innerHTML = '✅ Kopierat!';
      setTimeout(() => {
        btn.classList.remove('clicked');
        btn.innerHTML = originalHTML;
      }, 1500);
    });

    buttonContainer.appendChild(btn);
  });
}

// Initial render
scriptList.style.transition = 'opacity 0.3s ease';
renderButtons();

// API V2 Button Handler - Fetch data directly from API
async function fetchAndFormatStopsData() {
  const authToken = localStorage.getItem('authToken');
  const apiUrl =
    localStorage.getItem('monitor_api_url') ||
    'https://dp.postnord.com/dp/routeinfo?costCenters=1117507&delta=false&blid=1049236&daysoffset=0';

  if (!authToken) {
    alert('❌ Ingen auth token. Öppna DP-systemet i en annan flik först!');
    return null;
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'accept': 'application/json, text/plain, */*',
        'authorization': `Bearer ${authToken}`,
        'content-type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        alert('❌ Token expired. Logga in i DP-systemet igen.');
        return null;
      }
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Cache the data + timestamp ✅
    cachedRouteData = data;
    cachedRouteData.timestamp = Date.now();

    // Format data exactly like the console script does
    return formatStopsData(data);

  } catch (error) {
    alert(`❌ Fel vid hämtning: ${error.message}`);
    return null;
  }
}

function formatStopsData(data) {
  // Format exactly like: "Route: 116901, Tasks Left: 12"
  if (!data.route_info || !data.route_info[0] || !data.route_info[0].routes) {
    return '';
  }

  const routes = data.route_info[0].routes;
  const formattedData = [];

  routes.forEach(route => {
    const routeName = route.route_name || route.route || route.name;

    // Parse stops format "45/62"
    let currentStops = 0;
    let totalStops = 0;

    if (route.stops && typeof route.stops === 'string' && route.stops.includes('/')) {
      const [current, total] = route.stops.split('/').map(s => parseInt(s.trim()));
      currentStops = current || 0;
      totalStops = total || 0;
    } else {
      currentStops = route.stops_completed || route.completed_stops || 0;
      totalStops = route.total_stops || route.stops || 0;
    }

    // Calculate tasks left (same as console script)
    const tasksLeft = totalStops - currentStops;

    if (routeName && !isNaN(tasksLeft)) {
      // Skip if tasksLeft is 0 (same as console script does)
      if (tasksLeft !== 0) {
        formattedData.push(`Route: ${routeName}, Tasks Left: ${tasksLeft}`);
      }
    }
  });

  return formattedData.join('\n');
}

// Select and load script
async function selectScript(key) {
  currentScript = key;
  document.querySelectorAll('.script-item').forEach(item => {
    item.classList.toggle('active', item.dataset.script === key);
  });

  // Load content from file or custom scripts
  if (fileMap[key]) {
    try {
      const response = await fetch(fileMap[key]);
      if (!response.ok) throw new Error('Network response was not ok');
      currentScriptContent = await response.text();
      codeEditor.value = currentScriptContent;
    } catch (err) {
      console.error('Error loading file:', err);
      codeEditor.value = '// Kunde inte ladda filen';
    }
  } else {
    currentScriptContent = customScripts[key] || '';
    codeEditor.value = currentScriptContent;
  }
}

saveBtn.onclick = () => {
  if (!currentScript) return;

  if (currentScript === 'btn_v2_stops') {
    alert('V2-knappen kan inte redigeras här.');
    return;
  }

  if (fileMap[currentScript]) {
    alert('Original-scripts kan inte redigeras direkt. Redigera txt-filen i mappen "makron" istället.');
    return;
  }

  customScripts[currentScript] = codeEditor.value;
  currentScriptContent = codeEditor.value;
  saveCustomData();
  showStatus('✅ Sparat!');
};

resetBtn.onclick = () => {
  if (!currentScript) return;

  if (fileMap[currentScript]) {
    if (confirm('Vill du ladda om originalfilen?')) {
      selectScript(currentScript); // Reload from file
      showStatus('↺ Omladdad från fil');
    }
  } else {
    if (confirm('Vill du återställa till tom mall?')) {
      customScripts[currentScript] = '// Nytt script\n// Skriv din kod här...';
      codeEditor.value = customScripts[currentScript];
      saveCustomData();
      showStatus('↺ Återställd till mall');
    }
  }
};

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.classList.add('show');
  setTimeout(() => {
    statusMessage.classList.remove('show');
  }, 2000);
}

// Copy button functionality
function fallbackCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
}
