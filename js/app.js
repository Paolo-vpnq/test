// ============================================================
// M3 Safety Observer — Main Application Logic
// ============================================================

// ===== CONFIGURATION (edit these for production) =============
// Dropdown data — short hardcoded lists for now.
// Later: load from external file (Excel/JSON endpoint).

const CONFIG = {
  // Power Automate POST URL. Set via settings or console: setPowerAutomateUrl('URL')
  ENDPOINT_URL: localStorage.getItem('powerAutomateUrl') || '',

  PROJECT: 'M3',

  BUILDINGS: {
    'FAB1': { name: 'FAB1 - Main Fabrication', levels: ['B1','L0','L1','L2','L3','Roof'] },
    'FAB2': { name: 'FAB2 - Secondary Fabrication', levels: ['B1','L0','L1','L2','Roof'] },
    'CUB':  { name: 'CUB - Central Utility Building', levels: ['B1','L0','L1','L2','Roof'] },
    'AMB':  { name: 'AMB - Administration Building', levels: ['L0','L1','L2'] },
    'WWT':  { name: 'WWT - Wastewater Treatment', levels: ['L0','L1'] },
    'CHY':  { name: 'CHY - Chemical Yard', levels: ['L0'] },
    'GAS':  { name: 'GAS - Gas Yard', levels: ['L0'] },
    'EXT':  { name: 'EXT - External Areas', levels: ['L0'] },
    'SOUTH': { name: 'SOUTH - South Area', levels: ['L0','L1'] },
  },

  MAIN_CONTRACTORS: [
    'MT Hojgaard',
    'Kemp & Lauritzen',
    'Caverion',
    'Bravida',
    'Other',
  ],

  COMPANIES: [
    'Bravida Danmark A/S',
    'Caverion Danmark A/S',
    'Kemp & Lauritzen A/S',
    'MT Hojgaard A/S',
    'NNE A/S',
    'Per Aarsleff A/S',
    'Dansk Energi Service',
    'Enemærke & Petersen',
    'Other',
  ],

  CATEGORIES: [
    { id: 1,  name: '1. Access/Exit', subs: [] },
    { id: 2,  name: '2. Barriers/Signage/Shielding', subs: [] },
    { id: 3,  name: '3. Housekeeping/Waste', subs: [] },
    { id: 4,  name: '4. Noise/Dust/Fumes/Health Hazards', subs: [] },
    { id: 5,  name: '5. Storage and Handling of Materials', subs: [] },
    { id: 6,  name: '6. Electrical Hazards', subs: [] },
    { id: 7,  name: '7. Working at Heights', subs: ['7.1 Missing edge protection','7.2 Unsafe scaffold access','7.3 No harness','7.4 Unsafe ladder use'] },
    { id: 8,  name: '8. Lifting/Rigging', subs: [] },
    { id: 9,  name: '9. Hot Works', subs: [] },
    { id: 10, name: '10. Mobile Elevating Work Equipment', subs: [] },
    { id: 11, name: '11. Lighting', subs: [] },
    { id: 12, name: '12. Documentation and Procedures', subs: [] },
    { id: 13, name: '13. Scaffold/Alloy Towers', subs: [] },
    { id: 14, name: '14. Slip/Trip Hazard', subs: [] },
    { id: 15, name: '15. Personal Protective Equipment', subs: ['15.1 Missing hard hat','15.2 Missing safety glasses','15.3 Missing hi-vis','15.4 Missing gloves'] },
    { id: 16, name: '16. Use of Tools and Machinery', subs: [] },
    { id: 17, name: '17. Environmental Hazards', subs: [] },
    { id: 18, name: '18. Emergency Equipment', subs: [] },
    { id: 19, name: '19. Excavation/Trenches', subs: [] },
    { id: 20, name: '20. Other', subs: [] },
  ],
};

// ===== TRANSLATIONS ==========================================
// UI-only translations. Data is always stored/sent in English.
const TRANSLATIONS = {
  en: {
    status_online: 'Online', status_offline: 'Offline — reports saved locally',
    status_syncing: 'Syncing...', pending_reports: 'pending reports',
    install_instructions: 'To install: tap Share then Add to Home Screen',
    dismiss: 'Dismiss', location: 'Location', building: 'Building', level: 'Level',
    select_building: 'Select building...', select_level: 'Select level...',
    change_location: 'Change location', your_details: 'Your Details',
    observer_name: 'Name', main_contractor: 'Main Contractor',
    company_name: 'Company', select_contractor: 'Select...',
    observation: 'Observation', observation_type: 'Type',
    safe: 'Safe', unsafe: 'Unsafe',
    category: 'Category', subcategory: 'Subcategory',
    select_category: 'Select category...', select_subcategory: 'Select subcategory...',
    description: 'Description', photo: 'Photo',
    take_photo: 'Take Photo', from_gallery: 'Gallery',
    submit: 'Submit Observation', new_report: 'New Report',
    settings: 'Settings', saved_identity: 'Saved Identity',
    save_settings: 'Save Settings', force_sync: 'Force Sync Now',
    clear_queue: 'Clear Pending Queue',
    success_title: 'Sent!', success_msg: 'Your observation has been submitted successfully.',
    queued_title: 'Saved!', queued_msg: 'You are offline. Your observation is saved and will be sent automatically when you reconnect.',
    error_title: 'Error', error_msg: 'Could not send. Your observation is saved and will retry.',
    validation_error: 'Please fill in all required fields.',
    confirm_clear: 'Delete all pending reports? This cannot be undone.',
    synced_count: 'reports synced',
    no_endpoint: 'No endpoint configured. Report saved locally.',
    type_to_search: 'Type to search...',
  },
  da: {
    status_online: 'Online', status_offline: 'Offline — rapporter gemt lokalt',
    status_syncing: 'Synkroniserer...', pending_reports: 'ventende rapporter',
    install_instructions: 'For at installere: tryk Del, derefter Tilføj til hjemmeskærm',
    dismiss: 'Afvis', location: 'Placering', building: 'Bygning', level: 'Etage',
    select_building: 'Vælg bygning...', select_level: 'Vælg etage...',
    change_location: 'Skift placering', your_details: 'Dine oplysninger',
    observer_name: 'Navn', main_contractor: 'Hovedentreprenør',
    company_name: 'Firma', select_contractor: 'Vælg...',
    observation: 'Observation', observation_type: 'Type',
    safe: 'Sikker', unsafe: 'Usikker',
    category: 'Kategori', subcategory: 'Underkategori',
    select_category: 'Vælg kategori...', select_subcategory: 'Vælg underkategori...',
    description: 'Beskrivelse', photo: 'Foto',
    take_photo: 'Tag foto', from_gallery: 'Galleri',
    submit: 'Indsend observation', new_report: 'Ny rapport',
    settings: 'Indstillinger', saved_identity: 'Gemt identitet',
    save_settings: 'Gem indstillinger', force_sync: 'Synkroniser nu',
    clear_queue: 'Ryd ventende kø',
    success_title: 'Sendt!', success_msg: 'Din observation er indsendt.',
    queued_title: 'Gemt!', queued_msg: 'Du er offline. Din observation er gemt og sendes automatisk, når du kommer online igen.',
    error_title: 'Fejl', error_msg: 'Kunne ikke sende. Din observation er gemt og vil forsøge igen.',
    validation_error: 'Udfyld venligst alle obligatoriske felter.',
    confirm_clear: 'Slet alle ventende rapporter? Dette kan ikke fortrydes.',
    synced_count: 'rapporter synkroniseret',
    no_endpoint: 'Ingen endpoint konfigureret. Rapport gemt lokalt.',
    type_to_search: 'Skriv for at søge...',
  },
  de: {
    status_online: 'Online', status_offline: 'Offline — Berichte lokal gespeichert',
    status_syncing: 'Synchronisiere...', pending_reports: 'ausstehende Berichte',
    location: 'Standort', building: 'Gebäude', level: 'Ebene',
    change_location: 'Standort ändern', your_details: 'Ihre Angaben',
    observer_name: 'Name', main_contractor: 'Hauptauftragnehmer',
    company_name: 'Firma', observation: 'Beobachtung',
    safe: 'Sicher', unsafe: 'Unsicher',
    category: 'Kategorie', description: 'Beschreibung', photo: 'Foto',
    take_photo: 'Foto aufnehmen', from_gallery: 'Galerie',
    submit: 'Beobachtung einreichen', new_report: 'Neuer Bericht',
    settings: 'Einstellungen',
    success_title: 'Gesendet!', success_msg: 'Ihre Beobachtung wurde erfolgreich übermittelt.',
    queued_title: 'Gespeichert!', queued_msg: 'Sie sind offline. Ihre Beobachtung wird automatisch gesendet, wenn Sie wieder online sind.',
    validation_error: 'Bitte füllen Sie alle Pflichtfelder aus.',
  },
  pl: {
    status_online: 'Online', status_offline: 'Offline — raporty zapisane lokalnie',
    location: 'Lokalizacja', building: 'Budynek', level: 'Poziom',
    change_location: 'Zmień lokalizację', your_details: 'Twoje dane',
    observer_name: 'Imię i nazwisko', main_contractor: 'Główny wykonawca',
    company_name: 'Firma', observation: 'Obserwacja',
    safe: 'Bezpieczne', unsafe: 'Niebezpieczne',
    category: 'Kategoria', description: 'Opis', photo: 'Zdjęcie',
    take_photo: 'Zrób zdjęcie', from_gallery: 'Galeria',
    submit: 'Wyślij obserwację', new_report: 'Nowy raport',
    settings: 'Ustawienia',
    success_title: 'Wysłano!', queued_title: 'Zapisano!',
    validation_error: 'Proszę wypełnić wszystkie wymagane pola.',
  },
};

// Fallback: any missing key falls back to English
function t(key) {
  const lang = currentLang || 'en';
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
}

// ===== STATE ==================================================
let currentLang = localStorage.getItem('appLang') || 'en';
let currentBuilding = '';
let currentLevel = '';
let observationType = '';
let photoData = '';
let db = null;

// ===== IndexedDB ==============================================
const DB_NAME = 'm3-safety-observer';
const DB_VERSION = 1;
const STORE_NAME = 'observations';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

function addObservation(observation) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).add(observation);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function getAllPending() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result.filter(o => o.status === 'pending'));
    request.onerror = (e) => reject(e.target.error);
  });
}

function deleteObservation(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function clearAllObservations() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

// ===== UUID ===================================================
function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

// ===== SYNC ENGINE ============================================
let isSyncing = false;

async function syncPending() {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  const url = CONFIG.ENDPOINT_URL;
  if (!url) return;

  isSyncing = true;
  setStatus('syncing');

  try {
    const pending = await getAllPending();
    let syncedCount = 0;

    for (const obs of pending) {
      try {
        const payload = { ...obs };
        delete payload.status; // Don't send internal status field

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          await deleteObservation(obs.id);
          syncedCount++;
        }
      } catch (err) {
        // Network error for this item — stop trying rest, will retry later
        break;
      }
    }

    if (syncedCount > 0) {
      console.log(`Synced ${syncedCount} observations`);
    }
  } catch (err) {
    console.error('Sync error:', err);
  } finally {
    isSyncing = false;
    updateStatus();
    updatePendingBadge();
  }
}

// ===== ONLINE/OFFLINE STATUS ==================================
function setStatus(state) {
  const bar = document.getElementById('statusBar');
  bar.className = 'status-bar ' + state;
  const span = bar.querySelector('span');
  if (state === 'online') span.textContent = t('status_online');
  else if (state === 'offline') span.textContent = t('status_offline');
  else if (state === 'syncing') span.textContent = t('status_syncing');
}

function updateStatus() {
  setStatus(navigator.onLine ? 'online' : 'offline');
}

async function updatePendingBadge() {
  try {
    const pending = await getAllPending();
    const badge = document.getElementById('pendingBadge');
    const count = document.getElementById('pendingCount');
    if (pending.length > 0) {
      count.textContent = pending.length;
      badge.classList.add('visible');
    } else {
      badge.classList.remove('visible');
    }
  } catch (e) {
    // Silently fail
  }
}

// ===== i18n ===================================================
function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const translated = t(key);
    if (el.tagName === 'INPUT' && el.type !== 'submit') {
      el.placeholder = translated;
    } else if (el.tagName === 'OPTION') {
      el.textContent = translated;
    } else {
      // Preserve inner HTML for elements with <span class="required">
      if (el.querySelector('.required')) {
        el.childNodes[0].textContent = translated.replace(' *', '') + ' ';
      } else {
        el.textContent = translated;
      }
    }
  });
  // Update status bar text
  updateStatus();
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('appLang', lang);
  document.getElementById('langSelect').value = lang;
  applyTranslations();
}

// ===== POPULATE DROPDOWNS =====================================
function populateBuildingSelect() {
  const sel = document.getElementById('buildingSelect');
  // Keep the first "Select..." option
  while (sel.options.length > 1) sel.remove(1);
  Object.entries(CONFIG.BUILDINGS).forEach(([code, info]) => {
    const opt = document.createElement('option');
    opt.value = code;
    opt.textContent = info.name;
    sel.appendChild(opt);
  });
}

function populateLevelSelect(buildingCode) {
  const sel = document.getElementById('levelSelect');
  while (sel.options.length > 1) sel.remove(1);
  if (!buildingCode || !CONFIG.BUILDINGS[buildingCode]) return;
  CONFIG.BUILDINGS[buildingCode].levels.forEach(lv => {
    const opt = document.createElement('option');
    opt.value = lv;
    opt.textContent = lv;
    sel.appendChild(opt);
  });
}

function populateContractorSelect(selectId) {
  const sel = document.getElementById(selectId);
  while (sel.options.length > 1) sel.remove(1);
  CONFIG.MAIN_CONTRACTORS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
}

function populateCategorySelect() {
  const sel = document.getElementById('safetyCategory');
  while (sel.options.length > 1) sel.remove(1);
  CONFIG.CATEGORIES.forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat.name;
    opt.textContent = cat.name;
    sel.appendChild(opt);
  });
}

function populateSubcategorySelect(categoryName) {
  const sel = document.getElementById('subCategory');
  const group = document.getElementById('subCategoryGroup');
  while (sel.options.length > 1) sel.remove(1);

  const cat = CONFIG.CATEGORIES.find(c => c.name === categoryName);
  if (cat && cat.subs.length > 0) {
    group.classList.remove('hidden');
    cat.subs.forEach(sub => {
      const opt = document.createElement('option');
      opt.value = sub;
      opt.textContent = sub;
      sel.appendChild(opt);
    });
  } else {
    group.classList.add('hidden');
  }
}

// ===== SEARCHABLE COMPANY DROPDOWN ============================
function initCompanyDropdown() {
  const input = document.getElementById('companyName');
  const dropdown = document.getElementById('companyDropdown');

  input.setAttribute('placeholder', t('type_to_search'));

  input.addEventListener('focus', () => {
    showCompanyDropdown(input.value);
  });

  input.addEventListener('input', () => {
    showCompanyDropdown(input.value);
  });

  input.addEventListener('blur', () => {
    // Delay to allow click on dropdown item
    setTimeout(() => dropdown.classList.remove('open'), 200);
  });

  function showCompanyDropdown(filter) {
    dropdown.innerHTML = '';
    const filtered = CONFIG.COMPANIES.filter(c =>
      c.toLowerCase().includes((filter || '').toLowerCase())
    );
    if (filtered.length === 0) {
      dropdown.classList.remove('open');
      return;
    }
    filtered.forEach(c => {
      const div = document.createElement('div');
      div.className = 'dropdown-item';
      div.textContent = c;
      div.addEventListener('mousedown', (e) => {
        e.preventDefault();
        input.value = c;
        dropdown.classList.remove('open');
      });
      dropdown.appendChild(div);
    });
    dropdown.classList.add('open');
  }
}

// ===== QR / URL PARAMS ========================================
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const building = params.get('building');
  const level = params.get('level');

  if (building) {
    currentBuilding = building.toUpperCase();
    document.getElementById('buildingValue').textContent = currentBuilding;
  }
  if (level) {
    currentLevel = level.toUpperCase();
    document.getElementById('levelValue').textContent = currentLevel;
  }

  if (!building && !level) {
    // No QR params — show manual selection
    document.getElementById('locationManual').classList.remove('hidden');
    document.getElementById('buildingValue').textContent = '--';
    document.getElementById('levelValue').textContent = '--';
  }
}

// ===== PHOTO ==================================================
function handlePhoto(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    // Compress the image
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const MAX_DIM = 1200;
      let w = img.width;
      let h = img.height;

      if (w > MAX_DIM || h > MAX_DIM) {
        if (w > h) { h = Math.round(h * MAX_DIM / w); w = MAX_DIM; }
        else { w = Math.round(w * MAX_DIM / h); h = MAX_DIM; }
      }

      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);

      photoData = canvas.toDataURL('image/jpeg', 0.7);

      document.getElementById('photoImg').src = photoData;
      document.getElementById('photoPreview').style.display = 'block';
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ===== FORM VALIDATION ========================================
function validateForm() {
  const building = currentBuilding || document.getElementById('buildingSelect').value;
  const level = currentLevel || document.getElementById('levelSelect').value;
  const name = document.getElementById('observerName').value.trim();
  const contractor = document.getElementById('mainContractor').value;
  const company = document.getElementById('companyName').value.trim();
  const category = document.getElementById('safetyCategory').value;
  const description = document.getElementById('description').value.trim();

  if (!building || !level || !name || !contractor || !company || !observationType || !category || !description) {
    return false;
  }
  return true;
}

// ===== SUBMIT =================================================
async function submitObservation() {
  if (!validateForm()) {
    alert(t('validation_error'));
    return;
  }

  const building = currentBuilding || document.getElementById('buildingSelect').value;
  const level = currentLevel || document.getElementById('levelSelect').value;

  const observation = {
    id: uuid(),
    timestamp: new Date().toISOString(),
    project: CONFIG.PROJECT,
    building: building,
    level: level,
    mainContractor: document.getElementById('mainContractor').value,
    companyName: document.getElementById('companyName').value.trim(),
    observerName: document.getElementById('observerName').value.trim(),
    observationType: observationType,
    safetyCategory: document.getElementById('safetyCategory').value,
    subCategory: document.getElementById('subCategory').value || '',
    description: document.getElementById('description').value.trim(),
    photo: photoData || '',
    submittedLanguage: currentLang,
    status: 'pending', // Internal — not sent to endpoint
  };

  // Save identity for next time
  localStorage.setItem('savedName', observation.observerName);
  localStorage.setItem('savedContractor', observation.mainContractor);
  localStorage.setItem('savedCompany', observation.companyName);

  try {
    await addObservation(observation);
  } catch (err) {
    console.error('Failed to save observation:', err);
    showModal('error');
    return;
  }

  // Try to send immediately if online
  if (navigator.onLine && CONFIG.ENDPOINT_URL) {
    try {
      const payload = { ...observation };
      delete payload.status;

      const response = await fetch(CONFIG.ENDPOINT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await deleteObservation(observation.id);
        showModal('success');
      } else {
        showModal('queued');
      }
    } catch (err) {
      showModal('queued');
    }
  } else {
    showModal(CONFIG.ENDPOINT_URL ? 'queued' : 'no_endpoint');
  }

  updatePendingBadge();
}

// ===== MODAL ==================================================
function showModal(type) {
  const overlay = document.getElementById('resultModal');
  const icon = document.getElementById('modalIcon');
  const title = document.getElementById('modalTitle');
  const msg = document.getElementById('modalMessage');

  if (type === 'success') {
    icon.innerHTML = '<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="28" stroke="#2ed573" stroke-width="3"/><path d="M18 30l8 8 16-16" stroke="#2ed573" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    title.textContent = t('success_title');
    msg.textContent = t('success_msg');
  } else if (type === 'queued') {
    icon.innerHTML = '<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="28" stroke="#ffa502" stroke-width="3"/><path d="M30 18v16" stroke="#ffa502" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="42" r="2" fill="#ffa502"/></svg>';
    title.textContent = t('queued_title');
    msg.textContent = t('queued_msg');
  } else if (type === 'no_endpoint') {
    icon.innerHTML = '<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="28" stroke="#ffa502" stroke-width="3"/><path d="M30 18v16" stroke="#ffa502" stroke-width="3" stroke-linecap="round"/><circle cx="30" cy="42" r="2" fill="#ffa502"/></svg>';
    title.textContent = t('queued_title');
    msg.textContent = t('no_endpoint');
  } else {
    icon.innerHTML = '<svg viewBox="0 0 60 60" fill="none"><circle cx="30" cy="30" r="28" stroke="#ff4757" stroke-width="3"/><path d="M22 22l16 16M38 22L22 38" stroke="#ff4757" stroke-width="3" stroke-linecap="round"/></svg>';
    title.textContent = t('error_title');
    msg.textContent = t('error_msg');
  }

  overlay.classList.add('visible');
}

function hideModal() {
  document.getElementById('resultModal').classList.remove('visible');
}

// ===== RESET FORM =============================================
function resetForm() {
  // Keep identity fields (name, contractor, company) — they're saved
  observationType = '';
  photoData = '';
  document.getElementById('btnSafe').className = 'toggle-btn';
  document.getElementById('btnUnsafe').className = 'toggle-btn';
  document.getElementById('safetyCategory').value = '';
  document.getElementById('subCategory').value = '';
  document.getElementById('subCategoryGroup').classList.add('hidden');
  document.getElementById('description').value = '';
  document.getElementById('photoImg').src = '';
  document.getElementById('photoPreview').style.display = 'none';
  document.getElementById('cameraInput').value = '';
  document.getElementById('galleryInput').value = '';
}

// ===== SETTINGS ===============================================
function openSettings() {
  document.getElementById('settingsName').value = localStorage.getItem('savedName') || '';
  document.getElementById('settingsCompany').value = localStorage.getItem('savedCompany') || '';
  document.getElementById('settingsEndpoint').value = CONFIG.ENDPOINT_URL || '';

  // Populate contractor dropdown in settings
  populateContractorSelect('settingsContractor');
  document.getElementById('settingsContractor').value = localStorage.getItem('savedContractor') || '';

  document.getElementById('settingsScreen').classList.add('visible');
}

function closeSettings() {
  document.getElementById('settingsScreen').classList.remove('visible');
}

function saveSettings() {
  const name = document.getElementById('settingsName').value.trim();
  const contractor = document.getElementById('settingsContractor').value;
  const company = document.getElementById('settingsCompany').value.trim();
  const endpoint = document.getElementById('settingsEndpoint').value.trim();

  if (name) localStorage.setItem('savedName', name);
  if (contractor) localStorage.setItem('savedContractor', contractor);
  if (company) localStorage.setItem('savedCompany', company);

  if (endpoint) {
    localStorage.setItem('powerAutomateUrl', endpoint);
    CONFIG.ENDPOINT_URL = endpoint;
  }

  // Update main form with saved values
  document.getElementById('observerName').value = name;
  document.getElementById('mainContractor').value = contractor;
  document.getElementById('companyName').value = company;

  closeSettings();
}

// ===== INSTALL BANNER (iOS detection) =========================
function checkInstallBanner() {
  // Show install instructions for iOS Safari (not in standalone mode)
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (isIOS && !isStandalone) {
    const dismissed = localStorage.getItem('installBannerDismissed');
    if (!dismissed) {
      document.getElementById('installBanner').classList.add('visible');
    }
  }
}

// ===== GLOBAL HELPERS (for console access) ====================
window.setPowerAutomateUrl = function(url) {
  localStorage.setItem('powerAutomateUrl', url);
  CONFIG.ENDPOINT_URL = url;
  console.log('Power Automate URL set to:', url);
};

// ===== INIT ===================================================
async function init() {
  // Open IndexedDB
  await openDB();

  // Parse QR URL params
  parseUrlParams();

  // Restore language
  setLanguage(currentLang);

  // Populate dropdowns
  populateBuildingSelect();
  populateContractorSelect('mainContractor');
  populateCategorySelect();
  initCompanyDropdown();

  // Restore saved identity
  const savedName = localStorage.getItem('savedName');
  const savedContractor = localStorage.getItem('savedContractor');
  const savedCompany = localStorage.getItem('savedCompany');
  if (savedName) document.getElementById('observerName').value = savedName;
  if (savedContractor) document.getElementById('mainContractor').value = savedContractor;
  if (savedCompany) document.getElementById('companyName').value = savedCompany;

  // Status
  updateStatus();
  updatePendingBadge();

  // Install banner
  checkInstallBanner();

  // Try sync on load
  syncPending();

  // ===== EVENT LISTENERS =====================================

  // Online/offline
  window.addEventListener('online', () => {
    updateStatus();
    syncPending();
  });
  window.addEventListener('offline', () => updateStatus());

  // Sync on visibility change (user switches back to app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && navigator.onLine) {
      syncPending();
    }
  });

  // Language selector
  document.getElementById('langSelect').addEventListener('change', (e) => {
    setLanguage(e.target.value);
  });

  // Location: toggle manual edit
  document.getElementById('toggleLocationEdit').addEventListener('click', (e) => {
    e.preventDefault();
    const manual = document.getElementById('locationManual');
    manual.classList.toggle('hidden');
  });

  // Location: building select changes level options
  document.getElementById('buildingSelect').addEventListener('change', (e) => {
    const code = e.target.value;
    currentBuilding = code;
    document.getElementById('buildingValue').textContent = code || '--';
    populateLevelSelect(code);
  });

  document.getElementById('levelSelect').addEventListener('change', (e) => {
    currentLevel = e.target.value;
    document.getElementById('levelValue').textContent = currentLevel || '--';
  });

  // Safe/Unsafe toggle
  document.getElementById('btnSafe').addEventListener('click', () => {
    observationType = 'Safe';
    document.getElementById('btnSafe').className = 'toggle-btn active-safe';
    document.getElementById('btnUnsafe').className = 'toggle-btn';
  });

  document.getElementById('btnUnsafe').addEventListener('click', () => {
    observationType = 'Unsafe';
    document.getElementById('btnUnsafe').className = 'toggle-btn active-unsafe';
    document.getElementById('btnSafe').className = 'toggle-btn';
  });

  // Category -> subcategory
  document.getElementById('safetyCategory').addEventListener('change', (e) => {
    populateSubcategorySelect(e.target.value);
  });

  // Photo: camera
  document.getElementById('cameraInput').addEventListener('change', (e) => {
    handlePhoto(e.target.files[0]);
  });

  // Photo: gallery
  document.getElementById('galleryInput').addEventListener('change', (e) => {
    handlePhoto(e.target.files[0]);
  });

  // Remove photo
  document.getElementById('removePhoto').addEventListener('click', () => {
    photoData = '';
    document.getElementById('photoImg').src = '';
    document.getElementById('photoPreview').style.display = 'none';
    document.getElementById('cameraInput').value = '';
    document.getElementById('galleryInput').value = '';
  });

  // Submit
  document.getElementById('submitBtn').addEventListener('click', submitObservation);

  // Modal close -> reset form
  document.getElementById('modalClose').addEventListener('click', () => {
    hideModal();
    resetForm();
  });

  // Settings
  document.getElementById('settingsBtn').addEventListener('click', openSettings);
  document.getElementById('settingsBack').addEventListener('click', closeSettings);
  document.getElementById('settingsSave').addEventListener('click', saveSettings);

  document.getElementById('settingsForceSync').addEventListener('click', () => {
    syncPending();
  });

  document.getElementById('settingsClearQueue').addEventListener('click', async () => {
    if (confirm(t('confirm_clear'))) {
      await clearAllObservations();
      updatePendingBadge();
    }
  });

  // Install banner dismiss
  document.getElementById('installDismiss').addEventListener('click', () => {
    localStorage.setItem('installBannerDismissed', 'true');
    document.getElementById('installBanner').classList.remove('visible');
  });

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('SW registration failed:', err);
    });
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
