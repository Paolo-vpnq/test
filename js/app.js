// ============================================================
// M3 Safety Observer — Main Application Logic
// ============================================================

// ===== CONFIGURATION (edit these for production) =============
// Dropdown data — short hardcoded lists for now.
// Later: load from external file (Excel/JSON endpoint).

const CONFIG = {
  // Power Automate POST URL. Set via settings or console: setPowerAutomateUrl('URL')
  // For testing, use webhook.site URL. For production, use Power Automate HTTP trigger URL.
  ENDPOINT_URL: localStorage.getItem('powerAutomateUrl') || 'https://webhook.site/872b4482-e4d0-4e89-b71a-d9bf48112c81',

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

  // Add/remove contractors here — changes propagate to all users on next update.
  // "My contractor is not listed" option is added automatically in the UI.
  MAIN_CONTRACTORS: [
    'MT Hojgaard',
    'Kemp & Lauritzen',
    'Caverion',
    'Bravida',
  ],

  // Add/remove categories here — changes propagate to all users on next update.
  CATEGORIES: [
    { id: 1,  name: '1. Access/Exit' },
    { id: 2,  name: '2. Barriers/Signage/Shielding' },
    { id: 3,  name: '3. Housekeeping/Waste' },
    { id: 4,  name: '4. Noise/Dust/Fumes/Health Hazards' },
    { id: 5,  name: '5. Storage and Handling of Materials' },
    { id: 6,  name: '6. Electrical Hazards' },
    { id: 7,  name: '7. Working at Heights' },
    { id: 8,  name: '8. Lifting/Rigging' },
    { id: 9,  name: '9. Hot Works' },
    { id: 10, name: '10. Mobile Elevating Work Equipment' },
    { id: 11, name: '11. Lighting' },
    { id: 12, name: '12. Documentation and Procedures' },
    { id: 13, name: '13. Scaffold/Alloy Towers' },
    { id: 14, name: '14. Slip/Trip Hazard' },
    { id: 15, name: '15. Personal Protective Equipment' },
    { id: 16, name: '16. Use of Tools and Machinery' },
    { id: 17, name: '17. Environmental Hazards' },
    { id: 18, name: '18. Emergency Equipment' },
    { id: 19, name: '19. Excavation/Trenches' },
    { id: 20, name: '20. Other' },
  ],
};

// ===== TRANSLATIONS ==========================================
// UI-only translations. Data is always stored/sent in English.
// Every language must have all keys. Missing keys fall back to English.
const TRANSLATIONS = {
  en: {
    status_online: 'Online', status_offline: 'Offline — reports saved locally',
    status_syncing: 'Syncing...', pending_reports: 'pending reports',
    install_instructions: 'To install: tap Share then Add to Home Screen',
    dismiss: 'Dismiss', location: 'Location', building: 'Building', level: 'Level',
    select_building: 'Select building...', select_level: 'Select level...',
    change_location: 'Change', your_details: 'Your Details',
    observer_name: 'Name', main_contractor: 'Main Contractor',
    select_contractor: 'Select...',
    observation: 'Observation',
    category: 'Category',
    select_category: 'Select category...',
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
    scan_qr: 'Scan QR Code',
    qr_hint: 'Point camera at a location QR code',
    qr_no_camera: 'Camera access not available',
    qr_found: 'Location set from QR code!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  da: {
    status_online: 'Online', status_offline: 'Offline — rapporter gemt lokalt',
    status_syncing: 'Synkroniserer...', pending_reports: 'ventende rapporter',
    install_instructions: 'For at installere: tryk Del, derefter Tilf\u00f8j til hjemmesk\u00e6rm',
    dismiss: 'Afvis', location: 'Placering', building: 'Bygning', level: 'Etage',
    select_building: 'V\u00e6lg bygning...', select_level: 'V\u00e6lg etage...',
    change_location: 'Change', your_details: 'Dine oplysninger',
    observer_name: 'Navn', main_contractor: 'Hovedentrepren\u00f8r',
    select_contractor: 'V\u00e6lg...',
    observation: 'Observation',
    category: 'Kategori',
    select_category: 'V\u00e6lg kategori...',
    description: 'Beskrivelse', photo: 'Foto',
    take_photo: 'Tag foto', from_gallery: 'Galleri',
    submit: 'Indsend observation', new_report: 'Ny rapport',
    settings: 'Indstillinger', saved_identity: 'Gemt identitet',
    save_settings: 'Gem indstillinger', force_sync: 'Synkroniser nu',
    clear_queue: 'Ryd ventende k\u00f8',
    success_title: 'Sendt!', success_msg: 'Din observation er indsendt.',
    queued_title: 'Gemt!', queued_msg: 'Du er offline. Din observation er gemt og sendes automatisk, n\u00e5r du kommer online igen.',
    error_title: 'Fejl', error_msg: 'Kunne ikke sende. Din observation er gemt og vil fors\u00f8ge igen.',
    validation_error: 'Udfyld venligst alle obligatoriske felter.',
    confirm_clear: 'Slet alle ventende rapporter? Dette kan ikke fortrydes.',
    synced_count: 'rapporter synkroniseret',
    no_endpoint: 'Ingen endpoint konfigureret. Rapport gemt lokalt.',
    scan_qr: 'Scan QR-kode',
    qr_hint: 'Peg kameraet mod en placeringskode',
    qr_no_camera: 'Kameraadgang ikke tilg\u00e6ngelig',
    qr_found: 'Placering sat fra QR-kode!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  de: {
    status_online: 'Online', status_offline: 'Offline — Berichte lokal gespeichert',
    status_syncing: 'Synchronisiere...', pending_reports: 'ausstehende Berichte',
    install_instructions: 'Zum Installieren: Teilen antippen, dann Zum Home-Bildschirm',
    dismiss: 'Schlie\u00dfen', location: 'Standort', building: 'Geb\u00e4ude', level: 'Ebene',
    select_building: 'Geb\u00e4ude w\u00e4hlen...', select_level: 'Ebene w\u00e4hlen...',
    change_location: 'Change', your_details: 'Ihre Angaben',
    observer_name: 'Name', main_contractor: 'Hauptauftragnehmer',
    select_contractor: 'W\u00e4hlen...',
    observation: 'Beobachtung',
    category: 'Kategorie',
    select_category: 'Kategorie w\u00e4hlen...',
    description: 'Beschreibung', photo: 'Foto',
    take_photo: 'Foto aufnehmen', from_gallery: 'Galerie',
    submit: 'Beobachtung einreichen', new_report: 'Neuer Bericht',
    settings: 'Einstellungen', saved_identity: 'Gespeicherte Identit\u00e4t',
    save_settings: 'Einstellungen speichern', force_sync: 'Jetzt synchronisieren',
    clear_queue: 'Warteschlange leeren',
    success_title: 'Gesendet!', success_msg: 'Ihre Beobachtung wurde erfolgreich \u00fcbermittelt.',
    queued_title: 'Gespeichert!', queued_msg: 'Sie sind offline. Ihre Beobachtung wird automatisch gesendet, wenn Sie wieder online sind.',
    error_title: 'Fehler', error_msg: 'Konnte nicht senden. Ihre Beobachtung ist gespeichert und wird erneut versucht.',
    validation_error: 'Bitte f\u00fcllen Sie alle Pflichtfelder aus.',
    confirm_clear: 'Alle ausstehenden Berichte l\u00f6schen? Dies kann nicht r\u00fcckg\u00e4ngig gemacht werden.',
    synced_count: 'Berichte synchronisiert',
    no_endpoint: 'Kein Endpoint konfiguriert. Bericht lokal gespeichert.',
    scan_qr: 'QR-Code scannen',
    qr_hint: 'Kamera auf einen Standort-QR-Code richten',
    qr_no_camera: 'Kamerazugriff nicht verf\u00fcgbar',
    qr_found: 'Standort aus QR-Code gesetzt!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  pl: {
    status_online: 'Online', status_offline: 'Offline — raporty zapisane lokalnie',
    status_syncing: 'Synchronizacja...', pending_reports: 'oczekuj\u0105ce raporty',
    install_instructions: 'Aby zainstalowa\u0107: naci\u015bnij Udost\u0119pnij, nast\u0119pnie Dodaj do ekranu g\u0142\u00f3wnego',
    dismiss: 'Zamknij', location: 'Lokalizacja', building: 'Budynek', level: 'Poziom',
    select_building: 'Wybierz budynek...', select_level: 'Wybierz poziom...',
    change_location: 'Change', your_details: 'Twoje dane',
    observer_name: 'Imi\u0119 i nazwisko', main_contractor: 'G\u0142\u00f3wny wykonawca',
    select_contractor: 'Wybierz...',
    observation: 'Obserwacja',
    category: 'Kategoria',
    select_category: 'Wybierz kategori\u0119...',
    description: 'Opis', photo: 'Zdj\u0119cie',
    take_photo: 'Zr\u00f3b zdj\u0119cie', from_gallery: 'Galeria',
    submit: 'Wy\u015blij obserwacj\u0119', new_report: 'Nowy raport',
    settings: 'Ustawienia', saved_identity: 'Zapisana to\u017csamo\u015b\u0107',
    save_settings: 'Zapisz ustawienia', force_sync: 'Synchronizuj teraz',
    clear_queue: 'Wyczy\u015b\u0107 kolejk\u0119',
    success_title: 'Wys\u0142ano!', success_msg: 'Twoja obserwacja zosta\u0142a wys\u0142ana.',
    queued_title: 'Zapisano!', queued_msg: 'Jeste\u015b offline. Obserwacja jest zapisana i zostanie wys\u0142ana automatycznie po po\u0142\u0105czeniu.',
    error_title: 'B\u0142\u0105d', error_msg: 'Nie uda\u0142o si\u0119 wys\u0142a\u0107. Obserwacja jest zapisana i spr\u00f3buje ponownie.',
    validation_error: 'Prosz\u0119 wype\u0142ni\u0107 wszystkie wymagane pola.',
    confirm_clear: 'Usun\u0105\u0107 wszystkie oczekuj\u0105ce raporty? Tego nie mo\u017cna cofn\u0105\u0107.',
    synced_count: 'raport\u00f3w zsynchronizowanych',
    no_endpoint: 'Brak skonfigurowanego endpointu. Raport zapisany lokalnie.',
    scan_qr: 'Skanuj kod QR',
    qr_hint: 'Skieruj kamer\u0119 na kod QR lokalizacji',
    qr_no_camera: 'Kamera niedost\u0119pna',
    qr_found: 'Lokalizacja ustawiona z kodu QR!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  lt: {
    status_online: 'Prisijungta', status_offline: 'Neprisijungta — ataskaitos i\u0161saugotos',
    status_syncing: 'Sinchronizuojama...', pending_reports: 'laukian\u010dios ataskaitos',
    install_instructions: '\u012ediegti: paspauskite Dalintis, tada Prid\u0117ti prie ekrano',
    dismiss: 'Atmesti', location: 'Vieta', building: 'Pastatas', level: 'Auk\u0161tas',
    select_building: 'Pasirinkite pastat\u0105...', select_level: 'Pasirinkite auk\u0161t\u0105...',
    change_location: 'Change', your_details: 'J\u016bs\u0173 duomenys',
    observer_name: 'Vardas', main_contractor: 'Pagrindinis rangovas',
    select_contractor: 'Pasirinkite...',
    observation: 'Steb\u0117jimas',
    category: 'Kategorija',
    select_category: 'Pasirinkite kategorij\u0105...',
    description: 'Apra\u0161ymas', photo: 'Nuotrauka',
    take_photo: 'Fotografuoti', from_gallery: 'Galerija',
    submit: 'Pateikti steb\u0117jim\u0105', new_report: 'Nauja ataskaita',
    settings: 'Nustatymai', saved_identity: 'I\u0161saugota tapatyb\u0117',
    save_settings: 'I\u0161saugoti nustatymus', force_sync: 'Sinchronizuoti dabar',
    clear_queue: 'I\u0161valyti eil\u0119',
    success_title: 'I\u0161si\u0173sta!', success_msg: 'J\u016bs\u0173 steb\u0117jimas s\u0117kmingai pateiktas.',
    queued_title: 'I\u0161saugota!', queued_msg: 'Esate neprisijung\u0119. Steb\u0117jimas i\u0161saugotas ir bus i\u0161si\u0173stas automati\u0161kai.',
    error_title: 'Klaida', error_msg: 'Nepavyko i\u0161si\u0173sti. Steb\u0117jimas i\u0161saugotas ir bus bandoma dar kart\u0105.',
    validation_error: 'Pra\u0161ome u\u017epildyti visus privalomus laukus.',
    confirm_clear: 'I\u0161trinti visas laukian\u010dias ataskaitas? Negalima at\u0161aukti.',
    synced_count: 'ataskaitos sinchronizuotos',
    no_endpoint: 'Endpointas nenurodytas. Ataskaita i\u0161saugota.',
    scan_qr: 'Skenuoti QR kod\u0105',
    qr_hint: 'Nukreipkite kamer\u0105 \u012f vietos QR kod\u0105',
    qr_no_camera: 'Kamera nepasiekiama',
    qr_found: 'Vieta nustatyta i\u0161 QR kodo!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  ro: {
    status_online: 'Online', status_offline: 'Offline — rapoarte salvate local',
    status_syncing: 'Se sincronizeaz\u0103...', pending_reports: 'rapoarte \u00een a\u0219teptare',
    install_instructions: 'Pentru instalare: ap\u0103sa\u021bi Partajare apoi Ad\u0103ugare pe ecran',
    dismiss: '\u00cenchide', location: 'Loca\u021bie', building: 'Cl\u0103dire', level: 'Nivel',
    select_building: 'Selecta\u021bi cl\u0103direa...', select_level: 'Selecta\u021bi nivelul...',
    change_location: 'Change', your_details: 'Datele tale',
    observer_name: 'Nume', main_contractor: 'Antreprenor principal',
    select_contractor: 'Selecta\u021bi...',
    observation: 'Observa\u021bie',
    category: 'Categorie',
    select_category: 'Selecta\u021bi categoria...',
    description: 'Descriere', photo: 'Fotografie',
    take_photo: 'Face\u021bi o fotografie', from_gallery: 'Galerie',
    submit: 'Trimite\u021bi observa\u021bia', new_report: 'Raport nou',
    settings: 'Set\u0103ri', saved_identity: 'Identitate salvat\u0103',
    save_settings: 'Salva\u021bi set\u0103rile', force_sync: 'Sincronizare acum',
    clear_queue: 'Goli\u021bi coada',
    success_title: 'Trimis!', success_msg: 'Observa\u021bia dvs. a fost trimis\u0103 cu succes.',
    queued_title: 'Salvat!', queued_msg: 'Sunte\u021bi offline. Observa\u021bia este salvat\u0103 \u0219i va fi trimis\u0103 automat.',
    error_title: 'Eroare', error_msg: 'Nu s-a putut trimite. Observa\u021bia este salvat\u0103 \u0219i va re\u00eencerca.',
    validation_error: 'V\u0103 rug\u0103m s\u0103 completa\u021bi toate c\u00e2mpurile obligatorii.',
    confirm_clear: '\u0218terge\u021bi toate rapoartele? Aceast\u0103 ac\u021biune nu poate fi anulat\u0103.',
    synced_count: 'rapoarte sincronizate',
    no_endpoint: 'Niciun endpoint configurat. Raport salvat local.',
    scan_qr: 'Scana\u021bi codul QR',
    qr_hint: '\u00cendrepta\u021bi camera spre un cod QR',
    qr_no_camera: 'Camera nu este disponibil\u0103',
    qr_found: 'Loca\u021bie setat\u0103 din codul QR!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  hr: {
    status_online: 'Online', status_offline: 'Offline — izvje\u0161\u0107a spremljena lokalno',
    status_syncing: 'Sinkronizacija...', pending_reports: 'izvje\u0161\u0107a na \u010dekanju',
    install_instructions: 'Za instalaciju: pritisnite Dijeli, zatim Dodaj na po\u010detni zaslon',
    dismiss: 'Odbaci', location: 'Lokacija', building: 'Zgrada', level: 'Razina',
    select_building: 'Odaberite zgradu...', select_level: 'Odaberite razinu...',
    change_location: 'Change', your_details: 'Va\u0161i podaci',
    observer_name: 'Ime', main_contractor: 'Glavni izvo\u0111a\u010d',
    select_contractor: 'Odaberite...',
    observation: 'Opa\u017eanje',
    category: 'Kategorija',
    select_category: 'Odaberite kategoriju...',
    description: 'Opis', photo: 'Fotografija',
    take_photo: 'Snimi fotografiju', from_gallery: 'Galerija',
    submit: 'Po\u0161alji opa\u017eanje', new_report: 'Novo izvje\u0161\u0107e',
    settings: 'Postavke', saved_identity: 'Spremljeni identitet',
    save_settings: 'Spremi postavke', force_sync: 'Sinkroniziraj sada',
    clear_queue: 'O\u010disti red \u010dekanja',
    success_title: 'Poslano!', success_msg: 'Va\u0161e opa\u017eanje je uspje\u0161no poslano.',
    queued_title: 'Spremljeno!', queued_msg: 'Offline ste. Opa\u017eanje je spremljeno i bit \u0107e poslano automatski.',
    error_title: 'Gre\u0161ka', error_msg: 'Slanje nije uspjelo. Opa\u017eanje je spremljeno i poku\u0161at \u0107e ponovno.',
    validation_error: 'Molimo ispunite sva obavezna polja.',
    confirm_clear: 'Izbrisati sva izvje\u0161\u0107a na \u010dekanju? Ovo se ne mo\u017ee poni\u0161titi.',
    synced_count: 'izvje\u0161\u0107a sinkronizirana',
    no_endpoint: 'Endpoint nije konfiguriran. Izvje\u0161\u0107e spremljeno lokalno.',
    scan_qr: 'Skeniraj QR kod',
    qr_hint: 'Usmjerite kameru na QR kod lokacije',
    qr_no_camera: 'Kamera nije dostupna',
    qr_found: 'Lokacija postavljena iz QR koda!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  sv: {
    status_online: 'Online', status_offline: 'Offline — rapporter sparade lokalt',
    status_syncing: 'Synkroniserar...', pending_reports: 'v\u00e4ntande rapporter',
    install_instructions: 'F\u00f6r att installera: tryck Dela, sedan L\u00e4gg till p\u00e5 hemsk\u00e4rmen',
    dismiss: 'Avvisa', location: 'Plats', building: 'Byggnad', level: 'V\u00e5ning',
    select_building: 'V\u00e4lj byggnad...', select_level: 'V\u00e4lj v\u00e5ning...',
    change_location: 'Change', your_details: 'Dina uppgifter',
    observer_name: 'Namn', main_contractor: 'Huvudentrepren\u00f6r',
    select_contractor: 'V\u00e4lj...',
    observation: 'Observation',
    category: 'Kategori',
    select_category: 'V\u00e4lj kategori...',
    description: 'Beskrivning', photo: 'Foto',
    take_photo: 'Ta foto', from_gallery: 'Galleri',
    submit: 'Skicka observation', new_report: 'Ny rapport',
    settings: 'Inst\u00e4llningar', saved_identity: 'Sparad identitet',
    save_settings: 'Spara inst\u00e4llningar', force_sync: 'Synkronisera nu',
    clear_queue: 'Rensa v\u00e4ntande k\u00f6',
    success_title: 'Skickat!', success_msg: 'Din observation har skickats.',
    queued_title: 'Sparat!', queued_msg: 'Du \u00e4r offline. Din observation \u00e4r sparad och skickas automatiskt.',
    error_title: 'Fel', error_msg: 'Kunde inte skicka. Din observation \u00e4r sparad och f\u00f6rs\u00f6ker igen.',
    validation_error: 'V\u00e4nligen fyll i alla obligatoriska f\u00e4lt.',
    confirm_clear: 'Radera alla v\u00e4ntande rapporter? Detta kan inte \u00e5ngras.',
    synced_count: 'rapporter synkroniserade',
    no_endpoint: 'Ingen endpoint konfigurerad. Rapport sparad lokalt.',
    scan_qr: 'Skanna QR-kod',
    qr_hint: 'Rikta kameran mot en plats-QR-kod',
    qr_no_camera: 'Kamera\u00e5tkomst inte tillg\u00e4nglig',
    qr_found: 'Plats satt fr\u00e5n QR-kod!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  hi: {
    status_online: '\u0911\u0928\u0932\u093e\u0907\u0928', status_offline: '\u0911\u092b\u093c\u0932\u093e\u0907\u0928 — \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0938\u094d\u0925\u093e\u0928\u0940\u092f \u0930\u0942\u092a \u0938\u0947 \u0938\u0939\u0947\u091c\u0940 \u0917\u0908\u0902',
    status_syncing: '\u0938\u093f\u0902\u0915 \u0939\u094b \u0930\u0939\u093e \u0939\u0948...', pending_reports: '\u0932\u0902\u092c\u093f\u0924 \u0930\u093f\u092a\u094b\u0930\u094d\u091f',
    install_instructions: '\u0907\u0902\u0938\u094d\u091f\u0949\u0932 \u0915\u0930\u0928\u0947 \u0915\u0947 \u0932\u093f\u090f: \u0936\u0947\u092f\u0930 \u092a\u0930 \u091f\u0948\u092a \u0915\u0930\u0947\u0902, \u092b\u093f\u0930 \u0939\u094b\u092e \u0938\u094d\u0915\u094d\u0930\u0940\u0928 \u092a\u0930 \u091c\u094b\u0921\u093c\u0947\u0902',
    dismiss: '\u0916\u093e\u0930\u093f\u091c \u0915\u0930\u0947\u0902', location: '\u0938\u094d\u0925\u093e\u0928', building: '\u092d\u0935\u0928', level: '\u092e\u0902\u091c\u093c\u093f\u0932',
    select_building: '\u092d\u0935\u0928 \u091a\u0941\u0928\u0947\u0902...', select_level: '\u092e\u0902\u091c\u093c\u093f\u0932 \u091a\u0941\u0928\u0947\u0902...',
    change_location: 'Change', your_details: '\u0906\u092a\u0915\u093e \u0935\u093f\u0935\u0930\u0923',
    observer_name: '\u0928\u093e\u092e', main_contractor: '\u092e\u0941\u0916\u094d\u092f \u0920\u0947\u0915\u0947\u0926\u093e\u0930',
    select_contractor: '\u091a\u0941\u0928\u0947\u0902...',
    observation: '\u0905\u0935\u0932\u094b\u0915\u0928',
    category: '\u0936\u094d\u0930\u0947\u0923\u0940',
    select_category: '\u0936\u094d\u0930\u0947\u0923\u0940 \u091a\u0941\u0928\u0947\u0902...',
    description: '\u0935\u093f\u0935\u0930\u0923', photo: '\u092b\u093c\u094b\u091f\u094b',
    take_photo: '\u092b\u093c\u094b\u091f\u094b \u0932\u0947\u0902', from_gallery: '\u0917\u0948\u0932\u0930\u0940',
    submit: '\u0905\u0935\u0932\u094b\u0915\u0928 \u091c\u092e\u093e \u0915\u0930\u0947\u0902', new_report: '\u0928\u0908 \u0930\u093f\u092a\u094b\u0930\u094d\u091f',
    settings: '\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938', saved_identity: '\u0938\u0939\u0947\u091c\u0940 \u0917\u0908 \u092a\u0939\u091a\u093e\u0928',
    save_settings: '\u0938\u0947\u091f\u093f\u0902\u0917\u094d\u0938 \u0938\u0939\u0947\u091c\u0947\u0902', force_sync: '\u0905\u092d\u0940 \u0938\u093f\u0902\u0915 \u0915\u0930\u0947\u0902',
    clear_queue: '\u0915\u0924\u093e\u0930 \u0938\u093e\u092b\u093c \u0915\u0930\u0947\u0902',
    success_title: '\u092d\u0947\u091c\u093e \u0917\u092f\u093e!', success_msg: '\u0906\u092a\u0915\u093e \u0905\u0935\u0932\u094b\u0915\u0928 \u0938\u092b\u0932\u0924\u093e\u092a\u0942\u0930\u094d\u0935\u0915 \u091c\u092e\u093e \u0939\u094b \u0917\u092f\u093e\u0964',
    queued_title: '\u0938\u0939\u0947\u091c\u093e \u0917\u092f\u093e!', queued_msg: '\u0906\u092a \u0911\u092b\u093c\u0932\u093e\u0907\u0928 \u0939\u0948\u0902\u0964 \u0905\u0935\u0932\u094b\u0915\u0928 \u0938\u0939\u0947\u091c\u093e \u0917\u092f\u093e \u0939\u0948 \u0914\u0930 \u0915\u0928\u0947\u0915\u094d\u091f \u0939\u094b\u0928\u0947 \u092a\u0930 \u0938\u094d\u0935\u091a\u093e\u0932\u093f\u0924 \u092d\u0947\u091c\u093e \u091c\u093e\u090f\u0917\u093e\u0964',
    error_title: '\u0924\u094d\u0930\u0941\u091f\u093f', error_msg: '\u092d\u0947\u091c \u0928\u0939\u0940\u0902 \u0938\u0915\u093e\u0964 \u0905\u0935\u0932\u094b\u0915\u0928 \u0938\u0939\u0947\u091c\u093e \u0917\u092f\u093e \u0939\u0948 \u0914\u0930 \u092a\u0941\u0928\u0903 \u092a\u094d\u0930\u092f\u093e\u0938 \u0915\u0930\u0947\u0917\u093e\u0964',
    validation_error: '\u0915\u0943\u092a\u092f\u093e \u0938\u092d\u0940 \u0906\u0935\u0936\u094d\u092f\u0915 \u092b\u093c\u0940\u0932\u094d\u0921 \u092d\u0930\u0947\u0902\u0964',
    confirm_clear: '\u0938\u092d\u0940 \u0932\u0902\u092c\u093f\u0924 \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0939\u091f\u093e\u090f\u0902? \u092f\u0939 \u0935\u093e\u092a\u0938 \u0928\u0939\u0940\u0902 \u0939\u094b \u0938\u0915\u0924\u093e\u0964',
    synced_count: '\u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0938\u093f\u0902\u0915 \u0939\u0941\u0908\u0902',
    no_endpoint: '\u0915\u094b\u0908 \u090f\u0902\u0921\u092a\u0949\u0907\u0902\u091f \u0928\u0939\u0940\u0902\u0964 \u0930\u093f\u092a\u094b\u0930\u094d\u091f \u0938\u094d\u0925\u093e\u0928\u0940\u092f \u0930\u0942\u092a \u0938\u0947 \u0938\u0939\u0947\u091c\u0940 \u0917\u0908\u0964',
    scan_qr: 'QR \u0915\u094b\u0921 \u0938\u094d\u0915\u0948\u0928 \u0915\u0930\u0947\u0902',
    qr_hint: '\u0915\u0948\u092e\u0930\u093e \u0938\u094d\u0925\u093e\u0928 QR \u0915\u094b\u0921 \u0915\u0940 \u0913\u0930 \u0915\u0930\u0947\u0902',
    qr_no_camera: '\u0915\u0948\u092e\u0930\u093e \u0909\u092a\u0932\u092c\u094d\u0927 \u0928\u0939\u0940\u0902 \u0939\u0948',
    qr_found: 'QR \u0915\u094b\u0921 \u0938\u0947 \u0938\u094d\u0925\u093e\u0928 \u0938\u0947\u091f \u0915\u093f\u092f\u093e \u0917\u092f\u093e!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  sk: {
    status_online: 'Online', status_offline: 'Offline — spr\u00e1vy ulo\u017een\u00e9 lok\u00e1lne',
    status_syncing: 'Synchronizuje sa...', pending_reports: '\u010dakaj\u00face spr\u00e1vy',
    install_instructions: 'Na in\u0161tal\u00e1ciu: klepnite na Zdie\u013ea\u0165 a potom Prida\u0165 na plochu',
    dismiss: 'Zavrie\u0165', location: 'Poloha', building: 'Budova', level: 'Poschodie',
    select_building: 'Vyberte budovu...', select_level: 'Vyberte poschodie...',
    change_location: 'Change', your_details: 'Va\u0161e \u00fadaje',
    observer_name: 'Meno', main_contractor: 'Hlavn\u00fd dod\u00e1vate\u013e',
    select_contractor: 'Vyberte...',
    observation: 'Pozorovanie',
    category: 'Kateg\u00f3ria',
    select_category: 'Vyberte kateg\u00f3riu...',
    description: 'Popis', photo: 'Fotografia',
    take_photo: 'Odfoti\u0165', from_gallery: 'Gal\u00e9ria',
    submit: 'Odosla\u0165 pozorovanie', new_report: 'Nov\u00e1 spr\u00e1va',
    settings: 'Nastavenia', saved_identity: 'Ulo\u017een\u00e1 identita',
    save_settings: 'Ulo\u017ei\u0165 nastavenia', force_sync: 'Synchronizova\u0165 teraz',
    clear_queue: 'Vymaza\u0165 \u010dakaj\u00faci rad',
    success_title: 'Odoslan\u00e9!', success_msg: 'Va\u0161e pozorovanie bolo \u00faspe\u0161ne odoslan\u00e9.',
    queued_title: 'Ulo\u017een\u00e9!', queued_msg: 'Ste offline. Pozorovanie je ulo\u017een\u00e9 a bude odoslan\u00e9 automaticky.',
    error_title: 'Chyba', error_msg: 'Nepodarilo sa odosla\u0165. Pozorovanie je ulo\u017een\u00e9 a sk\u00fasi sa znova.',
    validation_error: 'Pros\u00edm vypl\u0148te v\u0161etky povinn\u00e9 polia.',
    confirm_clear: 'Vymaza\u0165 v\u0161etky \u010dakaj\u00face spr\u00e1vy? Toto sa ned\u00e1 vr\u00e1ti\u0165.',
    synced_count: 'spr\u00e1v synchronizovan\u00fdch',
    no_endpoint: '\u017diadny endpoint nakonfigurovan\u00fd. Spr\u00e1va ulo\u017een\u00e1 lok\u00e1lne.',
    scan_qr: 'Skenova\u0165 QR k\u00f3d',
    qr_hint: 'Namierte kameru na QR k\u00f3d lokacie',
    qr_no_camera: 'Kamera nie je dostupn\u00e1',
    qr_found: 'Poloha nastaven\u00e1 z QR k\u00f3du!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  tr: {
    status_online: '\u00c7evrimi\u00e7i', status_offline: '\u00c7evrimd\u0131\u015f\u0131 — raporlar yerel olarak kaydedildi',
    status_syncing: 'Senkronize ediliyor...', pending_reports: 'bekleyen raporlar',
    install_instructions: 'Y\u00fcklemek i\u00e7in: Payla\u015f, ard\u0131ndan Ana Ekrana Ekle',
    dismiss: 'Kapat', location: 'Konum', building: 'Bina', level: 'Kat',
    select_building: 'Bina se\u00e7in...', select_level: 'Kat se\u00e7in...',
    change_location: 'Change', your_details: 'Bilgileriniz',
    observer_name: '\u0130sim', main_contractor: 'Ana y\u00fcklenici',
    select_contractor: 'Se\u00e7in...',
    observation: 'G\u00f6zlem',
    category: 'Kategori',
    select_category: 'Kategori se\u00e7in...',
    description: 'A\u00e7\u0131klama', photo: 'Foto\u011fraf',
    take_photo: 'Foto\u011fraf \u00e7ek', from_gallery: 'Galeri',
    submit: 'G\u00f6zlemi g\u00f6nder', new_report: 'Yeni rapor',
    settings: 'Ayarlar', saved_identity: 'Kay\u0131tl\u0131 kimlik',
    save_settings: 'Ayarlar\u0131 kaydet', force_sync: '\u015eimdi senkronize et',
    clear_queue: 'Bekleyen kuyru\u011fu temizle',
    success_title: 'G\u00f6nderildi!', success_msg: 'G\u00f6zleminiz ba\u015far\u0131yla g\u00f6nderildi.',
    queued_title: 'Kaydedildi!', queued_msg: '\u00c7evrimd\u0131\u015f\u0131s\u0131n\u0131z. G\u00f6zleminiz kaydedildi ve otomatik olarak g\u00f6nderilecektir.',
    error_title: 'Hata', error_msg: 'G\u00f6nderilemedi. G\u00f6zleminiz kaydedildi ve tekrar deneyecektir.',
    validation_error: 'L\u00fctfen t\u00fcm zorunlu alanlar\u0131 doldurun.',
    confirm_clear: 'T\u00fcm bekleyen raporlar silinsin mi? Bu i\u015flem geri al\u0131namaz.',
    synced_count: 'rapor senkronize edildi',
    no_endpoint: 'Endpoint yap\u0131land\u0131r\u0131lmam\u0131\u015f. Rapor yerel olarak kaydedildi.',
    scan_qr: 'QR kodu tara',
    qr_hint: 'Kameray\u0131 konum QR koduna do\u011frultun',
    qr_no_camera: 'Kamera eri\u015fimi mevcut de\u011fil',
    qr_found: 'QR koddan konum ayarland\u0131!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  uk: {
    status_online: '\u041e\u043d\u043b\u0430\u0439\u043d', status_offline: '\u041e\u0444\u043b\u0430\u0439\u043d — \u0437\u0432\u0456\u0442\u0438 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0456 \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e',
    status_syncing: '\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0456\u0437\u0430\u0446\u0456\u044f...', pending_reports: '\u043e\u0447\u0456\u043a\u0443\u044e\u0447\u0456 \u0437\u0432\u0456\u0442\u0438',
    install_instructions: '\u0429\u043e\u0431 \u0432\u0441\u0442\u0430\u043d\u043e\u0432\u0438\u0442\u0438: \u041f\u043e\u0434\u0456\u043b\u0438\u0442\u0438\u0441\u044f, \u043f\u043e\u0442\u0456\u043c \u0414\u043e\u0434\u0430\u0442\u0438 \u043d\u0430 \u0435\u043a\u0440\u0430\u043d',
    dismiss: '\u0417\u0430\u043a\u0440\u0438\u0442\u0438', location: '\u041c\u0456\u0441\u0446\u0435', building: '\u0411\u0443\u0434\u0456\u0432\u043b\u044f', level: '\u0420\u0456\u0432\u0435\u043d\u044c',
    select_building: '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0431\u0443\u0434\u0456\u0432\u043b\u044e...', select_level: '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u0440\u0456\u0432\u0435\u043d\u044c...',
    change_location: 'Change', your_details: '\u0412\u0430\u0448\u0456 \u0434\u0430\u043d\u0456',
    observer_name: "\u0406\u043c'\u044f", main_contractor: '\u0413\u043e\u043b\u043e\u0432\u043d\u0438\u0439 \u043f\u0456\u0434\u0440\u044f\u0434\u043d\u0438\u043a',
    select_contractor: '\u041e\u0431\u0435\u0440\u0456\u0442\u044c...',
    observation: '\u0421\u043f\u043e\u0441\u0442\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f',
    category: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u044f',
    select_category: '\u041e\u0431\u0435\u0440\u0456\u0442\u044c \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0456\u044e...',
    description: '\u041e\u043f\u0438\u0441', photo: '\u0424\u043e\u0442\u043e',
    take_photo: '\u0417\u0440\u043e\u0431\u0438\u0442\u0438 \u0444\u043e\u0442\u043e', from_gallery: '\u0413\u0430\u043b\u0435\u0440\u0435\u044f',
    submit: '\u041d\u0430\u0434\u0456\u0441\u043b\u0430\u0442\u0438 \u0441\u043f\u043e\u0441\u0442\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f', new_report: '\u041d\u043e\u0432\u0438\u0439 \u0437\u0432\u0456\u0442',
    settings: '\u041d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f', saved_identity: '\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u0430 \u043e\u0441\u043e\u0431\u0430',
    save_settings: '\u0417\u0431\u0435\u0440\u0435\u0433\u0442\u0438 \u043d\u0430\u043b\u0430\u0448\u0442\u0443\u0432\u0430\u043d\u043d\u044f', force_sync: '\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0456\u0437\u0443\u0432\u0430\u0442\u0438 \u0437\u0430\u0440\u0430\u0437',
    clear_queue: '\u041e\u0447\u0438\u0441\u0442\u0438\u0442\u0438 \u0447\u0435\u0440\u0433\u0443',
    success_title: '\u041d\u0430\u0434\u0456\u0441\u043b\u0430\u043d\u043e!', success_msg: '\u0412\u0430\u0448\u0435 \u0441\u043f\u043e\u0441\u0442\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0443\u0441\u043f\u0456\u0448\u043d\u043e \u043d\u0430\u0434\u0456\u0441\u043b\u0430\u043d\u043e.',
    queued_title: '\u0417\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e!', queued_msg: "\u0412\u0438 \u043e\u0444\u043b\u0430\u0439\u043d. \u0421\u043f\u043e\u0441\u0442\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e \u0456 \u0431\u0443\u0434\u0435 \u043d\u0430\u0434\u0456\u0441\u043b\u0430\u043d\u043e \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u043d\u043e, \u043a\u043e\u043b\u0438 \u0432\u0438 \u043f\u0456\u0434'\u0454\u0434\u043d\u0430\u0454\u0442\u0435\u0441\u044c.",
    error_title: '\u041f\u043e\u043c\u0438\u043b\u043a\u0430', error_msg: '\u041d\u0435 \u0432\u0434\u0430\u043b\u043e\u0441\u044f \u043d\u0430\u0434\u0456\u0441\u043b\u0430\u0442\u0438. \u0421\u043f\u043e\u0441\u0442\u0435\u0440\u0435\u0436\u0435\u043d\u043d\u044f \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e \u0456 \u0431\u0443\u0434\u0435 \u043f\u043e\u0432\u0442\u043e\u0440\u043d\u0430 \u0441\u043f\u0440\u043e\u0431\u0430.',
    validation_error: "\u0411\u0443\u0434\u044c \u043b\u0430\u0441\u043a\u0430, \u0437\u0430\u043f\u043e\u0432\u043d\u0456\u0442\u044c \u0432\u0441\u0456 \u043e\u0431\u043e\u0432'\u044f\u0437\u043a\u043e\u0432\u0456 \u043f\u043e\u043b\u044f.",
    confirm_clear: '\u0412\u0438\u0434\u0430\u043b\u0438\u0442\u0438 \u0432\u0441\u0456 \u043e\u0447\u0456\u043a\u0443\u044e\u0447\u0456 \u0437\u0432\u0456\u0442\u0438? \u0426\u0435 \u043d\u0435 \u043c\u043e\u0436\u043d\u0430 \u0441\u043a\u0430\u0441\u0443\u0432\u0430\u0442\u0438.',
    synced_count: '\u0437\u0432\u0456\u0442\u0456\u0432 \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0456\u0437\u043e\u0432\u0430\u043d\u043e',
    no_endpoint: '\u0415\u043d\u0434\u043f\u043e\u0456\u043d\u0442 \u043d\u0435 \u043d\u0430\u043b\u0430\u0448\u0442\u043e\u0432\u0430\u043d\u0438\u0439. \u0417\u0432\u0456\u0442 \u0437\u0431\u0435\u0440\u0435\u0436\u0435\u043d\u043e \u043b\u043e\u043a\u0430\u043b\u044c\u043d\u043e.',
    scan_qr: '\u0421\u043a\u0430\u043d\u0443\u0432\u0430\u0442\u0438 QR-\u043a\u043e\u0434',
    qr_hint: '\u041d\u0430\u0432\u0435\u0434\u0456\u0442\u044c \u043a\u0430\u043c\u0435\u0440\u0443 \u043d\u0430 QR-\u043a\u043e\u0434 \u043c\u0456\u0441\u0446\u044f',
    qr_no_camera: '\u041a\u0430\u043c\u0435\u0440\u0430 \u043d\u0435\u0434\u043e\u0441\u0442\u0443\u043f\u043d\u0430',
    qr_found: '\u041c\u0456\u0441\u0446\u0435 \u0432\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043e \u0437 QR-\u043a\u043e\u0434\u0443!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  bg: {
    status_online: '\u041e\u043d\u043b\u0430\u0439\u043d', status_offline: '\u041e\u0444\u043b\u0430\u0439\u043d — \u0434\u043e\u043a\u043b\u0430\u0434\u0438\u0442\u0435 \u0441\u0430 \u0437\u0430\u043f\u0430\u0437\u0435\u043d\u0438 \u043b\u043e\u043a\u0430\u043b\u043d\u043e',
    status_syncing: '\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u0430\u043d\u0435...', pending_reports: '\u0447\u0430\u043a\u0430\u0449\u0438 \u0434\u043e\u043a\u043b\u0430\u0434\u0438',
    install_instructions: '\u0417\u0430 \u0438\u043d\u0441\u0442\u0430\u043b\u0438\u0440\u0430\u043d\u0435: \u0421\u043f\u043e\u0434\u0435\u043b\u044f\u043d\u0435, \u0441\u043b\u0435\u0434 \u0442\u043e\u0432\u0430 \u0414\u043e\u0431\u0430\u0432\u0438 \u043a\u044a\u043c \u0435\u043a\u0440\u0430\u043d\u0430',
    dismiss: '\u0417\u0430\u0442\u0432\u043e\u0440\u0438', location: '\u041c\u0435\u0441\u0442\u043e\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435', building: '\u0421\u0433\u0440\u0430\u0434\u0430', level: '\u0415\u0442\u0430\u0436',
    select_building: '\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0441\u0433\u0440\u0430\u0434\u0430...', select_level: '\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u0435\u0442\u0430\u0436...',
    change_location: 'Change', your_details: '\u0412\u0430\u0448\u0438\u0442\u0435 \u0434\u0430\u043d\u043d\u0438',
    observer_name: '\u0418\u043c\u0435', main_contractor: '\u0413\u043b\u0430\u0432\u0435\u043d \u0438\u0437\u043f\u044a\u043b\u043d\u0438\u0442\u0435\u043b',
    select_contractor: '\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435...',
    observation: '\u041d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435',
    category: '\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f',
    select_category: '\u0418\u0437\u0431\u0435\u0440\u0435\u0442\u0435 \u043a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u044f...',
    description: '\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435', photo: '\u0421\u043d\u0438\u043c\u043a\u0430',
    take_photo: '\u041d\u0430\u043f\u0440\u0430\u0432\u0438 \u0441\u043d\u0438\u043c\u043a\u0430', from_gallery: '\u0413\u0430\u043b\u0435\u0440\u0438\u044f',
    submit: '\u0418\u0437\u043f\u0440\u0430\u0442\u0438 \u043d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435', new_report: '\u041d\u043e\u0432 \u0434\u043e\u043a\u043b\u0430\u0434',
    settings: '\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438', saved_identity: '\u0417\u0430\u043f\u0430\u0437\u0435\u043d\u0430 \u0441\u0430\u043c\u043e\u043b\u0438\u0447\u043d\u043e\u0441\u0442',
    save_settings: '\u0417\u0430\u043f\u0430\u0437\u0438 \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438', force_sync: '\u0421\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u0430\u0439 \u0441\u0435\u0433\u0430',
    clear_queue: '\u0418\u0437\u0447\u0438\u0441\u0442\u0438 \u043e\u043f\u0430\u0448\u043a\u0430\u0442\u0430',
    success_title: '\u0418\u0437\u043f\u0440\u0430\u0442\u0435\u043d\u043e!', success_msg: '\u0412\u0430\u0448\u0435\u0442\u043e \u043d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435 \u0435 \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d\u043e \u0443\u0441\u043f\u0435\u0448\u043d\u043e.',
    queued_title: '\u0417\u0430\u043f\u0430\u0437\u0435\u043d\u043e!', queued_msg: '\u0412\u0438\u0435 \u0441\u0442\u0435 \u043e\u0444\u043b\u0430\u0439\u043d. \u041d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435\u0442\u043e \u0435 \u0437\u0430\u043f\u0430\u0437\u0435\u043d\u043e \u0438 \u0449\u0435 \u0431\u044a\u0434\u0435 \u0438\u0437\u043f\u0440\u0430\u0442\u0435\u043d\u043e \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u043d\u043e.',
    error_title: '\u0413\u0440\u0435\u0448\u043a\u0430', error_msg: '\u041d\u0435 \u043c\u043e\u0436\u0430 \u0434\u0430 \u0441\u0435 \u0438\u0437\u043f\u0440\u0430\u0442\u0438. \u041d\u0430\u0431\u043b\u044e\u0434\u0435\u043d\u0438\u0435\u0442\u043e \u0435 \u0437\u0430\u043f\u0430\u0437\u0435\u043d\u043e \u0438 \u0449\u0435 \u043e\u043f\u0438\u0442\u0430 \u043e\u0442\u043d\u043e\u0432\u043e.',
    validation_error: '\u041c\u043e\u043b\u044f, \u043f\u043e\u043f\u044a\u043b\u043d\u0435\u0442\u0435 \u0432\u0441\u0438\u0447\u043a\u0438 \u0437\u0430\u0434\u044a\u043b\u0436\u0438\u0442\u0435\u043b\u043d\u0438 \u043f\u043e\u043b\u0435\u0442\u0430.',
    confirm_clear: '\u0418\u0437\u0442\u0440\u0438\u0432\u0430\u043d\u0435 \u043d\u0430 \u0432\u0441\u0438\u0447\u043a\u0438 \u0447\u0430\u043a\u0430\u0449\u0438 \u0434\u043e\u043a\u043b\u0430\u0434\u0438? \u041d\u0435 \u043c\u043e\u0436\u0435 \u0434\u0430 \u0441\u0435 \u043e\u0442\u043c\u0435\u043d\u0438.',
    synced_count: '\u0434\u043e\u043a\u043b\u0430\u0434\u0438 \u0441\u0438\u043d\u0445\u0440\u043e\u043d\u0438\u0437\u0438\u0440\u0430\u043d\u0438',
    no_endpoint: '\u041d\u0435 \u0435 \u043a\u043e\u043d\u0444\u0438\u0433\u0443\u0440\u0438\u0440\u0430\u043d \u0435\u043d\u0434\u043f\u043e\u0439\u043d\u0442. \u0414\u043e\u043a\u043b\u0430\u0434\u044a\u0442 \u0435 \u0437\u0430\u043f\u0430\u0437\u0435\u043d \u043b\u043e\u043a\u0430\u043b\u043d\u043e.',
    scan_qr: '\u0421\u043a\u0430\u043d\u0438\u0440\u0430\u0439 QR \u043a\u043e\u0434',
    qr_hint: '\u041d\u0430\u0441\u043e\u0447\u0435\u0442\u0435 \u043a\u0430\u043c\u0435\u0440\u0430\u0442\u0430 \u043a\u044a\u043c QR \u043a\u043e\u0434',
    qr_no_camera: '\u041a\u0430\u043c\u0435\u0440\u0430\u0442\u0430 \u043d\u0435 \u0435 \u0434\u043e\u0441\u0442\u044a\u043f\u043d\u0430',
    qr_found: '\u041c\u0435\u0441\u0442\u043e\u043f\u043e\u043b\u043e\u0436\u0435\u043d\u0438\u0435 \u0437\u0430\u0434\u0430\u0434\u0435\u043d\u043e \u043e\u0442 QR \u043a\u043e\u0434!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  lv: {
    status_online: 'Tie\u0161saist\u0113', status_offline: 'Bezsaist\u0113 — zi\u0146ojumi saglab\u0101ti lok\u0101li',
    status_syncing: 'Sinhroniz\u0113...', pending_reports: 'gaido\u0161ie zi\u0146ojumi',
    install_instructions: 'Lai instal\u0113tu: nospiediet Dal\u012bties, tad Pievienot ekr\u0101nam',
    dismiss: 'Noraid\u012bt', location: 'Atra\u0161an\u0101s vieta', building: '\u0112ka', level: 'St\u0101vs',
    select_building: 'Izv\u0113lieties \u0113ku...', select_level: 'Izv\u0113lieties st\u0101vu...',
    change_location: 'Change', your_details: 'J\u016bsu dati',
    observer_name: 'V\u0101rds', main_contractor: 'Galvenais uz\u0146\u0113m\u0113js',
    select_contractor: 'Izv\u0113lieties...',
    observation: 'Nov\u0113rojums',
    category: 'Kategorija',
    select_category: 'Izv\u0113lieties kategoriju...',
    description: 'Apraksts', photo: 'Foto',
    take_photo: 'Uz\u0146emt foto', from_gallery: 'Galerija',
    submit: 'Iesniegt nov\u0113rojumu', new_report: 'Jauns zi\u0146ojums',
    settings: 'Iestat\u012bjumi', saved_identity: 'Saglab\u0101t\u0101 identit\u0101te',
    save_settings: 'Saglab\u0101t iestat\u012bjumus', force_sync: 'Sinhroniz\u0113t tagad',
    clear_queue: 'Not\u012br\u012bt rindu',
    success_title: 'Nos\u016bt\u012bts!', success_msg: 'J\u016bsu nov\u0113rojums ir iesniegts.',
    queued_title: 'Saglab\u0101ts!', queued_msg: 'J\u016bs esat bezsaist\u0113. Nov\u0113rojums saglab\u0101ts un tiks nos\u016bt\u012bts autom\u0101tiski.',
    error_title: 'K\u013c\u016bda', error_msg: 'Neizdev\u0101s nos\u016bt\u012bt. Nov\u0113rojums saglab\u0101ts un m\u0113\u0123in\u0101s v\u0113lreiz.',
    validation_error: 'L\u016bdzu aizpildiet visus oblig\u0101tos laukus.',
    confirm_clear: 'Dz\u0113st visus gaido\u0161os zi\u0146ojumus? To nevar atsaukt.',
    synced_count: 'zi\u0146ojumi sinhroniz\u0113ti',
    no_endpoint: 'Nav konfigur\u0113ts galapunkts. Zi\u0146ojums saglab\u0101ts lok\u0101li.',
    scan_qr: 'Sken\u0113t QR kodu',
    qr_hint: 'Pav\u0113rsiet kameru uz QR kodu',
    qr_no_camera: 'Kamera nav pieejama',
    qr_found: 'Vieta iestat\u012bta no QR koda!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
  },
  ga: {
    status_online: 'Ar l\u00edne', status_offline: 'As l\u00edne — tuairisc\u00ed s\u00e1bh\u00e1ilte go h\u00e1iti\u00fail',
    status_syncing: 'Ag sioncr\u00f3n\u00fa...', pending_reports: 'tuairisc\u00ed ar feitheamh',
    install_instructions: 'Le suit\u00e9\u00e1il: br\u00faigh Comhroinn ansin Cuir le Sc\u00e1ile\u00e1n Baile',
    dismiss: 'D\u00fan', location: 'Su\u00edomh', building: 'Foirgneamh', level: 'Leibh\u00e9al',
    select_building: 'Roghnaigh foirgneamh...', select_level: 'Roghnaigh leibh\u00e9al...',
    change_location: 'Change', your_details: 'Do shonra\u00ed',
    observer_name: 'Ainm', main_contractor: 'Pr\u00edomhchonraitheoir',
    select_contractor: 'Roghnaigh...',
    observation: 'Breathn\u00fa',
    category: 'Catag\u00f3ir',
    select_category: 'Roghnaigh catag\u00f3ir...',
    description: 'Cur s\u00edos', photo: 'Grianghraf',
    take_photo: 'T\u00f3g grianghraf', from_gallery: 'Gailear\u00e1\u00ed',
    submit: 'Seol breathn\u00fa', new_report: 'Tuairisc nua',
    settings: 'Socruithe', saved_identity: 'Aitheantas s\u00e1bh\u00e1ilte',
    save_settings: 'S\u00e1bh\u00e1il socruithe', force_sync: 'Sioncr\u00f3n\u00fa anois',
    clear_queue: 'Glan an scuaine',
    success_title: 'Seolta!', success_msg: 'Seoladh do bhreathn\u00fa go rath\u00fail.',
    queued_title: 'S\u00e1bh\u00e1ilte!', queued_msg: 'T\u00e1 t\u00fa as l\u00edne. T\u00e1 do bhreathn\u00fa s\u00e1bh\u00e1ilte agus seolfar go huathobr\u00edoch \u00e9.',
    error_title: 'Earr\u00e1id', error_msg: 'N\u00edorbh fh\u00e9idir seoladh. T\u00e1 do bhreathn\u00fa s\u00e1bh\u00e1ilte agus d\u00e9anfar iarracht ar\u00eds.',
    validation_error: 'L\u00edon isteach gach r\u00e9imse riachtanach le do thoil.',
    confirm_clear: 'Scrios gach tuairisc ar feitheamh? N\u00ed f\u00e9idir \u00e9 seo a chur ar ceal.',
    synced_count: 'tuairisc\u00ed sioncr\u00f3naithe',
    no_endpoint: 'N\u00edl aon endpoint cumraithe. Tuairisc s\u00e1bh\u00e1ilte go h\u00e1iti\u00fail.',
    scan_qr: 'Scan c\u00f3d QR',
    qr_hint: 'D\u00edrigh an ceamara ar ch\u00f3d QR su\u00edmh',
    qr_no_camera: 'N\u00edl rochtain ceamara ar f\u00e1il',
    qr_found: 'Su\u00edomh socraithe \u00f3n gc\u00f3d QR!',
    enter_manually: 'Enter manually',
    history: 'History',
    history_empty: 'No observations sent yet.',
    not_set: 'Not set',
    setup_title: 'Welcome to NNE Safety Observer',
    setup_subtitle: 'Before you start, please tell us who you are',
    setup_contractor_label: 'Which main contractor are you working for?',
    setup_other_contractor: 'Your contractor name',
    setup_name_label: 'Your name',
    setup_name_hint: 'Optional — useful if your company rewards safety observations',
    setup_done: 'Get Started',
    contractor_not_listed: 'My contractor is not listed',
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
let photosData = []; // Array of base64 strings for multiple photos
let db = null;

// ===== IndexedDB ==============================================
const DB_NAME = 'm3-safety-observer';
const DB_VERSION = 3; // v2: settings store, v3: history store
const STORE_NAME = 'observations';
const SETTINGS_STORE = 'settings';
const HISTORY_STORE = 'history';
const MAX_HISTORY = 50;
const HISTORY_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

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
      if (!db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id' });
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

// ===== COOKIE HELPERS (persistent fallback) ==================
// Cookies survive scenarios where IndexedDB/localStorage get evicted
// (e.g., iOS phone restarts, Safari storage pressure).
function setCookie(name, value, days) {
  const d = new Date();
  d.setTime(d.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value || '')};expires=${d.toUTCString()};path=/;SameSite=Strict`;
}

function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function saveIdentity(name, contractor, contractorOther) {
  // Save to cookies as persistent backup
  setCookie('savedName', name, 365);
  setCookie('savedContractor', contractor, 365);
  if (contractorOther !== undefined) setCookie('savedContractorOther', contractorOther, 365);
  const promises = [
    saveSetting('savedName', name),
    saveSetting('savedContractor', contractor),
  ];
  if (contractorOther !== undefined) promises.push(saveSetting('savedContractorOther', contractorOther));
  return Promise.all(promises);
}

async function loadIdentity() {
  const name = await getSetting('savedName');
  const contractor = await getSetting('savedContractor');
  const contractorOther = await getSetting('savedContractorOther');
  return { name, contractor, contractorOther };
}

// ===== HISTORY (sent observations log) =========================
function addToHistory(observation) {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(HISTORY_STORE, 'readwrite');
      const entry = {
        id: observation.id,
        datetime_created: observation.datetime_created || observation.timestamp,
        building: observation.building,
        level: observation.level,
        safetyCategory: observation.safetyCategory || '',
        description: observation.description,
        mainContractor: observation.mainContractor || '',
      };
      tx.objectStore(HISTORY_STORE).put(entry);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve(); // Never block sync on history failure
    } catch (e) {
      resolve();
    }
  });
}

function getAllHistory() {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(HISTORY_STORE, 'readonly');
      const request = tx.objectStore(HISTORY_STORE).getAll();
      request.onsuccess = () => {
        const all = request.result || [];
        all.sort((a, b) => (b.datetime_created || '').localeCompare(a.datetime_created || ''));
        resolve(all.slice(0, MAX_HISTORY));
      };
      request.onerror = () => resolve([]);
    } catch (e) {
      resolve([]);
    }
  });
}

function pruneOldHistory() {
  try {
    const tx = db.transaction(HISTORY_STORE, 'readwrite');
    const store = tx.objectStore(HISTORY_STORE);
    const request = store.getAll();
    request.onsuccess = () => {
      const cutoff = Date.now() - HISTORY_MAX_AGE_MS;
      (request.result || []).forEach(entry => {
        const created = new Date(entry.datetime_created).getTime();
        if (created < cutoff) store.delete(entry.id);
      });
    };
  } catch (e) {}
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

// Mark an observation as 'sending' so no other process picks it up.
// Returns true if successfully claimed, false if already claimed or gone.
function claimObservation(id) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const obs = getReq.result;
      if (!obs || obs.status !== 'pending') {
        resolve(false); // Already claimed or deleted
        return;
      }
      obs.status = 'sending';
      store.put(obs);
      tx.oncomplete = () => resolve(true);
    };
    getReq.onerror = () => resolve(false);
    tx.onerror = () => resolve(false);
  });
}

// Reset a 'sending' observation back to 'pending' (e.g., on network failure).
function unclaimObservation(id) {
  return new Promise((resolve) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const obs = getReq.result;
      if (obs && obs.status === 'sending') {
        obs.status = 'pending';
        store.put(obs);
      }
      tx.oncomplete = () => resolve();
    };
    getReq.onerror = () => resolve();
    tx.onerror = () => resolve();
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
let lastSyncResult = ''; // For debug display in settings

// Core POST function: uses no-cors to avoid CORS-then-fallback double-send.
// no-cors gives an opaque response (can't read status), but the data IS sent.
async function postObservation(url, payload) {
  await fetch(url, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
  });
  // If we get here without throwing, the network request was sent
  return { ok: true };
}

async function syncPending() {
  if (isSyncing) return;
  if (!navigator.onLine) return;

  const url = CONFIG.ENDPOINT_URL;
  if (!url) {
    lastSyncResult = 'No endpoint URL configured';
    return;
  }

  isSyncing = true;

  try {
    setStatus('syncing');
  } catch (e) {
    // DOM not ready — continue sync anyway
  }

  try {
    const pending = await getAllPending();

    if (pending.length === 0) {
      lastSyncResult = 'No pending observations';
      return; // finally block still runs
    }

    let syncedCount = 0;
    let lastError = '';

    for (const obs of pending) {
      // Claim this observation so no other process (SW, timer) sends it
      const claimed = await claimObservation(obs.id);
      if (!claimed) continue; // Already being sent by another process

      try {
        const payload = { ...obs };
        delete payload.status; // Don't send internal status field
        payload.datetime_sent = new Date().toISOString();

        const result = await postObservation(url, payload);
        await addToHistory(obs); // Save text-only copy to history before deleting
        await deleteObservation(obs.id);
        syncedCount++;
      } catch (err) {
        // Network error — unclaim so it can be retried
        await unclaimObservation(obs.id);
        lastError = err.message || 'Network error';
        requestBackgroundSync();
        break;
      }
    }

    if (syncedCount > 0) {
      lastSyncResult = syncedCount + ' observation(s) synced';
      // Clear the persistent "pending" notification now that items are synced
      const remaining = await getAllPending();
      if (remaining.length === 0) {
        clearPendingNotification();
      } else {
        // Update notification with remaining count
        showPendingNotification(remaining.length);
      }
    } else if (lastError) {
      lastSyncResult = 'Sync failed: ' + lastError;
    }
  } catch (err) {
    lastSyncResult = 'Sync error: ' + (err.message || err);
  } finally {
    isSyncing = false;
    try {
      updateStatus();
      updatePendingBadge();
    } catch (e) {}
  }
}

// Force sync with user-visible alert showing results
async function forceSyncWithFeedback() {
  if (!navigator.onLine) {
    alert('You are offline. Sync will happen when you are back online.');
    return;
  }

  const pending = await getAllPending();
  if (pending.length === 0) {
    alert('No pending observations to sync.');
    return;
  }

  alert('Syncing ' + pending.length + ' observation(s)...\nEndpoint: ' + (CONFIG.ENDPOINT_URL || 'NOT SET'));

  // Reset sync lock in case it's stuck
  isSyncing = false;
  await syncPending();

  const remaining = await getAllPending();
  if (remaining.length === 0) {
    alert('Sync complete! All observations sent.\n\nCheck webhook.site to verify.');
  } else {
    alert('Sync result: ' + lastSyncResult + '\n\n' + remaining.length + ' observation(s) still pending.');
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
  setCookie('appLang', lang, 365);
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
  // Add "My contractor is not listed" as last option
  const otherOpt = document.createElement('option');
  otherOpt.value = '__other__';
  otherOpt.textContent = t('contractor_not_listed');
  sel.appendChild(otherOpt);
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

// ===== QR / URL PARAMS ========================================
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const building = params.get('building');
  const level = params.get('level');

  if (building) {
    currentBuilding = building.toUpperCase();
    document.getElementById('buildingValue').textContent = currentBuilding;
    document.getElementById('buildingSelect').value = currentBuilding;
    populateLevelSelect(currentBuilding);
  }
  if (level) {
    currentLevel = level.toUpperCase();
    document.getElementById('levelValue').textContent = currentLevel;
    document.getElementById('levelSelect').value = currentLevel;
  }

  if (building || level) {
    showLocationSet();
  }
  // else: leave QR prompt visible (default state)
}

function showLocationSet() {
  document.getElementById('locationQrPrompt').classList.add('hidden');
  document.getElementById('locationSet').classList.remove('hidden');
  document.getElementById('locationManual').classList.add('hidden');
}

function showLocationManual() {
  document.getElementById('locationQrPrompt').classList.add('hidden');
  document.getElementById('locationSet').classList.add('hidden');
  document.getElementById('locationManual').classList.remove('hidden');
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
    document.getElementById('buildingSelect').value = currentBuilding;
    populateLevelSelect(currentBuilding);
  }
  if (level) {
    currentLevel = level.toUpperCase();
    document.getElementById('levelValue').textContent = currentLevel;
    document.getElementById('levelSelect').value = currentLevel;
  }

  if (building || level) {
    showLocationSet();
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

      const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
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
  const description = document.getElementById('description').value.trim();

  if (!building || !level || !description) {
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

  // Get contractor from saved settings (set during first-time setup)
  const savedContractor = await getSetting('savedContractor') || '';
  const savedContractorOther = await getSetting('savedContractorOther') || '';
  const savedObserverName = await getSetting('savedName') || '';

  let mainContractorValue = savedContractor;
  if (savedContractor === '__other__' && savedContractorOther) {
    mainContractorValue = 'Operator didnt know main contractor. his direct subcontractor is: ' + savedContractorOther;
  }

  const observation = {
    id: uuid(),
    datetime_created: new Date().toISOString(),
    project: CONFIG.PROJECT,
    building: building,
    level: level,
    mainContractor: mainContractorValue,
    observerName: savedObserverName,
    safetyCategory: document.getElementById('safetyCategory').value || '',
    description: document.getElementById('description').value.trim(),
    photo: photosData.length > 0 ? photosData[0] : '',
    photos: photosData.length > 0 ? photosData : [],
    submittedLanguage: currentLang,
    status: 'pending', // Internal — not sent to endpoint
  };

  try {
    await addObservation(observation);
  } catch (err) {
    console.error('Failed to save observation:', err);
    showModal('error');
    return;
  }

  // ALL sending goes through syncPending() to avoid duplicates.
  // Never send directly from here — the sync engine has locking.
  if (navigator.onLine && CONFIG.ENDPOINT_URL) {
    // Online: trigger sync immediately, show success/queued based on result
    showModal('queued'); // Shown briefly while sync runs
    syncPending().then(async () => {
      const remaining = await getAllPending();
      const wasSent = !remaining.find(o => o.id === observation.id);
      if (wasSent) {
        hideModal();
        showModal('success');
      }
    }).catch(() => {});
  } else {
    showModal(CONFIG.ENDPOINT_URL ? 'queued' : 'no_endpoint');
    // Request background sync so Android can send when back online (even if app closed)
    requestBackgroundSync();

    // Show persistent notification — keeps Chrome alive so background sync fires
    if ('Notification' in window && Notification.permission === 'granted') {
      getAllPending().then(pending => showPendingNotification(pending.length)).catch(() => {});
    }
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
  photosData = [];
  document.getElementById('safetyCategory').value = '';
  document.getElementById('description').value = '';
  document.getElementById('photoGrid').innerHTML = '';
  document.getElementById('cameraInput').value = '';
  document.getElementById('galleryInput').value = '';
}

// ===== SETTINGS ===============================================
async function openSettings() {
  document.getElementById('settingsEndpoint').value = CONFIG.ENDPOINT_URL || '';

  // Load identity for read-only display
  try {
    const identity = await loadIdentity();
    const contractorDisplay = document.getElementById('settingsContractorDisplay');
    if (identity.contractor === '__other__') {
      contractorDisplay.textContent = identity.contractorOther || '--';
    } else {
      contractorDisplay.textContent = identity.contractor || '--';
    }
    document.getElementById('settingsNameDisplay').textContent = identity.name || t('not_set');
  } catch (e) {
    document.getElementById('settingsContractorDisplay').textContent = '--';
    document.getElementById('settingsNameDisplay').textContent = t('not_set');
  }

  // Reset to read-only state
  document.getElementById('settingsReadOnly').classList.remove('hidden');
  document.getElementById('settingsEditable').classList.add('hidden');
  document.getElementById('settingsSave').classList.add('hidden');

  document.getElementById('settingsScreen').classList.add('visible');
}

function closeSettings() {
  document.getElementById('settingsScreen').classList.remove('visible');
}

async function enableSettingsEdit() {
  document.getElementById('settingsReadOnly').classList.add('hidden');
  document.getElementById('settingsEditable').classList.remove('hidden');
  document.getElementById('settingsSave').classList.remove('hidden');

  // Populate contractor dropdown
  populateContractorSelect('settingsContractor');

  // Load current values into editable fields
  try {
    const identity = await loadIdentity();
    document.getElementById('settingsName').value = identity.name || '';
    document.getElementById('settingsContractor').value = identity.contractor || '';
    if (identity.contractor === '__other__') {
      document.getElementById('settingsOtherGroup').classList.remove('hidden');
      document.getElementById('settingsContractorOther').value = identity.contractorOther || '';
    } else {
      document.getElementById('settingsOtherGroup').classList.add('hidden');
    }
  } catch (e) {}
}

function saveSettings() {
  const name = document.getElementById('settingsName').value.trim();
  const contractor = document.getElementById('settingsContractor').value;
  const contractorOther = document.getElementById('settingsContractorOther').value.trim();
  const endpoint = document.getElementById('settingsEndpoint').value.trim();

  // Save identity to IndexedDB + cookies
  saveIdentity(name, contractor, contractorOther);

  if (endpoint) {
    localStorage.setItem('powerAutomateUrl', endpoint);
    CONFIG.ENDPOINT_URL = endpoint;
    saveSetting('powerAutomateUrl', endpoint).catch(() => {});
    sendEndpointToSW();
  }

  closeSettings();
}

// ===== HISTORY ================================================
async function openHistory() {
  const list = document.getElementById('historyList');
  const entries = await getAllHistory();

  if (entries.length === 0) {
    list.innerHTML = '<p class="history-empty">' + t('history_empty') + '</p>';
  } else {
    list.innerHTML = entries.map(e => {
      const date = new Date(e.datetime_created).toLocaleString();
      return '<div class="history-item">' +
        '<div class="history-date">' + date + '</div>' +
        '<div class="history-location">' + (e.building || '--') + ' / ' + (e.level || '--') + '</div>' +
        (e.safetyCategory ? '<div class="history-category">' + e.safetyCategory + '</div>' : '') +
        '<div class="history-desc">' + e.description + '</div>' +
      '</div>';
    }).join('');
  }

  document.getElementById('historyScreen').classList.add('visible');
}

function closeHistory() {
  document.getElementById('historyScreen').classList.remove('visible');
}

// ===== FIRST-TIME SETUP =======================================
function showSetupOverlay() {
  // Populate contractor dropdown
  const sel = document.getElementById('setupContractor');
  while (sel.options.length > 1) sel.remove(1);
  CONFIG.MAIN_CONTRACTORS.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
  const otherOpt = document.createElement('option');
  otherOpt.value = '__other__';
  otherOpt.textContent = t('contractor_not_listed');
  sel.appendChild(otherOpt);

  // Show/hide "other" text input on change
  sel.addEventListener('change', () => {
    const otherGroup = document.getElementById('setupOtherGroup');
    if (sel.value === '__other__') {
      otherGroup.classList.remove('hidden');
    } else {
      otherGroup.classList.add('hidden');
    }
  });

  document.getElementById('setupOverlay').classList.add('visible');
}

async function completeSetup() {
  const contractor = document.getElementById('setupContractor').value;
  const contractorOther = document.getElementById('setupContractorOther').value.trim();
  const name = document.getElementById('setupName').value.trim();

  if (!contractor) {
    alert(t('validation_error'));
    return;
  }
  if (contractor === '__other__' && !contractorOther) {
    alert(t('validation_error'));
    return;
  }

  // Save to IndexedDB + cookies
  await saveIdentity(name, contractor, contractorOther);
  await saveSetting('setupComplete', true);
  setCookie('setupComplete', 'true', 365);

  document.getElementById('setupOverlay').classList.remove('visible');
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

// ===== NOTIFICATIONS (keep-alive for background sync) =========
// On Android, a visible notification keeps Chrome's SW process alive,
// which means Background Sync actually fires when connectivity returns.

async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

// Tell the SW to show a persistent "pending observations" notification.
// This is the key trick: the notification keeps Chrome alive in background.
async function showPendingNotification(count) {
  if (!('serviceWorker' in navigator)) return;
  if (Notification.permission !== 'granted') return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active.postMessage({
      type: 'SHOW_PENDING_NOTIFICATION',
      count: count,
    });
  } catch (e) {}
}

// Tell the SW to clear the pending notification after successful sync.
async function clearPendingNotification() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    reg.active.postMessage({ type: 'CLEAR_PENDING_NOTIFICATION' });
  } catch (e) {}
}

// ===== PERIODIC BACKGROUND SYNC ===============================
// Wakes the SW periodically (even when app is closed) to check for
// pending items. Minimum interval is browser-controlled (~12h).
async function registerPeriodicSync() {
  if (!('serviceWorker' in navigator)) return;
  try {
    const reg = await navigator.serviceWorker.ready;
    if ('periodicSync' in reg) {
      const status = await navigator.permissions.query({ name: 'periodic-background-sync' });
      if (status.state === 'granted') {
        await reg.periodicSync.register('periodic-sync-observations', {
          minInterval: 60 * 60 * 1000, // request every 1 hour (browser may enforce higher)
        });
      }
    }
  } catch (e) {}
}

// Send the current endpoint URL to the service worker so it can
// perform background sync without access to localStorage.
function sendEndpointToSW() {
  if (!('serviceWorker' in navigator)) return;
  const msg = { type: 'SET_ENDPOINT', url: CONFIG.ENDPOINT_URL };

  // Try controller first (fastest path)
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(msg);
    return;
  }

  // Fallback: get active SW from registration (works after skipWaiting)
  navigator.serviceWorker.ready.then(reg => {
    if (reg.active) reg.active.postMessage(msg);
  }).catch(() => {});
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

  // Request persistent storage so browser won't evict our data
  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  // Restore endpoint URL from IndexedDB (more persistent than localStorage)
  try {
    const savedEndpoint = await getSetting('powerAutomateUrl');
    if (savedEndpoint) CONFIG.ENDPOINT_URL = savedEndpoint;
  } catch (e) {}

  // Always persist the endpoint URL to IndexedDB so the SW can read it
  // during background sync (SW can't access localStorage or CONFIG)
  if (CONFIG.ENDPOINT_URL) {
    saveSetting('powerAutomateUrl', CONFIG.ENDPOINT_URL).catch(() => {});
  }

  // Parse QR URL params
  parseUrlParams();

  // Restore language: IndexedDB → localStorage → cookie
  try {
    const savedLang = await getSetting('appLang');
    if (savedLang) currentLang = savedLang;
  } catch (e) {}
  if (currentLang === 'en') {
    const cookieLang = getCookie('appLang');
    if (cookieLang && TRANSLATIONS[cookieLang]) currentLang = cookieLang;
  }
  setLanguage(currentLang);

  // Populate dropdowns
  populateBuildingSelect();
  populateCategorySelect();

  // Prune old history entries
  pruneOldHistory();

  // Status
  updateStatus();
  updatePendingBadge();

  // Install banner
  checkInstallBanner();

  // Request notification permission early — needed for background sync keep-alive.
  // On Android PWA, this shows a one-time prompt.
  requestNotificationPermission();

  // Load jsQR fallback if needed
  loadJsQrFallback();

  // Try sync on load
  syncPending();

  // ===== EVENT LISTENERS =====================================

  // Online/offline — multiple triggers for reliability on mobile
  window.addEventListener('online', () => {
    updateStatus();
    // Staggered retries: network often not truly ready when event fires
    syncPending();
    setTimeout(() => syncPending(), 1500);
    setTimeout(() => syncPending(), 5000);
  });
  window.addEventListener('offline', () => updateStatus());

  // Network change event (more reliable on mobile than online/offline)
  if ('connection' in navigator) {
    navigator.connection.addEventListener('change', () => {
      updateStatus();
      if (navigator.onLine) {
        setTimeout(() => syncPending(), 1000);
      }
    });
  }

  // Sync on visibility change (user switches back to app)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateStatus();
      if (navigator.onLine) {
        syncPending();
      } else {
        // Still offline — re-show notification to keep Chrome alive
        getAllPending().then(pending => {
          if (pending.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
            showPendingNotification(pending.length);
          }
        }).catch(() => {});
      }
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

  // Location: QR-first — manual entry links
  document.getElementById('manualLocationLink').addEventListener('click', (e) => {
    e.preventDefault();
    showLocationManual();
  });
  document.getElementById('changeLocationLink').addEventListener('click', (e) => {
    e.preventDefault();
    currentBuilding = '';
    currentLevel = '';
    document.getElementById('buildingValue').textContent = '--';
    document.getElementById('levelValue').textContent = '--';
    document.getElementById('buildingSelect').value = '';
    document.getElementById('levelSelect').innerHTML = '<option value="" data-i18n="select_level">' + t('select_level') + '</option>';
    document.getElementById('locationQrPrompt').classList.remove('hidden');
    document.getElementById('locationSet').classList.add('hidden');
    document.getElementById('locationManual').classList.add('hidden');
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
    if (currentBuilding && currentLevel) showLocationSet();
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
  document.getElementById('settingsEditBtn').addEventListener('click', enableSettingsEdit);
  document.getElementById('settingsSave').addEventListener('click', saveSettings);

  // Settings contractor "other" toggle
  document.getElementById('settingsContractor').addEventListener('change', (e) => {
    const otherGroup = document.getElementById('settingsOtherGroup');
    if (e.target.value === '__other__') {
      otherGroup.classList.remove('hidden');
    } else {
      otherGroup.classList.add('hidden');
    }
  });

  // History
  document.getElementById('historyBtn').addEventListener('click', openHistory);
  document.getElementById('historyBack').addEventListener('click', closeHistory);

  // First-time setup
  document.getElementById('setupDoneBtn').addEventListener('click', completeSetup);

  document.getElementById('settingsForceSync').addEventListener('click', () => {
    forceSyncWithFeedback();
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

  // Register service worker + force update check on every load
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      // Force check for updated SW on every app open
      reg.update().catch(() => {});

      // When a new SW is waiting, make it activate immediately
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              newWorker.postMessage({ type: 'SKIP_WAITING' });
            }
            if (newWorker.state === 'activated') {
              // New SW is active — reload to get fresh cached assets
              window.location.reload();
            }
          });
        }
      });

      // Once active, send endpoint URL so background sync can use it
      navigator.serviceWorker.ready.then(() => {
        sendEndpointToSW();
        // Register periodic background sync (wakes SW even when app is closed)
        registerPeriodicSync();
      });
    }).catch(err => {
      console.error('SW registration failed:', err);
    });

    // Reload when a new SW takes control (ensures fresh assets)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });

    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', event => {
      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        updatePendingBadge();
        updateStatus();
        // Clear notification if no more pending items
        getAllPending().then(pending => {
          if (pending.length === 0) clearPendingNotification();
        }).catch(() => {});
      }
    });
  }

  // Check for SW updates when app resumes (Android can restore from background)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => reg.update().catch(() => {}));
    }
  });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && 'serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(reg => reg.update().catch(() => {}));
    }
  });

  // If there are already pending items and we have notification permission,
  // ensure the persistent notification is shown (keeps Chrome alive)
  try {
    const pending = await getAllPending();
    if (pending.length > 0 && 'Notification' in window && Notification.permission === 'granted') {
      showPendingNotification(pending.length);
    }
  } catch (e) {}

  // First-time setup check — show overlay if user hasn't completed setup
  // Shown AFTER sync engine is initialized so background sync still works underneath
  let setupDone = await getSetting('setupComplete');
  if (!setupDone) {
    // Check cookie fallback
    setupDone = getCookie('setupComplete') === 'true';
  }
  if (!setupDone) {
    showSetupOverlay();
  }
}

// Boot
document.addEventListener('DOMContentLoaded', init);
