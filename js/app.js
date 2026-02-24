// ============================================================
// M3 Safety Observer — Main Application Logic
// ============================================================

// ===== CONFIGURATION (edit these for production) =============
// Dropdown data — short hardcoded lists for now.
// Later: load from external file (Excel/JSON endpoint).

const CONFIG = {
  // Power Automate POST URL. Set via settings or console: setPowerAutomateUrl('URL')
  // For testing, use webhook.site URL. For production, use Power Automate HTTP trigger URL.
  ENDPOINT_URL: localStorage.getItem('powerAutomateUrl') || 'https://webhook.site/6eebf958-ce28-4bcc-879a-ac81deddb63b',

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
    scan_qr: 'Scan QR Code',
    qr_hint: 'Point camera at a location QR code',
    qr_no_camera: 'Camera access not available',
    qr_found: 'Location set from QR code!',
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
    scan_qr: 'Scan QR-kode',
    qr_hint: 'Peg kameraet mod en placeringskode',
    qr_no_camera: 'Kameraadgang ikke tilgængelig',
    qr_found: 'Placering sat fra QR-kode!',
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
let photosData = []; // Array of base64 strings for multiple photos
let db = null;

// ===== IndexedDB ==============================================
const DB_NAME = 'm3-safety-observer';
const DB_VERSION = 2; // Bumped from 1 to add settings store
const STORE_NAME = 'observations';
const SETTINGS_STORE = 'settings';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
    request.onsuccess = (e) => {
      db = e.target.result;
      resolve(db);
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

// Settings persistence via IndexedDB (survives app reinstalls better than localStorage)
function saveSetting(key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).put({ key: key, value: value });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const request = tx.objectStore(SETTINGS_STORE).get(key);
    request.onsuccess = () => resolve(request.result ? request.result.value : null);
    request.onerror = (e) => reject(e.target.error);
  });
}

function saveIdentity(name, contractor, company) {
  return Promise.all([
    saveSetting('savedName', name),
    saveSetting('savedContractor', contractor),
    saveSetting('savedCompany', company),
  ]);
}

async function loadIdentity() {
  const name = await getSetting('savedName');
  const contractor = await getSetting('savedContractor');
  const company = await getSetting('savedCompany');
  return { name, contractor, company };
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

        // Use no-cors mode for compatibility with webhook.site and similar test endpoints.
        // With no-cors we can't read the response, so a successful fetch = sent.
        await fetch(url, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify(payload),
        });

        // If fetch didn't throw, the request was sent
        await deleteObservation(obs.id);
        syncedCount++;
      } catch (err) {
        // Network error for this item — stop trying rest, will retry later
        requestBackgroundSync(); // Queue a background sync for when connectivity returns
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
  if (db) saveSetting('appLang', lang).catch(() => {});
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

// ===== QR SCANNER =============================================
let qrStream = null;
let qrAnimFrame = null;

async function openQrScanner() {
  const overlay = document.getElementById('qrScannerOverlay');
  const video = document.getElementById('qrVideo');

  try {
    qrStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    });
    video.srcObject = qrStream;
    overlay.classList.add('visible');
    scanQrFrame();
  } catch (err) {
    console.error('Camera error:', err);
    alert(t('qr_no_camera'));
  }
}

function closeQrScanner() {
  const overlay = document.getElementById('qrScannerOverlay');
  const video = document.getElementById('qrVideo');

  overlay.classList.remove('visible');

  if (qrAnimFrame) {
    cancelAnimationFrame(qrAnimFrame);
    qrAnimFrame = null;
  }

  if (qrStream) {
    qrStream.getTracks().forEach(track => track.stop());
    qrStream = null;
  }
  video.srcObject = null;
}

function scanQrFrame() {
  const video = document.getElementById('qrVideo');

  if (!qrStream || video.readyState < 2) {
    qrAnimFrame = requestAnimationFrame(scanQrFrame);
    return;
  }

  // Try native BarcodeDetector first (iOS 16.4+, Chrome)
  if ('BarcodeDetector' in window) {
    const detector = new BarcodeDetector({ formats: ['qr_code'] });
    detector.detect(video).then(barcodes => {
      if (barcodes.length > 0) {
        handleQrResult(barcodes[0].rawValue);
        return;
      }
      qrAnimFrame = requestAnimationFrame(scanQrFrame);
    }).catch(() => {
      // Fall back to canvas scanning
      scanWithCanvas(video);
    });
  } else {
    scanWithCanvas(video);
  }
}

function scanWithCanvas(video) {
  // Canvas-based frame capture for jsQR fallback
  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

  if (window.jsQR) {
    const code = window.jsQR(imageData.data, canvas.width, canvas.height);
    if (code) {
      handleQrResult(code.data);
      return;
    }
  }
  qrAnimFrame = requestAnimationFrame(scanQrFrame);
}

function handleQrResult(rawValue) {
  closeQrScanner();

  // The QR could contain a full URL like https://example.com/test/?building=FAB1&level=L2
  // or just params like building=FAB1&level=L2
  let params;
  try {
    const url = new URL(rawValue);
    params = url.searchParams;
  } catch {
    // Not a full URL — try parsing as query string
    params = new URLSearchParams(rawValue.includes('?') ? rawValue.split('?')[1] : rawValue);
  }

  const building = params.get('building');
  const level = params.get('level');

  if (building) {
    currentBuilding = building.toUpperCase();
    document.getElementById('buildingValue').textContent = currentBuilding;
    // Also set the dropdown
    document.getElementById('buildingSelect').value = currentBuilding;
    populateLevelSelect(currentBuilding);
  }
  if (level) {
    currentLevel = level.toUpperCase();
    document.getElementById('levelValue').textContent = currentLevel;
    document.getElementById('levelSelect').value = currentLevel;
  }

  // Show manual section so user sees/can adjust the values
  document.getElementById('locationManual').classList.remove('hidden');

  // Brief visual feedback
  if (building || level) {
    const hint = document.querySelector('.qr-hint');
    if (hint) hint.textContent = t('qr_found');
  }
}

// Load jsQR fallback library if BarcodeDetector is not available
function loadJsQrFallback() {
  if ('BarcodeDetector' in window) return; // Not needed
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
  script.async = true;
  document.head.appendChild(script);
}

// ===== PHOTO ==================================================
const MAX_PHOTOS = 5;

function handlePhoto(file) {
  if (!file) return;
  if (photosData.length >= MAX_PHOTOS) {
    alert('Maximum ' + MAX_PHOTOS + ' photos allowed.');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
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

      const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
      photosData.push(dataUrl);
      renderPhotoGrid();
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function renderPhotoGrid() {
  const grid = document.getElementById('photoGrid');
  grid.innerHTML = '';

  photosData.forEach((data, index) => {
    const item = document.createElement('div');
    item.className = 'photo-grid-item';

    const img = document.createElement('img');
    img.src = data;
    img.alt = 'Photo ' + (index + 1);

    const removeBtn = document.createElement('button');
    removeBtn.className = 'remove-photo-mini';
    removeBtn.innerHTML = '&times;';
    removeBtn.addEventListener('click', () => {
      photosData.splice(index, 1);
      renderPhotoGrid();
    });

    item.appendChild(img);
    item.appendChild(removeBtn);
    grid.appendChild(item);
  });
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
    photo: photosData.length > 0 ? photosData[0] : '',
    photos: photosData.length > 0 ? photosData : [],
    submittedLanguage: currentLang,
    status: 'pending', // Internal — not sent to endpoint
  };

  // Save identity for next time (IndexedDB persists better than localStorage)
  saveIdentity(observation.observerName, observation.mainContractor, observation.companyName);

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

      // Use no-cors for compatibility with webhook.site and similar test endpoints.
      await fetch(CONFIG.ENDPOINT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify(payload),
      });

      // If fetch didn't throw, the request was sent
      await deleteObservation(observation.id);
      showModal('success');
    } catch (err) {
      showModal('queued');
    }
  } else {
    showModal(CONFIG.ENDPOINT_URL ? 'queued' : 'no_endpoint');
    // Request background sync so Android can send when back online (even if app closed)
    requestBackgroundSync();
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
  photosData = [];
  document.getElementById('btnSafe').className = 'toggle-btn';
  document.getElementById('btnUnsafe').className = 'toggle-btn';
  document.getElementById('safetyCategory').value = '';
  document.getElementById('subCategory').value = '';
  document.getElementById('subCategoryGroup').classList.add('hidden');
  document.getElementById('description').value = '';
  document.getElementById('photoGrid').innerHTML = '';
  document.getElementById('cameraInput').value = '';
  document.getElementById('galleryInput').value = '';
}

// ===== SETTINGS ===============================================
async function openSettings() {
  document.getElementById('settingsEndpoint').value = CONFIG.ENDPOINT_URL || '';

  // Populate contractor dropdown in settings
  populateContractorSelect('settingsContractor');

  // Load identity from IndexedDB
  try {
    const identity = await loadIdentity();
    document.getElementById('settingsName').value = identity.name || '';
    document.getElementById('settingsCompany').value = identity.company || '';
    document.getElementById('settingsContractor').value = identity.contractor || '';
  } catch (e) {
    // Fallback to current form values
    document.getElementById('settingsName').value = document.getElementById('observerName').value;
    document.getElementById('settingsCompany').value = document.getElementById('companyName').value;
    document.getElementById('settingsContractor').value = document.getElementById('mainContractor').value;
  }

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

  // Save identity to IndexedDB (persists better than localStorage)
  if (name || contractor || company) {
    saveIdentity(name, contractor, company);
  }

  if (endpoint) {
    localStorage.setItem('powerAutomateUrl', endpoint);
    CONFIG.ENDPOINT_URL = endpoint;
    saveSetting('powerAutomateUrl', endpoint).catch(() => {});
    sendEndpointToSW();
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

// ===== BACKGROUND SYNC (Android) ==============================
// Registers a one-shot sync so the service worker can send pending
// observations when connectivity returns, even if the app isn't open.
async function requestBackgroundSync() {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const reg = await navigator.serviceWorker.ready;
      await reg.sync.register('sync-observations');
    } catch (err) {
      // Sync registration failed — app will still retry via periodic timer
    }
  }
}

// Send the current endpoint URL to the service worker so it can
// perform background sync without access to localStorage.
function sendEndpointToSW() {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SET_ENDPOINT',
      url: CONFIG.ENDPOINT_URL,
    });
  }
}

// ===== GLOBAL HELPERS (for console access) ====================
window.setPowerAutomateUrl = function(url) {
  localStorage.setItem('powerAutomateUrl', url);
  CONFIG.ENDPOINT_URL = url;
  saveSetting('powerAutomateUrl', url).catch(() => {});
  sendEndpointToSW();
  console.log('Power Automate URL set to:', url);
};

// ===== INIT ===================================================
async function init() {
  // Open IndexedDB
  await openDB();

  // Restore endpoint URL from IndexedDB (more persistent than localStorage)
  try {
    const savedEndpoint = await getSetting('powerAutomateUrl');
    if (savedEndpoint) CONFIG.ENDPOINT_URL = savedEndpoint;
  } catch (e) {}

  // Parse QR URL params
  parseUrlParams();

  // Restore language (try IndexedDB first, fallback to localStorage)
  try {
    const savedLang = await getSetting('appLang');
    if (savedLang) currentLang = savedLang;
  } catch (e) {}
  setLanguage(currentLang);

  // Populate dropdowns
  populateBuildingSelect();
  populateContractorSelect('mainContractor');
  populateCategorySelect();
  initCompanyDropdown();

  // Restore saved identity from IndexedDB (persists across reinstalls)
  try {
    const identity = await loadIdentity();
    if (identity.name) document.getElementById('observerName').value = identity.name;
    if (identity.contractor) document.getElementById('mainContractor').value = identity.contractor;
    if (identity.company) document.getElementById('companyName').value = identity.company;
  } catch (e) {
    // Fall back to localStorage for migration from old version
    const savedName = localStorage.getItem('savedName');
    const savedContractor = localStorage.getItem('savedContractor');
    const savedCompany = localStorage.getItem('savedCompany');
    if (savedName) document.getElementById('observerName').value = savedName;
    if (savedContractor) document.getElementById('mainContractor').value = savedContractor;
    if (savedCompany) document.getElementById('companyName').value = savedCompany;
  }

  // Status
  updateStatus();
  updatePendingBadge();

  // Install banner
  checkInstallBanner();

  // Load jsQR fallback if needed
  loadJsQrFallback();

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
    if (document.visibilityState === 'visible') {
      updateStatus();
      if (navigator.onLine) syncPending();
    }
  });

  // Periodic sync retry every 15s while app is open (covers iOS limitation)
  setInterval(() => {
    if (navigator.onLine && document.visibilityState === 'visible') {
      syncPending();
    }
  }, 15000);

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

  // Reset file inputs after each photo so the same file can be re-selected
  document.getElementById('cameraInput').addEventListener('click', function() { this.value = ''; });
  document.getElementById('galleryInput').addEventListener('click', function() { this.value = ''; });

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

  // QR Scanner
  document.getElementById('scanQrBtn').addEventListener('click', openQrScanner);
  document.getElementById('qrCloseBtn').addEventListener('click', closeQrScanner);

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(() => {
      // Once active, send endpoint URL so background sync can use it
      navigator.serviceWorker.ready.then(() => sendEndpointToSW());
    }).catch(err => {
      console.error('SW registration failed:', err);
    });
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
