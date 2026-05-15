// Dashboard-specific translations for all 6 supported languages.
// Reads 'jobbly_lang' from localStorage (set by Settings section).

export type DashLang = 'de' | 'en' | 'tr' | 'es' | 'fr' | 'pl'

export interface DashT {
  // Navigation / common
  back: string; next: string; save: string; saving: string
  cancel: string; edit: string; delete_: string; duplicate: string
  rename: string; copy: string; dashboard: string

  // CV Builder
  cvTitle: string; newCV: string; overview: string
  designStep: string; formStep: string; previewStep: string

  // Form fields
  firstName: string; lastName: string; email: string; phone: string
  city: string; linkedinUrl: string; position: string; photoUrl: string
  profileSummary: string; profilePlaceholder: string
  experience: string; education: string; skills: string
  languages: string; cvName: string; charCount: string

  // Experience block
  jobTitle: string; company: string; period: string; description: string
  addExperience: string; removeEntry: string

  // Education block
  degree: string; institution: string; addEducation: string

  // Skills
  skillsPlaceholder: string

  // Languages
  language: string; level: string; addLanguage: string
  levelNative: string; levelFluent: string; levelAdvanced: string
  levelIntermediate: string; levelBasic: string

  // Language options (display names in the UI language)
  langGerman: string; langEnglish: string; langFrench: string
  langSpanish: string; langItalian: string; langPortuguese: string
  langPolish: string; langTurkish: string; langArabic: string
  langChinese: string; langRussian: string; langJapanese: string

  // Actions
  generateAI: string; generating: string; preview: string
  exportPDF: string; exportWord: string; apply: string

  // Validation errors
  errorFirstName: string; errorPosition: string; errorExperience: string

  // Toasts
  toastSaved: string; toastDeleted: string; toastDuplicated: string
  toastPdfError: string; toastWordError: string
  toastGenerateError: string; toastFreeLimit: string; toastProOnly: string
  toastApplySuccess: string; toastApplyError: string

  // Empty states
  cvEmptyTitle: string; cvEmptyDesc: string; cvCreateFirst: string
  letterEmptyTitle: string; letterEmptyDesc: string

  // Design picker
  freeDesignNote: string; proDesignNote: string

  // Typography
  font: string; fontSize: string; lineSpacing: string
  sizeSmall: string; sizeMedium: string; sizeLarge: string
  spacingCompact: string; spacingNormal: string; spacingRelaxed: string

  // CV section headings (rendered inside CV designs)
  sectionProfile: string; sectionExperience: string; sectionEducation: string
  sectionSkills: string; sectionLanguages: string; sectionContact: string
  sectionPlaceholder: string

  // Cover letter
  letterTitle: string; newLetter: string
  letterJob: string; letterJobPlaceholder: string
  letterCompany: string; letterCompanyPlaceholder: string
  letterGenerate: string; letterGenerating: string
  letterDesignPick: string; letterSave: string
  letterApply: string; letterPDF: string; letterWord: string
  letterGreeting: string; letterClosing: string
  letterSubjectPrefix: string; letterDesignNote: string
  letterEditHint: string
}

const DE: DashT = {
  back: '← Zurück', next: 'Weiter →', save: '💾 Speichern',
  saving: 'Speichern...', cancel: 'Abbrechen', edit: 'Bearbeiten',
  delete_: 'Löschen', duplicate: 'Kopieren', rename: 'Umbenennen',
  copy: 'Kopie', dashboard: '← Dashboard',

  cvTitle: 'Lebenslauf', newCV: '+ Neuer Lebenslauf', overview: '← Übersicht',
  designStep: 'Design wählen', formStep: 'Deine Daten', previewStep: 'Vorschau & Export',

  firstName: 'Vorname *', lastName: 'Nachname', email: 'E-Mail', phone: 'Telefon',
  city: 'Ort', linkedinUrl: 'LinkedIn URL', position: 'Stelle / Berufsbezeichnung *',
  photoUrl: 'Foto URL', profileSummary: 'Profil / Zusammenfassung',
  profilePlaceholder: 'Beschreibe dich in 2–3 Sätzen...',
  experience: 'Berufserfahrung', education: 'Ausbildung',
  skills: 'Kenntnisse / Skills', languages: 'Sprachen',
  cvName: 'Lebenslauf-Name', charCount: 'Zeichen',

  jobTitle: 'Jobtitel', company: 'Unternehmen', period: 'Zeitraum (z.B. 2021–2024)',
  description: 'Beschreibung / Aufgaben',
  addExperience: '+ Erfahrung hinzufügen', removeEntry: 'Entfernen',

  degree: 'Abschluss', institution: 'Institution / Hochschule',
  addEducation: '+ Ausbildung hinzufügen',

  skillsPlaceholder: 'Skill eingeben und Enter drücken...',

  language: 'Sprache', level: 'Niveau', addLanguage: '+ Sprache hinzufügen',
  levelNative: 'Muttersprache', levelFluent: 'Fließend', levelAdvanced: 'Fortgeschritten',
  levelIntermediate: 'Mittelstufe', levelBasic: 'Grundkenntnisse',

  langGerman: 'Deutsch', langEnglish: 'Englisch', langFrench: 'Französisch',
  langSpanish: 'Spanisch', langItalian: 'Italienisch', langPortuguese: 'Portugiesisch',
  langPolish: 'Polnisch', langTurkish: 'Türkisch', langArabic: 'Arabisch',
  langChinese: 'Chinesisch', langRussian: 'Russisch', langJapanese: 'Japanisch',

  generateAI: '✨ KI generiert Inhalt', generating: '⏳ Generiere...',
  preview: 'Vorschau →', exportPDF: '📄 PDF herunterladen',
  exportWord: '📝 Word herunterladen', apply: '🚀 Jetzt bewerben!',

  errorFirstName: 'Vorname ist erforderlich.',
  errorPosition: 'Stelle / Berufsbezeichnung ist erforderlich.',
  errorExperience: 'Bitte mindestens eine Berufserfahrung oder Ausbildung eingeben.',

  toastSaved: 'Gespeichert ✓', toastDeleted: 'Gelöscht',
  toastDuplicated: 'Dupliziert ✓', toastPdfError: 'PDF-Export fehlgeschlagen.',
  toastWordError: 'Word-Export fehlgeschlagen.',
  toastGenerateError: 'Generierung fehlgeschlagen — bitte erneut versuchen.',
  toastFreeLimit: 'Free-Plan: max. 1 Lebenslauf. Upgrade zu Pro!',
  toastProOnly: 'Nur für Pro-Nutzer — jetzt upgraden!',
  toastApplySuccess: 'Bewerbung erfolgreich gesendet! ✓',
  toastApplyError: 'Fehler beim Senden — bitte erneut versuchen.',

  cvEmptyTitle: 'Erstelle deinen ersten professionellen Lebenslauf',
  cvEmptyDesc: 'KI generiert professionelle Inhalte — du brauchst nur 2 Minuten.',
  cvCreateFirst: '✨ Jetzt erstellen',
  letterEmptyTitle: 'Erstelle jetzt dein KI-Anschreiben in Sekunden',
  letterEmptyDesc: 'Wähle eine Stelle aus und lass die KI ein professionelles Anschreiben für dich erstellen.',

  freeDesignNote: 'Free: Nordic Minimal kostenlos · Upgrade für alle 6 Designs',
  proDesignNote: 'Alle 6 Designs verfügbar',

  font: 'Schriftart', fontSize: 'Größe', lineSpacing: 'Zeilenabstand',
  sizeSmall: 'Klein', sizeMedium: 'Mittel', sizeLarge: 'Groß',
  spacingCompact: 'Kompakt', spacingNormal: 'Normal', spacingRelaxed: 'Luftig',

  sectionProfile: 'Profil', sectionExperience: 'Berufserfahrung',
  sectionEducation: 'Ausbildung', sectionSkills: 'Kenntnisse',
  sectionLanguages: 'Sprachen', sectionContact: 'Kontakt',
  sectionPlaceholder: '—',

  letterTitle: 'Anschreiben', newLetter: '+ Neues Anschreiben',
  letterJob: 'Stelle *', letterJobPlaceholder: 'z.B. Software Engineer',
  letterCompany: 'Unternehmen *', letterCompanyPlaceholder: 'z.B. Google GmbH',
  letterGenerate: '✨ KI generiert Anschreiben', letterGenerating: '⏳ KI schreibt dein Anschreiben...',
  letterDesignPick: 'Design wählen', letterSave: '💾 Speichern',
  letterApply: '🚀 Jetzt bewerben!', letterPDF: '📄 PDF', letterWord: '📝 Word',
  letterGreeting: 'Sehr geehrte Damen und Herren,',
  letterClosing: 'Mit freundlichen Grüßen,',
  letterSubjectPrefix: 'Bewerbung als',
  letterDesignNote: 'Design passend zu deinem Lebenslauf',
  letterEditHint: 'Text direkt bearbeitbar — klicke zum Bearbeiten',
}

const EN: DashT = {
  back: '← Back', next: 'Next →', save: '💾 Save', saving: 'Saving...',
  cancel: 'Cancel', edit: 'Edit', delete_: 'Delete', duplicate: 'Duplicate',
  rename: 'Rename', copy: 'Copy', dashboard: '← Dashboard',

  cvTitle: 'CV / Resume', newCV: '+ New CV', overview: '← Overview',
  designStep: 'Choose design', formStep: 'Your details', previewStep: 'Preview & Export',

  firstName: 'First name *', lastName: 'Last name', email: 'Email', phone: 'Phone',
  city: 'City', linkedinUrl: 'LinkedIn URL', position: 'Position / Job title *',
  photoUrl: 'Photo URL', profileSummary: 'Profile / Summary',
  profilePlaceholder: 'Describe yourself in 2–3 sentences...',
  experience: 'Work experience', education: 'Education',
  skills: 'Skills', languages: 'Languages',
  cvName: 'CV name', charCount: 'characters',

  jobTitle: 'Job title', company: 'Company', period: 'Period (e.g. 2021–2024)',
  description: 'Description / responsibilities',
  addExperience: '+ Add experience', removeEntry: 'Remove',

  degree: 'Degree', institution: 'Institution / University',
  addEducation: '+ Add education',

  skillsPlaceholder: 'Type a skill and press Enter...',

  language: 'Language', level: 'Level', addLanguage: '+ Add language',
  levelNative: 'Native', levelFluent: 'Fluent', levelAdvanced: 'Advanced',
  levelIntermediate: 'Intermediate', levelBasic: 'Basic',

  langGerman: 'German', langEnglish: 'English', langFrench: 'French',
  langSpanish: 'Spanish', langItalian: 'Italian', langPortuguese: 'Portuguese',
  langPolish: 'Polish', langTurkish: 'Turkish', langArabic: 'Arabic',
  langChinese: 'Chinese', langRussian: 'Russian', langJapanese: 'Japanese',

  generateAI: '✨ Generate with AI', generating: '⏳ Generating...',
  preview: 'Preview →', exportPDF: '📄 Download PDF',
  exportWord: '📝 Download Word', apply: '🚀 Apply now!',

  errorFirstName: 'First name is required.',
  errorPosition: 'Position / Job title is required.',
  errorExperience: 'Please add at least one work experience or education entry.',

  toastSaved: 'Saved ✓', toastDeleted: 'Deleted', toastDuplicated: 'Duplicated ✓',
  toastPdfError: 'PDF export failed.', toastWordError: 'Word export failed.',
  toastGenerateError: 'Generation failed — please try again.',
  toastFreeLimit: 'Free plan: max. 1 CV. Upgrade to Pro!',
  toastProOnly: 'Pro only — upgrade now!',
  toastApplySuccess: 'Application sent successfully! ✓',
  toastApplyError: 'Error sending application — please try again.',

  cvEmptyTitle: 'Create your first professional CV',
  cvEmptyDesc: 'AI generates professional content — you only need 2 minutes.',
  cvCreateFirst: '✨ Create now',
  letterEmptyTitle: 'Create your AI cover letter in seconds',
  letterEmptyDesc: 'Choose a position and let AI write a professional cover letter for you.',

  freeDesignNote: 'Free: Nordic Minimal · Upgrade for all 6 designs',
  proDesignNote: 'All 6 designs available',

  font: 'Font', fontSize: 'Size', lineSpacing: 'Line spacing',
  sizeSmall: 'Small', sizeMedium: 'Medium', sizeLarge: 'Large',
  spacingCompact: 'Compact', spacingNormal: 'Normal', spacingRelaxed: 'Relaxed',

  sectionProfile: 'Profile', sectionExperience: 'Work Experience',
  sectionEducation: 'Education', sectionSkills: 'Skills',
  sectionLanguages: 'Languages', sectionContact: 'Contact',
  sectionPlaceholder: '—',

  letterTitle: 'Cover Letter', newLetter: '+ New Cover Letter',
  letterJob: 'Position *', letterJobPlaceholder: 'e.g. Software Engineer',
  letterCompany: 'Company *', letterCompanyPlaceholder: 'e.g. Google LLC',
  letterGenerate: '✨ Generate with AI', letterGenerating: '⏳ AI is writing your cover letter...',
  letterDesignPick: 'Choose design', letterSave: '💾 Save',
  letterApply: '🚀 Apply now!', letterPDF: '📄 PDF', letterWord: '📝 Word',
  letterGreeting: 'Dear Hiring Manager,',
  letterClosing: 'Sincerely,',
  letterSubjectPrefix: 'Application for',
  letterDesignNote: 'Design matching your CV',
  letterEditHint: 'Text is editable — click to edit',
}

const TR: DashT = {
  back: '← Geri', next: 'İleri →', save: '💾 Kaydet', saving: 'Kaydediliyor...',
  cancel: 'İptal', edit: 'Düzenle', delete_: 'Sil', duplicate: 'Kopyala',
  rename: 'Yeniden adlandır', copy: 'Kopya', dashboard: '← Gösterge Paneli',

  cvTitle: 'Özgeçmiş', newCV: '+ Yeni Özgeçmiş', overview: '← Genel Bakış',
  designStep: 'Tasarım seç', formStep: 'Bilgileriniz', previewStep: 'Önizleme ve Dışa Aktarma',

  firstName: 'Ad *', lastName: 'Soyad', email: 'E-posta', phone: 'Telefon',
  city: 'Şehir', linkedinUrl: 'LinkedIn URL', position: 'Pozisyon / İş unvanı *',
  photoUrl: 'Fotoğraf URL', profileSummary: 'Profil / Özet',
  profilePlaceholder: 'Kendinizi 2–3 cümlede tanıtın...',
  experience: 'İş deneyimi', education: 'Eğitim', skills: 'Beceriler',
  languages: 'Diller', cvName: 'Özgeçmiş adı', charCount: 'karakter',

  jobTitle: 'İş unvanı', company: 'Şirket', period: 'Dönem (örn. 2021–2024)',
  description: 'Açıklama / Görevler',
  addExperience: '+ Deneyim ekle', removeEntry: 'Kaldır',

  degree: 'Derece', institution: 'Kurum / Üniversite',
  addEducation: '+ Eğitim ekle',

  skillsPlaceholder: 'Beceri yazın ve Enter\'a basın...',

  language: 'Dil', level: 'Seviye', addLanguage: '+ Dil ekle',
  levelNative: 'Anadil', levelFluent: 'Akıcı', levelAdvanced: 'İleri',
  levelIntermediate: 'Orta', levelBasic: 'Temel',

  langGerman: 'Almanca', langEnglish: 'İngilizce', langFrench: 'Fransızca',
  langSpanish: 'İspanyolca', langItalian: 'İtalyanca', langPortuguese: 'Portekizce',
  langPolish: 'Lehçe', langTurkish: 'Türkçe', langArabic: 'Arapça',
  langChinese: 'Çince', langRussian: 'Rusça', langJapanese: 'Japonca',

  generateAI: '✨ YZ ile oluştur', generating: '⏳ Oluşturuluyor...',
  preview: 'Önizleme →', exportPDF: '📄 PDF indir',
  exportWord: '📝 Word indir', apply: '🚀 Hemen başvur!',

  errorFirstName: 'Ad zorunludur.', errorPosition: 'Pozisyon zorunludur.',
  errorExperience: 'En az bir deneyim veya eğitim ekleyin.',

  toastSaved: 'Kaydedildi ✓', toastDeleted: 'Silindi', toastDuplicated: 'Kopyalandı ✓',
  toastPdfError: 'PDF dışa aktarma başarısız.', toastWordError: 'Word dışa aktarma başarısız.',
  toastGenerateError: 'Oluşturma başarısız — lütfen tekrar deneyin.',
  toastFreeLimit: 'Ücretsiz plan: maks. 1 özgeçmiş. Pro\'ya yükseltin!',
  toastProOnly: 'Yalnızca Pro — hemen yükseltin!',
  toastApplySuccess: 'Başvuru başarıyla gönderildi! ✓',
  toastApplyError: 'Gönderme hatası — lütfen tekrar deneyin.',

  cvEmptyTitle: 'İlk profesyonel özgeçmişinizi oluşturun',
  cvEmptyDesc: 'YZ profesyonel içerik oluşturur — sadece 2 dakikanız yeter.',
  cvCreateFirst: '✨ Şimdi oluştur',
  letterEmptyTitle: 'Saniyeler içinde YZ ön yazınızı oluşturun',
  letterEmptyDesc: 'Bir pozisyon seçin ve YZ sizin için profesyonel bir ön yazı yazsın.',

  freeDesignNote: 'Ücretsiz: Nordic Minimal · Tüm tasarımlar için yükseltin',
  proDesignNote: 'Tüm 6 tasarım mevcut',

  font: 'Yazı tipi', fontSize: 'Boyut', lineSpacing: 'Satır aralığı',
  sizeSmall: 'Küçük', sizeMedium: 'Orta', sizeLarge: 'Büyük',
  spacingCompact: 'Sıkı', spacingNormal: 'Normal', spacingRelaxed: 'Geniş',

  sectionProfile: 'Profil', sectionExperience: 'İş Deneyimi',
  sectionEducation: 'Eğitim', sectionSkills: 'Beceriler',
  sectionLanguages: 'Diller', sectionContact: 'İletişim',
  sectionPlaceholder: '—',

  letterTitle: 'Ön Yazı', newLetter: '+ Yeni Ön Yazı',
  letterJob: 'Pozisyon *', letterJobPlaceholder: 'örn. Yazılım Mühendisi',
  letterCompany: 'Şirket *', letterCompanyPlaceholder: 'örn. Google LLC',
  letterGenerate: '✨ YZ ile oluştur', letterGenerating: '⏳ YZ ön yazı yazıyor...',
  letterDesignPick: 'Tasarım seç', letterSave: '💾 Kaydet',
  letterApply: '🚀 Hemen başvur!', letterPDF: '📄 PDF', letterWord: '📝 Word',
  letterGreeting: 'Sayın Yetkili,',
  letterClosing: 'Saygılarımla,',
  letterSubjectPrefix: 'Başvuru:',
  letterDesignNote: 'Özgeçmişinizle uyumlu tasarım',
  letterEditHint: 'Metin düzenlenebilir — düzenlemek için tıklayın',
}

const ES: DashT = {
  back: '← Atrás', next: 'Siguiente →', save: '💾 Guardar', saving: 'Guardando...',
  cancel: 'Cancelar', edit: 'Editar', delete_: 'Eliminar', duplicate: 'Duplicar',
  rename: 'Renombrar', copy: 'Copia', dashboard: '← Inicio',

  cvTitle: 'Currículum', newCV: '+ Nuevo CV', overview: '← Vista general',
  designStep: 'Elegir diseño', formStep: 'Tus datos', previewStep: 'Vista previa y exportar',

  firstName: 'Nombre *', lastName: 'Apellido', email: 'Correo', phone: 'Teléfono',
  city: 'Ciudad', linkedinUrl: 'URL de LinkedIn', position: 'Puesto / Título *',
  photoUrl: 'URL de foto', profileSummary: 'Perfil / Resumen',
  profilePlaceholder: 'Descríbete en 2–3 frases...',
  experience: 'Experiencia laboral', education: 'Educación',
  skills: 'Habilidades', languages: 'Idiomas',
  cvName: 'Nombre del CV', charCount: 'caracteres',

  jobTitle: 'Cargo', company: 'Empresa', period: 'Período (p.ej. 2021–2024)',
  description: 'Descripción / responsabilidades',
  addExperience: '+ Añadir experiencia', removeEntry: 'Quitar',

  degree: 'Titulación', institution: 'Institución / Universidad',
  addEducation: '+ Añadir educación',

  skillsPlaceholder: 'Escribe una habilidad y pulsa Enter...',

  language: 'Idioma', level: 'Nivel', addLanguage: '+ Añadir idioma',
  levelNative: 'Nativo', levelFluent: 'Fluido', levelAdvanced: 'Avanzado',
  levelIntermediate: 'Intermedio', levelBasic: 'Básico',

  langGerman: 'Alemán', langEnglish: 'Inglés', langFrench: 'Francés',
  langSpanish: 'Español', langItalian: 'Italiano', langPortuguese: 'Portugués',
  langPolish: 'Polaco', langTurkish: 'Turco', langArabic: 'Árabe',
  langChinese: 'Chino', langRussian: 'Ruso', langJapanese: 'Japonés',

  generateAI: '✨ Generar con IA', generating: '⏳ Generando...',
  preview: 'Vista previa →', exportPDF: '📄 Descargar PDF',
  exportWord: '📝 Descargar Word', apply: '🚀 ¡Postular ahora!',

  errorFirstName: 'El nombre es obligatorio.', errorPosition: 'El puesto es obligatorio.',
  errorExperience: 'Añade al menos una experiencia o entrada de educación.',

  toastSaved: 'Guardado ✓', toastDeleted: 'Eliminado', toastDuplicated: 'Duplicado ✓',
  toastPdfError: 'Error al exportar PDF.', toastWordError: 'Error al exportar Word.',
  toastGenerateError: 'Error al generar — vuelve a intentarlo.',
  toastFreeLimit: 'Plan gratuito: máx. 1 CV. ¡Actualiza a Pro!',
  toastProOnly: 'Solo Pro — ¡actualiza ahora!',
  toastApplySuccess: '¡Solicitud enviada con éxito! ✓',
  toastApplyError: 'Error al enviar — vuelve a intentarlo.',

  cvEmptyTitle: 'Crea tu primer CV profesional',
  cvEmptyDesc: 'La IA genera contenido profesional — solo necesitas 2 minutos.',
  cvCreateFirst: '✨ Crear ahora',
  letterEmptyTitle: 'Crea tu carta de presentación con IA en segundos',
  letterEmptyDesc: 'Elige un puesto y deja que la IA escriba una carta profesional por ti.',

  freeDesignNote: 'Gratis: Nordic Minimal · Actualiza para todos los diseños',
  proDesignNote: 'Los 6 diseños disponibles',

  font: 'Fuente', fontSize: 'Tamaño', lineSpacing: 'Interlineado',
  sizeSmall: 'Pequeño', sizeMedium: 'Mediano', sizeLarge: 'Grande',
  spacingCompact: 'Compacto', spacingNormal: 'Normal', spacingRelaxed: 'Amplio',

  sectionProfile: 'Perfil', sectionExperience: 'Experiencia Laboral',
  sectionEducation: 'Educación', sectionSkills: 'Habilidades',
  sectionLanguages: 'Idiomas', sectionContact: 'Contacto',
  sectionPlaceholder: '—',

  letterTitle: 'Carta de presentación', newLetter: '+ Nueva carta',
  letterJob: 'Puesto *', letterJobPlaceholder: 'p. ej. Ingeniero de software',
  letterCompany: 'Empresa *', letterCompanyPlaceholder: 'p. ej. Google LLC',
  letterGenerate: '✨ Generar con IA', letterGenerating: '⏳ La IA escribe tu carta...',
  letterDesignPick: 'Elegir diseño', letterSave: '💾 Guardar',
  letterApply: '🚀 ¡Postular!', letterPDF: '📄 PDF', letterWord: '📝 Word',
  letterGreeting: 'Estimado/a señor/a:',
  letterClosing: 'Atentamente,',
  letterSubjectPrefix: 'Solicitud:',
  letterDesignNote: 'Diseño que coincide con tu CV',
  letterEditHint: 'El texto es editable — haz clic para editar',
}

const FR: DashT = {
  back: '← Retour', next: 'Suivant →', save: '💾 Enregistrer', saving: 'Enregistrement...',
  cancel: 'Annuler', edit: 'Modifier', delete_: 'Supprimer', duplicate: 'Dupliquer',
  rename: 'Renommer', copy: 'Copie', dashboard: '← Tableau de bord',

  cvTitle: 'CV', newCV: '+ Nouveau CV', overview: '← Vue d\'ensemble',
  designStep: 'Choisir un design', formStep: 'Vos informations', previewStep: 'Aperçu et export',

  firstName: 'Prénom *', lastName: 'Nom', email: 'E-mail', phone: 'Téléphone',
  city: 'Ville', linkedinUrl: 'URL LinkedIn', position: 'Poste / Titre *',
  photoUrl: 'URL photo', profileSummary: 'Profil / Résumé',
  profilePlaceholder: 'Décrivez-vous en 2–3 phrases...',
  experience: 'Expérience professionnelle', education: 'Formation',
  skills: 'Compétences', languages: 'Langues',
  cvName: 'Nom du CV', charCount: 'caractères',

  jobTitle: 'Intitulé du poste', company: 'Entreprise', period: 'Période (ex. 2021–2024)',
  description: 'Description / Responsabilités',
  addExperience: '+ Ajouter une expérience', removeEntry: 'Supprimer',

  degree: 'Diplôme', institution: 'Établissement / Université',
  addEducation: '+ Ajouter une formation',

  skillsPlaceholder: 'Saisir une compétence et appuyer sur Entrée...',

  language: 'Langue', level: 'Niveau', addLanguage: '+ Ajouter une langue',
  levelNative: 'Langue maternelle', levelFluent: 'Courant', levelAdvanced: 'Avancé',
  levelIntermediate: 'Intermédiaire', levelBasic: 'Notions',

  langGerman: 'Allemand', langEnglish: 'Anglais', langFrench: 'Français',
  langSpanish: 'Espagnol', langItalian: 'Italien', langPortuguese: 'Portugais',
  langPolish: 'Polonais', langTurkish: 'Turc', langArabic: 'Arabe',
  langChinese: 'Chinois', langRussian: 'Russe', langJapanese: 'Japonais',

  generateAI: '✨ Générer avec IA', generating: '⏳ Génération en cours...',
  preview: 'Aperçu →', exportPDF: '📄 Télécharger PDF',
  exportWord: '📝 Télécharger Word', apply: '🚀 Postuler maintenant !',

  errorFirstName: 'Le prénom est obligatoire.', errorPosition: 'Le poste est obligatoire.',
  errorExperience: 'Veuillez ajouter au moins une expérience ou formation.',

  toastSaved: 'Enregistré ✓', toastDeleted: 'Supprimé', toastDuplicated: 'Dupliqué ✓',
  toastPdfError: 'Échec de l\'export PDF.', toastWordError: 'Échec de l\'export Word.',
  toastGenerateError: 'Échec de la génération — veuillez réessayer.',
  toastFreeLimit: 'Plan gratuit: 1 CV max. Passez à Pro !',
  toastProOnly: 'Pro uniquement — passez à Pro !',
  toastApplySuccess: 'Candidature envoyée avec succès ! ✓',
  toastApplyError: 'Erreur d\'envoi — veuillez réessayer.',

  cvEmptyTitle: 'Créez votre premier CV professionnel',
  cvEmptyDesc: 'L\'IA génère du contenu professionnel — il vous faut seulement 2 minutes.',
  cvCreateFirst: '✨ Créer maintenant',
  letterEmptyTitle: 'Créez votre lettre de motivation IA en quelques secondes',
  letterEmptyDesc: 'Choisissez un poste et laissez l\'IA rédiger une lettre professionnelle.',

  freeDesignNote: 'Gratuit: Nordic Minimal · Passez à Pro pour tous les designs',
  proDesignNote: 'Les 6 designs disponibles',

  font: 'Police', fontSize: 'Taille', lineSpacing: 'Interligne',
  sizeSmall: 'Petit', sizeMedium: 'Moyen', sizeLarge: 'Grand',
  spacingCompact: 'Compact', spacingNormal: 'Normal', spacingRelaxed: 'Aéré',

  sectionProfile: 'Profil', sectionExperience: 'Expérience Professionnelle',
  sectionEducation: 'Formation', sectionSkills: 'Compétences',
  sectionLanguages: 'Langues', sectionContact: 'Contact',
  sectionPlaceholder: '—',

  letterTitle: 'Lettre de motivation', newLetter: '+ Nouvelle lettre',
  letterJob: 'Poste *', letterJobPlaceholder: 'ex. Ingénieur logiciel',
  letterCompany: 'Entreprise *', letterCompanyPlaceholder: 'ex. Google France',
  letterGenerate: '✨ Générer avec IA', letterGenerating: '⏳ L\'IA rédige votre lettre...',
  letterDesignPick: 'Choisir un design', letterSave: '💾 Enregistrer',
  letterApply: '🚀 Postuler !', letterPDF: '📄 PDF', letterWord: '📝 Word',
  letterGreeting: 'Madame, Monsieur,',
  letterClosing: 'Cordialement,',
  letterSubjectPrefix: 'Candidature :',
  letterDesignNote: 'Design assorti à votre CV',
  letterEditHint: 'Le texte est modifiable — cliquez pour modifier',
}

const PL: DashT = {
  back: '← Wstecz', next: 'Dalej →', save: '💾 Zapisz', saving: 'Zapisywanie...',
  cancel: 'Anuluj', edit: 'Edytuj', delete_: 'Usuń', duplicate: 'Duplikuj',
  rename: 'Zmień nazwę', copy: 'Kopia', dashboard: '← Panel główny',

  cvTitle: 'CV', newCV: '+ Nowe CV', overview: '← Przegląd',
  designStep: 'Wybierz design', formStep: 'Twoje dane', previewStep: 'Podgląd i eksport',

  firstName: 'Imię *', lastName: 'Nazwisko', email: 'E-mail', phone: 'Telefon',
  city: 'Miasto', linkedinUrl: 'URL LinkedIn', position: 'Stanowisko *',
  photoUrl: 'URL zdjęcia', profileSummary: 'Profil / Podsumowanie',
  profilePlaceholder: 'Opisz siebie w 2–3 zdaniach...',
  experience: 'Doświadczenie zawodowe', education: 'Wykształcenie',
  skills: 'Umiejętności', languages: 'Języki',
  cvName: 'Nazwa CV', charCount: 'znaków',

  jobTitle: 'Stanowisko', company: 'Firma', period: 'Okres (np. 2021–2024)',
  description: 'Opis / Obowiązki',
  addExperience: '+ Dodaj doświadczenie', removeEntry: 'Usuń',

  degree: 'Stopień', institution: 'Uczelnia / Instytucja',
  addEducation: '+ Dodaj wykształcenie',

  skillsPlaceholder: 'Wpisz umiejętność i naciśnij Enter...',

  language: 'Język', level: 'Poziom', addLanguage: '+ Dodaj język',
  levelNative: 'Ojczysty', levelFluent: 'Biegły', levelAdvanced: 'Zaawansowany',
  levelIntermediate: 'Średniozaawansowany', levelBasic: 'Podstawowy',

  langGerman: 'Niemiecki', langEnglish: 'Angielski', langFrench: 'Francuski',
  langSpanish: 'Hiszpański', langItalian: 'Włoski', langPortuguese: 'Portugalski',
  langPolish: 'Polski', langTurkish: 'Turecki', langArabic: 'Arabski',
  langChinese: 'Chiński', langRussian: 'Rosyjski', langJapanese: 'Japoński',

  generateAI: '✨ Generuj z AI', generating: '⏳ Generowanie...',
  preview: 'Podgląd →', exportPDF: '📄 Pobierz PDF',
  exportWord: '📝 Pobierz Word', apply: '🚀 Aplikuj teraz!',

  errorFirstName: 'Imię jest wymagane.', errorPosition: 'Stanowisko jest wymagane.',
  errorExperience: 'Dodaj przynajmniej jedno doświadczenie lub wykształcenie.',

  toastSaved: 'Zapisano ✓', toastDeleted: 'Usunięto', toastDuplicated: 'Zduplikowano ✓',
  toastPdfError: 'Błąd eksportu PDF.', toastWordError: 'Błąd eksportu Word.',
  toastGenerateError: 'Generowanie nie powiodło się — spróbuj ponownie.',
  toastFreeLimit: 'Plan bezpłatny: maks. 1 CV. Przejdź na Pro!',
  toastProOnly: 'Tylko Pro — zaktualizuj teraz!',
  toastApplySuccess: 'Podanie wysłane pomyślnie! ✓',
  toastApplyError: 'Błąd wysyłania — spróbuj ponownie.',

  cvEmptyTitle: 'Utwórz swoje pierwsze profesjonalne CV',
  cvEmptyDesc: 'AI generuje profesjonalne treści — potrzebujesz tylko 2 minut.',
  cvCreateFirst: '✨ Utwórz teraz',
  letterEmptyTitle: 'Utwórz list motywacyjny AI w kilka sekund',
  letterEmptyDesc: 'Wybierz stanowisko, a AI napisze profesjonalny list za Ciebie.',

  freeDesignNote: 'Bezpłatny: Nordic Minimal · Przejdź na Pro dla wszystkich designów',
  proDesignNote: 'Wszystkie 6 designów dostępne',

  font: 'Czcionka', fontSize: 'Rozmiar', lineSpacing: 'Odstęp między wierszami',
  sizeSmall: 'Mały', sizeMedium: 'Średni', sizeLarge: 'Duży',
  spacingCompact: 'Zwarty', spacingNormal: 'Normalny', spacingRelaxed: 'Luźny',

  sectionProfile: 'Profil', sectionExperience: 'Doświadczenie Zawodowe',
  sectionEducation: 'Wykształcenie', sectionSkills: 'Umiejętności',
  sectionLanguages: 'Języki', sectionContact: 'Kontakt',
  sectionPlaceholder: '—',

  letterTitle: 'List motywacyjny', newLetter: '+ Nowy list',
  letterJob: 'Stanowisko *', letterJobPlaceholder: 'np. Inżynier oprogramowania',
  letterCompany: 'Firma *', letterCompanyPlaceholder: 'np. Google Polska',
  letterGenerate: '✨ Generuj z AI', letterGenerating: '⏳ AI pisze Twój list...',
  letterDesignPick: 'Wybierz design', letterSave: '💾 Zapisz',
  letterApply: '🚀 Aplikuj!', letterPDF: '📄 PDF', letterWord: '📝 Word',
  letterGreeting: 'Szanowni Państwo,',
  letterClosing: 'Z poważaniem,',
  letterSubjectPrefix: 'Podanie o pracę:',
  letterDesignNote: 'Design dopasowany do CV',
  letterEditHint: 'Tekst jest edytowalny — kliknij, aby edytować',
}

export const DASH_T: Record<string, DashT> = { de: DE, en: EN, tr: TR, es: ES, fr: FR, pl: PL }

/** Reads `jobbly_lang` from localStorage (set by Settings). Falls back to 'de'. */
export function getDashT(lang?: string): DashT {
  const l = lang || (typeof window !== 'undefined' ? localStorage.getItem('jobbly_lang') || 'de' : 'de')
  return DASH_T[l] || DASH_T.de
}

/** Hook-style helper to get current lang code from localStorage */
export function getCurrentLang(): DashLang {
  if (typeof window === 'undefined') return 'de'
  const l = localStorage.getItem('jobbly_lang') || 'de'
  return (DASH_T[l] ? l : 'de') as DashLang
}

/** Ordered list of language names for dropdowns, keyed by language code */
export function getLangOptions(t: DashT): { value: string; label: string }[] {
  return [
    { value: 'Deutsch', label: t.langGerman },
    { value: 'Englisch', label: t.langEnglish },
    { value: 'Französisch', label: t.langFrench },
    { value: 'Spanisch', label: t.langSpanish },
    { value: 'Italienisch', label: t.langItalian },
    { value: 'Portugiesisch', label: t.langPortuguese },
    { value: 'Polnisch', label: t.langPolish },
    { value: 'Türkisch', label: t.langTurkish },
    { value: 'Arabisch', label: t.langArabic },
    { value: 'Chinesisch', label: t.langChinese },
    { value: 'Russisch', label: t.langRussian },
    { value: 'Japanisch', label: t.langJapanese },
  ]
}
