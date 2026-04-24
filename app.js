const DB_NAME = 'MemeSoundboardDB';
const DB_VERSION = 1;
const STORE_NAME = 'sounds';
const META_STORE = 'metadata';

let db = null;
let sounds = [];
let currentAudio = null;
let isEditMode = false;
let globalVolume = 0.8;
let allowOverlap = false;
let showHidden = false;

// Auth State
let isAuthenticated = false;

const authContainer = document.getElementById('authContainer');
const mainApp = document.getElementById('mainApp');
const authForm = document.getElementById('authForm');
const authTitle = document.getElementById('authTitle');
const authSubtitle = document.getElementById('authSubtitle');
const authSubmitBtn = document.getElementById('authSubmitBtn');
const authError = document.getElementById('authError');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const logoutBtn = document.getElementById('logoutBtn');
const securityBtn = document.getElementById('securityBtn');
const securityModal = document.getElementById('securityModal');
const securityForm = document.getElementById('securityForm');
const cancelSecurity = document.getElementById('cancelSecurity');
const exportConfigBtn = document.getElementById('exportConfigBtn');
const securityError = document.getElementById('securityError');
const securitySuccess = document.getElementById('securitySuccess');

const DEFAULT_SOUNDS = [
    { name: 'A Few Moments Later', url: 'assets/sounds/a-few-moments-later-sponge-bob-sfx-fun.mp3' },
    { name: 'Angry Birds Yeah', url: 'assets/sounds/angry-birds-plush-yeah-sfx.mp3' },
    { name: 'Bass Drop', url: 'assets/sounds/bass-drop-edit_mixdown.mp3' },
    { name: 'Ding', url: 'assets/sounds/ding-sound-effect_2.mp3' },
    { name: 'Dun Dun Dun', url: 'assets/sounds/dun-dun-dun-sound-effect-brass_8nFBccR.mp3' },
    { name: 'Error', url: 'assets/sounds/error_CDOxCYm.mp3' },
    { name: 'Fahhh', url: 'assets/sounds/fahhhhhhhhhhhhhh.mp3' },
    { name: 'GTA Mission Complete', url: 'assets/sounds/gta-san-andreas-mission-complete-sound-hq.mp3' },
    { name: 'Halo Gaes', url: 'assets/sounds/halo-gaes.mp3' },
    { name: 'Happy Happy Happy', url: 'assets/sounds/happy-happy-happy-song.mp3' },
    { name: 'Kids Yay', url: 'assets/sounds/kids-saying-yay-sound-effect_3.mp3' },
    { name: 'Mentality', url: 'assets/sounds/mentality.mp3' },
    { name: 'MLG Airhorn', url: 'assets/sounds/mlg-airhorn.mp3' },
    { name: 'Movie', url: 'assets/sounds/movie_1.mp3' },
    { name: 'Patrick Pembohong', url: 'assets/sounds/patrick-pembohong-kau-pembohong.mp3' },
    { name: 'Punch', url: 'assets/sounds/punch_u4LmMsr.mp3' },
    { name: 'Record Scratch', url: 'assets/sounds/record-scratch-2.mp3' },
    { name: 'Rizz', url: 'assets/sounds/rizz-sound-effect.mp3' },
    { name: 'Shock Kaget', url: 'assets/sounds/shock-kaget.mp3' },
    { name: 'Sudden Suspense', url: 'assets/sounds/sudden-suspense-sound-effect.mp3' },
    { name: 'Vine Boom', url: 'assets/sounds/vine-boom.mp3' }
];

const soundboardGrid = document.getElementById('soundboardGrid');
const fileInput = document.getElementById('fileInput');
const importBtn = document.getElementById('importBtn');
const editModeBtn = document.getElementById('editModeBtn');
const editToolbar = document.getElementById('editToolbar');
const addSoundBtn = document.getElementById('addSoundBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const globalVolumeSlider = document.getElementById('globalVolume');
const volumeValue = document.getElementById('volumeValue');
const overlapToggle = document.getElementById('overlapToggle');
const showHiddenToggle = document.getElementById('showHiddenToggle');

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Standalone SHA-256 implementation (Works in all browsers, HTTP and HTTPS)
function sha256(ascii) {
    function rightRotate(value, amount) {
        return (value >>> amount) | (value << (32 - amount));
    }
    
    let mathPow = Math.pow;
    let maxWord = mathPow(2, 32);
    let result = '';
    let words = [];
    let asciiLength = ascii.length;
    let hash = sha256.h = sha256.h || [];
    let k = sha256.k = sha256.k || [];
    let primeCounter = k.length;

    let isLetter = {};
    for (let i = 2; primeCounter < 64; i++) {
        if (!isLetter[i]) {
            for (let j = i * i; j < 311; j += i) {
                isLetter[j] = 1;
            }
            hash[primeCounter] = (mathPow(i, 0.5) * maxWord) | 0;
            k[primeCounter++] = (mathPow(i, 1 / 3) * maxWord) | 0;
        }
    }
    
    ascii += '\x80';
    while (ascii.length % 64 - 56) ascii += '\x00';
    
    for (let i = 0; i < ascii.length; i++) {
        let j = ascii.charCodeAt(i);
        if (j >> 8) return; // only ascii chars
        words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = ((asciiLength * 8) / maxWord) | 0;
    words[words.length] = (asciiLength * 8) | 0;
    
    for (let j = 0; j < words.length; ) {
        let w = words.slice(j, (j += 16));
        let oldHash = hash;
        hash = hash.slice(0, 8);
        
        for (let i = 0; i < 64; i++) {
            let w15 = w[i - 15], w2 = w[i - 2];
            let s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
            let s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
            let ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
            let maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
            let t1 = hash[7] + (rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25)) + ch + k[i] + (w[i] = (i < 16) ? w[i] : (w[i - 16] + s0 + w[i - 7] + s1) | 0);
            let t2 = (rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22)) + maj;
            
            hash = [(t1 + t2) | 0].concat(hash);
            hash[4] = (hash[4] + t1) | 0;
        }
        
        for (let i = 0; i < 8; i++) {
            hash[i] = (hash[i] + oldHash[i]) | 0;
        }
    }
    
    for (let i = 0; i < 8; i++) {
        for (let j = 3; j + 1; j--) {
            let b = (hash[i] >> (j * 8)) & 255;
            result += (b < 16 ? '0' : '') + b.toString(16);
        }
    }
    return result;
}

async function hashPassword(password) {
    return sha256(password);
}

// Check credentials (No longer needs fallback logic)
function checkCredentials(inputUser, inputHash, globalUser, globalHash) {
    return inputUser === globalUser && inputHash === globalHash;
}

async function checkAuthState() {
    const sessionToken = sessionStorage.getItem('auth_token');

    // Global Configuration is now mandatory for access
    if (typeof GLOBAL_AUTH !== 'undefined') {
        authTitle.textContent = '🔐 Secure Access';
        authSubtitle.textContent = 'Sign in to access your private soundboard.';
        authSubmitBtn.textContent = 'Login';

        if (sessionToken === GLOBAL_AUTH.hash) {
            showApp();
        }
    } else {
        authError.textContent = 'Configuration Error: GLOBAL_AUTH not found.';
        authError.style.display = 'block';
    }
}

function showApp() {
    isAuthenticated = true;
    authContainer.style.display = 'none';
    mainApp.style.display = 'block';
    loadAppContent();
}

function logout() {
    sessionStorage.removeItem('auth_token');
    window.location.reload();
}

async function handleAuth(e) {
    e.preventDefault();
    authError.style.display = 'none';

    const username = usernameInput.value.trim();
    const password = passwordInput.value;
    const hash = await hashPassword(password);

    console.log('Login Attempt:', { username, isSecure: window.isSecureContext });

    if (typeof GLOBAL_AUTH !== 'undefined') {
        if (checkCredentials(username, hash, GLOBAL_AUTH.username, GLOBAL_AUTH.hash)) {
            sessionStorage.setItem('auth_token', hash);
            showApp();
        } else {
            authError.textContent = 'Invalid username or password.';
            authError.style.display = 'block';
        }
    }
}

async function handleSecurityUpdate(e) {
    e.preventDefault();
    securityError.style.display = 'none';
    securitySuccess.style.display = 'none';

    // Verify with current global password
    const currentPassword = document.getElementById('currentPassword').value;
    const currentHash = await hashPassword(currentPassword);

    if (currentHash !== GLOBAL_AUTH.hash) {
        securityError.textContent = 'Incorrect current password!';
        securityError.style.display = 'block';
        return;
    }

    const newUsername = document.getElementById('newUsername').value.trim();
    const newPassword = document.getElementById('newPassword').value;
    const confirmNewPassword = document.getElementById('confirmNewPassword').value;

    if (newPassword && newPassword !== confirmNewPassword) {
        securityError.textContent = 'New passwords do not match!';
        securityError.style.display = 'block';
        return;
    }

    // Prepare new config data
    const updatedData = { 
        username: newUsername || GLOBAL_AUTH.username,
        hash: newPassword ? await hashPassword(newPassword) : GLOBAL_AUTH.hash
    };

    // To make this permanent for THIS user session
    sessionStorage.setItem('auth_token', updatedData.hash);
    
    // We update the GLOBAL_AUTH object in memory (temporary)
    GLOBAL_AUTH.username = updatedData.username;
    GLOBAL_AUTH.hash = updatedData.hash;

    securitySuccess.textContent = 'Success! Click "Export Config" to save globally.';
    securitySuccess.style.display = 'block';
}

async function exportConfig() {
    const configCode = `/**
 * GLOBAL CONFIGURATION (Master Key)
 * 
 * This file controls access for EVERYONE who visits your soundboard.
 * Only you (the owner of the code) can change this file and redeploy.
 */
const GLOBAL_AUTH = {
    username: '${GLOBAL_AUTH.username}',
    hash: '${GLOBAL_AUTH.hash}'
};`;

    const blob = new Blob([configCode], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'config.js';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Config file downloaded! Replace your existing config.js with this file and redeploy to apply changes for everyone.');
}

function openDatabase() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            db = request.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                database.createObjectStore(STORE_NAME, { keyPath: 'id' });
            }
            if (!database.objectStoreNames.contains(META_STORE)) {
                database.createObjectStore(META_STORE, { keyPath: 'key' });
            }
        };
    });
}

async function saveSoundToDB(sound) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(sound);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function deleteSoundFromDB(id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function getAllSoundsFromDB() {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
    });
}

async function saveMetadata(key, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([META_STORE], 'readwrite');
        const store = transaction.objectStore(META_STORE);
        const request = store.put({ key, value });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
    });
}

async function getMetadata(key) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([META_STORE], 'readonly');
        const store = transaction.objectStore(META_STORE);
        const request = store.get(key);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result?.value);
    });
}

async function loadSettings() {
    globalVolume = await getMetadata('globalVolume') ?? 0.8;
    allowOverlap = await getMetadata('allowOverlap') ?? false;
    showHidden = await getMetadata('showHidden') ?? false;
    
    globalVolumeSlider.value = globalVolume * 100;
    volumeValue.textContent = Math.round(globalVolume * 100) + '%';
    overlapToggle.checked = allowOverlap;
    showHiddenToggle.checked = showHidden;
}

async function saveSettings() {
    await saveMetadata('globalVolume', globalVolume);
    await saveMetadata('allowOverlap', allowOverlap);
    await saveMetadata('showHidden', showHidden);
}

function getSoundIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'mp3': '🎵',
        'wav': '🎶',
        'ogg': '🔊',
        'm4a': '🎼',
        'aac': '🎹'
    };
    return icons[ext] || '🔊';
}

function createSoundCard(sound) {
    const card = document.createElement('div');
    card.className = `sound-card ${sound.hidden ? 'hidden-card' : ''}`;
    card.dataset.id = sound.id;

    if (sound.hidden && !showHidden) {
        card.style.display = 'none';
    }

    card.innerHTML = `
        <span class="sound-icon">${getSoundIcon(sound.name)}</span>
        <span class="sound-name">${sound.name}</span>
        <div class="playing-indicator" style="display: none;">
            <div class="bar"></div>
            <div class="bar"></div>
            <div class="bar"></div>
        </div>
        <div class="sound-actions">
            <button class="btn-edit" title="Rename">✏️</button>
            <button class="btn-hide" title="${sound.hidden ? 'Unhide' : 'Hide'}">${sound.hidden ? '👁️' : '🙈'}</button>
            <button class="btn-delete" title="Delete">🗑️</button>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (isEditMode) {
            const action = e.target.closest('button');
            if (action) {
                if (action.classList.contains('btn-edit')) {
                    showRenameModal(sound);
                } else if (action.classList.contains('btn-hide')) {
                    toggleHideSound(sound.id);
                } else if (action.classList.contains('btn-delete')) {
                    deleteSound(sound.id);
                }
            }
            return;
        }
        if (sound.hidden && !showHidden) return;
        playSound(sound);
    });

    return card;
}

function renderSounds() {
    soundboardGrid.innerHTML = '';

    if (sounds.length === 0) {
        soundboardGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔇</div>
                <h2>No sounds yet!</h2>
                <p>Click "Import Sounds" to add some meme sounds</p>
            </div>
        `;
        return;
    }

    sounds.forEach(sound => {
        const card = createSoundCard(sound);
        soundboardGrid.appendChild(card);
    });
}

function playSound(sound) {
    console.log(`Attempting to play: ${sound.name}`);
    
    if (!sound.url && sound.blob) {
        console.log(`URL missing for ${sound.name}, recreating from blob...`);
        sound.url = URL.createObjectURL(sound.blob);
    }

    if (!sound.url) {
        console.error(`Cannot play ${sound.name}: No URL or blob available.`);
        return;
    }

    if (!allowOverlap && currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        document.querySelectorAll('.sound-card.playing').forEach(el => el.classList.remove('playing'));
    }

    try {
        const audio = new Audio(sound.url);
        audio.volume = globalVolume * (sound.volume || 1);

        if (sound.loop) {
            audio.loop = true;
        }

        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(() => {
                console.log(`Successfully playing: ${sound.name}`);
                const card = document.querySelector(`[data-id="${sound.id}"]`);
                if (card) {
                    card.classList.add('playing');
                }
            }).catch(err => {
                console.error(`Playback failed for ${sound.name}:`, err);
                // Handle cases where the URL might have become invalid
                if (err.name === 'NotSupportedError' || err.name === 'EncodingError') {
                    console.log('Attempting to refresh URL and retry...');
                    sound.url = URL.createObjectURL(sound.blob);
                    // Don't recursive indefinitely, just one retry
                }
            });
        }

        if (!allowOverlap) {
            currentAudio = audio;
        }

        audio.addEventListener('ended', () => {
            const card = document.querySelector(`[data-id="${sound.id}"]`);
            if (card) {
                card.classList.remove('playing');
            }
            if (audio === currentAudio) {
                currentAudio = null;
            }
        });
    } catch (err) {
        console.error(`Error creating audio object for ${sound.name}:`, err);
    }
}

function stopAllSounds() {
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.currentTime = 0;
        currentAudio = null;
    }
    document.querySelectorAll('.sound-card.playing').forEach(el => el.classList.remove('playing'));
}

async function importFiles(files) {
    const validExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
    const fileArray = Array.from(files);
    console.log(`Starting import of ${fileArray.length} files...`);

    for (const file of fileArray) {
        try {
            const ext = file.name.split('.').pop().toLowerCase();
            if (!validExtensions.includes(ext)) {
                console.warn(`Unsupported file format: ${file.name}`);
                continue;
            }

            console.log(`Processing file: ${file.name} (${file.size} bytes)`);
            const url = URL.createObjectURL(file);
            const sound = {
                id: generateId(),
                name: file.name.replace(/\.[^/.]+$/, ''),
                blob: file, 
                url: url,   
                volume: 1,
                loop: false,
                isDefault: false, // Mark as custom
                fileName: file.name,
                fileSize: file.size
            };

            sounds.push(sound);
            await saveSoundToDB(sound);
            console.log(`Successfully saved ${file.name} to DB and state.`);
        } catch (err) {
            console.error(`Error importing file ${file.name}:`, err);
        }
    }

    renderSounds();
    console.log('Import process complete.');
}

async function deleteSound(id) {
    const sound = sounds.find(s => s.id === id);
    if (!sound) return;

    if (sound.url) {
        URL.revokeObjectURL(sound.url);
    }

    if (sound.isDefault) {
        // Just remove from current session memory
        console.log(`Temporarily removing default sound: ${sound.name}`);
    } else {
        // Permanently delete custom sound from DB
        await deleteSoundFromDB(id);
        console.log(`Permanently deleted custom sound: ${sound.name}`);
    }

    sounds = sounds.filter(s => s.id !== id);
    renderSounds();
}

async function renameSound(id, newName) {
    const sound = sounds.find(s => s.id === id);
    if (sound) {
        sound.name = newName;
        await saveSoundToDB(sound);
        renderSounds();
    }
}

async function toggleHideSound(id) {
    const sound = sounds.find(s => s.id === id);
    if (sound) {
        sound.hidden = !sound.hidden;
        await saveSoundToDB(sound);
        renderSounds();
    }
}

async function clearAllSounds() {
    for (const sound of sounds) {
        if (sound.url) {
            URL.revokeObjectURL(sound.url);
        }
        if (!sound.isDefault) {
            // Only delete custom sounds from DB
            await deleteSoundFromDB(sound.id);
        }
    }
    // For defaults, we just clear them from the current memory view
    sounds = [];
    renderSounds();
}

async function loadDefaultSounds() {
    console.log('Loading default sounds into memory...');
    
    for (const def of DEFAULT_SOUNDS) {
        try {
            const response = await fetch(def.url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            
            const sound = {
                id: 'default-' + def.name.toLowerCase().replace(/\s+/g, '-'),
                name: def.name,
                blob: blob,
                url: URL.createObjectURL(blob),
                volume: 1,
                loop: false,
                isDefault: true,
                hidden: false,
                fileName: def.name + '.mp3',
                fileSize: blob.size
            };

            // Only add if not already in memory (to prevent duplicates if called multiple times)
            if (!sounds.find(s => s.id === sound.id)) {
                sounds.push(sound);
                console.log(`Loaded default: ${def.name}`);
            }
        } catch (err) {
            console.warn(`Failed to load default sound ${def.name}:`, err);
        }
    }
    
    renderSounds();
}

function showRenameModal(sound) {
    const existingModal = document.querySelector('.modal-overlay');
    if (existingModal) {
        existingModal.remove();
    }

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    overlay.innerHTML = `
        <div class="modal">
            <h2>Rename Sound</h2>
            <input type="text" id="renameInput" value="${sound.name}" placeholder="Enter new name">
            <div class="modal-buttons">
                <button class="btn btn-secondary" id="cancelRename">Cancel</button>
                <button class="btn btn-primary" id="confirmRename">Save</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);
    overlay.classList.add('visible');

    const input = document.getElementById('renameInput');
    input.focus();
    input.select();

    document.getElementById('cancelRename').addEventListener('click', () => overlay.remove());
    document.getElementById('confirmRename').addEventListener('click', () => {
        const newName = input.value.trim();
        if (newName) {
            renameSound(sound.id, newName);
        }
        overlay.remove();
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const newName = input.value.trim();
            if (newName) {
                renameSound(sound.id, newName);
            }
            overlay.remove();
        } else if (e.key === 'Escape') {
            overlay.remove();
        }
    });
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    editModeBtn.classList.toggle('active', isEditMode);
    editModeBtn.textContent = isEditMode ? 'Done Editing' : 'Edit Mode';
    editToolbar.classList.toggle('visible', isEditMode);
    document.body.classList.toggle('edit-mode', isEditMode);
}

async function init() {
    // Register Service Worker for offline support
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./service-worker.js')
                .then(reg => console.log('Service Worker registered', reg))
                .catch(err => console.error('Service Worker failed', err));
        });
    }

    // Network status monitoring
    const offlineBadge = document.getElementById('offlineBadge');
    const updateOnlineStatus = () => {
        if (offlineBadge) {
            offlineBadge.style.display = navigator.onLine ? 'none' : 'flex';
        }
    };
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    updateOnlineStatus();

    try {
        await openDatabase();
        await loadSettings();
        
        authForm.addEventListener('submit', handleAuth);
        logoutBtn.addEventListener('click', logout);

        securityBtn.addEventListener('click', () => {
            securityModal.classList.add('visible');
            document.getElementById('currentPassword').focus();
        });

        cancelSecurity.addEventListener('click', () => {
            securityModal.classList.remove('visible');
            securityForm.reset();
        });

        securityForm.addEventListener('submit', handleSecurityUpdate);
        exportConfigBtn.addEventListener('click', exportConfig);

        await checkAuthState();

        // If not authenticated, we stop here and wait for login
        if (!isAuthenticated && !isSetupMode) {
            console.log('Waiting for authentication...');
            return;
        }

        if (isSetupMode) {
            console.log('In setup mode...');
            return;
        }

        await loadAppContent();
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

async function loadAppContent() {
    // 1. Cleanup: Remove any legacy default sounds from the DB 
    // (We now load them fresh from the server every time)
    const storedSounds = await getAllSoundsFromDB();
    for (const s of storedSounds) {
        if (s.isDefault) {
            await deleteSoundFromDB(s.id);
        }
    }

    // 2. Load custom sounds from DB
    const customSounds = (await getAllSoundsFromDB()).filter(s => !s.isDefault);
    sounds = customSounds.map(sound => {
        if (sound.blob) {
            sound.url = URL.createObjectURL(sound.blob);
        }
        return sound;
    });
    
    // 3. Always reload default sounds fresh from assets
    await loadDefaultSounds();
    
    renderSounds();

    importBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            importFiles(e.target.files);
            fileInput.value = '';
        }
    });

    editModeBtn.addEventListener('click', toggleEditMode);

    addSoundBtn.addEventListener('click', () => fileInput.click());

    clearAllBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all sounds?')) {
            clearAllSounds();
        }
    });

    globalVolumeSlider.addEventListener('input', (e) => {
        globalVolume = e.target.value / 100;
        volumeValue.textContent = e.target.value + '%';
        saveSettings();
    });

    showHiddenToggle.addEventListener('change', (e) => {
        showHidden = e.target.checked;
        saveSettings();
        renderSounds();
    });

    overlapToggle.addEventListener('change', (e) => {
        allowOverlap = e.target.checked;
        saveSettings();
        if (!allowOverlap) {
            stopAllSounds();
        }
    });
}

document.addEventListener('DOMContentLoaded', init);
