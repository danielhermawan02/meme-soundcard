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

const DEFAULT_SOUNDS = [
    // Add your local files here after dragging them into assets/sounds/
    // Example: { name: 'My Sound', url: 'assets/sounds/mysound.mp3' },
    { name: 'Airhorn', url: 'https://www.myinstants.com/media/sounds/mlg-air-horn.mp3' },
    { name: 'Bruh', url: 'https://www.myinstants.com/media/sounds/bruh.mp3' },
    { name: 'Emotional Damage', url: 'https://www.myinstants.com/media/sounds/emotional-damage-meme.mp3' },
    { name: 'Windows XP Error', url: 'https://www.myinstants.com/media/sounds/errop.mp3' },
    { name: 'Curb Your Enthusiasm', url: 'https://www.myinstants.com/media/sounds/curb-your-enthusiasm-theme.mp3' }
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

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
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
    globalVolumeSlider.value = globalVolume * 100;
    volumeValue.textContent = Math.round(globalVolume * 100) + '%';
    overlapToggle.checked = allowOverlap;
}

async function saveSettings() {
    await saveMetadata('globalVolume', globalVolume);
    await saveMetadata('allowOverlap', allowOverlap);
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
    card.className = 'sound-card';
    card.dataset.id = sound.id;

    card.innerHTML = `
        <span class="sound-icon">${getSoundIcon(sound.name)}</span>
        <span class="sound-name">${sound.name}</span>
        <div class="sound-actions">
            <button class="btn-edit" title="Rename">✏️</button>
            <button class="btn-delete" title="Delete">🗑️</button>
        </div>
    `;

    card.addEventListener('click', (e) => {
        if (isEditMode) {
            const action = e.target.closest('button');
            if (action) {
                if (action.classList.contains('btn-edit')) {
                    showRenameModal(sound);
                } else if (action.classList.contains('btn-delete')) {
                    deleteSound(sound.id);
                }
            }
            return;
        }
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
    if (sound && sound.url) {
        URL.revokeObjectURL(sound.url);
    }

    sounds = sounds.filter(s => s.id !== id);
    await deleteSoundFromDB(id);
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

async function clearAllSounds() {
    for (const sound of sounds) {
        if (sound.url) {
            URL.revokeObjectURL(sound.url);
        }
        await deleteSoundFromDB(sound.id);
    }
    sounds = [];
    await saveMetadata('defaultsLoaded', false); // Reset defaults flag on clear
    renderSounds();
}

async function loadDefaultSounds() {
    const alreadyLoaded = await getMetadata('defaultsLoaded');
    if (alreadyLoaded) return;

    console.log('Loading default sounds...');
    
    for (const def of DEFAULT_SOUNDS) {
        try {
            const response = await fetch(def.url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const blob = await response.blob();
            
            const sound = {
                id: generateId(),
                name: def.name,
                blob: blob,
                url: URL.createObjectURL(blob),
                volume: 1,
                loop: false,
                fileName: def.name + '.mp3',
                fileSize: blob.size
            };

            sounds.push(sound);
            await saveSoundToDB(sound);
            console.log(`Loaded default: ${def.name}`);
        } catch (err) {
            console.warn(`Failed to load default sound ${def.name}:`, err);
        }
    }
    
    await saveMetadata('defaultsLoaded', true);
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
    try {
        await openDatabase();
        await loadSettings();

        const storedSounds = await getAllSoundsFromDB();
        sounds = storedSounds.map(sound => {
            if (sound.blob) {
                sound.url = URL.createObjectURL(sound.blob);
            }
            return sound;
        });
        
        if (sounds.length === 0) {
            await loadDefaultSounds();
        } else {
            renderSounds();
        }

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

        overlapToggle.addEventListener('change', (e) => {
            allowOverlap = e.target.checked;
            saveSettings();
            if (!allowOverlap) {
                stopAllSounds();
            }
        });

    } catch (error) {
        console.error('Initialization error:', error);
    }
}

document.addEventListener('DOMContentLoaded', init);
