import type { Lang, WritingStyle } from './types'

export interface Translation {
  tag: string
  h1: string
  p: string
  cta: string
  signin: string
  stat1: string
  stat2: string
  stat3: string
  personal: string
  career: string
  styleT: string
  designT: string
  jobsT: string
  cover: string
  preview: string
  styleSub: string
  jobsSub: string
  sn: string[]
  sd: string[]
  loadMsgs: string[]
  ok: string
  previews: Record<WritingStyle, string>
}

export const T: Record<Lang, Translation> = {
  en: {
    tag: 'AI-powered · Free to start',
    h1: 'Your perfect application,\nin minutes.',
    p: 'Jobbly uses AI to write your CV and cover letter — tailored to every job, in your style. Available in 6 languages.',
    cta: 'Build my CV — free',
    signin: 'Sign in',
    stat1: 'average time',
    stat2: 'languages',
    stat3: 'writing styles',
    personal: 'Personal details',
    career: 'Career profile',
    styleT: 'Writing style',
    designT: 'Choose a design',
    jobsT: 'Matching jobs',
    cover: 'Cover letter',
    preview: 'Preview',
    styleSub: 'Every style sounds genuine — no grovelling, no hollow phrases.',
    jobsSub: 'Select a role for a tailored application — or skip for a general one.',
    sn: ['Balanced', 'Friendly & warm', 'Confident & direct', 'Formal & precise'],
    sd: [
      'Natural, genuine, works everywhere.',
      'Upbeat, personable, polite.',
      'Relaxed, self-assured, no fluff.',
      'Serious, objective, structured.',
    ],
    loadMsgs: [
      'Analysing your profile...',
      'Building your CV...',
      'Writing cover letter...',
      'Checking spelling...',
      'Final touches...',
    ],
    ok: 'Application created successfully',
    previews: {
      balanced: '"I\'m applying because my experience and skills are a strong match. I work well in teams and look forward to new challenges."',
      friendly: '"I\'m genuinely excited about this role — confident I\'d be a great fit!"',
      confident: '"I\'m applying for this position — and I\'m honestly very good at it."',
      formal: '"I hereby apply for the advertised position. My qualifications make me a strong candidate."',
    },
  },
  de: {
    tag: 'KI-gestützt · Kostenlos starten',
    h1: 'Deine perfekte Bewerbung,\nin Minuten.',
    p: 'Jobbly schreibt mit KI deinen Lebenslauf und dein Anschreiben — passend zur Stelle, in deinem Stil.',
    cta: 'Lebenslauf erstellen',
    signin: 'Anmelden',
    stat1: 'Ø Dauer',
    stat2: 'Sprachen',
    stat3: 'Schreibstile',
    personal: 'Persönliche Daten',
    career: 'Berufliches Profil',
    styleT: 'Schreibstil',
    designT: 'Design wählen',
    jobsT: 'Passende Jobs',
    cover: 'Anschreiben',
    preview: 'Vorschau',
    styleSub: 'Kein Stil klingt unterwürfig — alle auf Augenhöhe.',
    jobsSub: 'Wähle eine Stelle für eine maßgeschneiderte Bewerbung.',
    sn: ['Ausgeglichen', 'Freundlich & locker', 'Locker & selbstbewusst', 'Seriös & professionell'],
    sd: [
      'Natürlich, echt, passt überall.',
      'Warm, extrovertiert, höflich.',
      'Entspannt, selbstsicher, direkt.',
      'Formal, sachlich, präzise.',
    ],
    loadMsgs: [
      'Profil wird analysiert...',
      'Lebenslauf wird erstellt...',
      'Anschreiben wird verfasst...',
      'Rechtschreibung wird geprüft...',
      'Letzter Schliff...',
    ],
    ok: 'Bewerbung erfolgreich erstellt',
    previews: {
      balanced: '"Ich bewerbe mich, weil meine Erfahrung gut passt. Ich freue mich auf neue Aufgaben."',
      friendly: '"Mit echter Begeisterung bewerbe ich mich!"',
      confident: '"Ich bewerbe mich — und ich bin ehrlich gesagt ziemlich gut darin."',
      formal: '"Hiermit bewerbe ich mich auf die ausgeschriebene Stelle."',
    },
  },
  tr: {
    tag: 'YZ destekli · Ücretsiz başla',
    h1: 'Mükemmel başvurun,\ndakikalar içinde.',
    p: 'Jobbly özgeçmişini ve ön yazını YZ ile yazar — her işe özel, kendi tarzında.',
    cta: 'CV oluştur',
    signin: 'Giriş yap',
    stat1: 'ort. süre',
    stat2: 'dil',
    stat3: 'yazı stili',
    personal: 'Kişisel bilgiler',
    career: 'Kariyer profili',
    styleT: 'Yazı stili',
    designT: 'Tasarım seç',
    jobsT: 'Eşleşen işler',
    cover: 'Ön yazı',
    preview: 'Önizleme',
    styleSub: 'Her stil samimi — aşırılık yok.',
    jobsSub: 'Özelleştirilmiş başvuru için bir pozisyon seçin.',
    sn: ['Dengeli', 'Arkadaşça & sıcak', 'Özgüvenli & doğrudan', 'Resmi & kesin'],
    sd: [
      'Doğal, samimi, her yerde işe yarar.',
      'Neşeli, kişisel, kibar.',
      'Rahat, kendinden emin, gereksiz detay yok.',
      'Ciddi, nesnel, yapılandırılmış.',
    ],
    loadMsgs: [
      'Profil analiz ediliyor...',
      'CV oluşturuluyor...',
      'Ön yazı yazılıyor...',
      'Kontrol ediliyor...',
      'Son rötuşlar...',
    ],
    ok: 'Başvuru oluşturuldu',
    previews: {
      balanced: '"Deneyimim bu pozisyona çok uygun olduğu için başvuruyorum."',
      friendly: '"Bu rol için gerçekten çok heyecanlıyım!"',
      confident: '"Bu pozisyon için başvuruyorum ve bu konuda gerçekten iyiyim."',
      formal: '"İlan edilen pozisyon için başvurumu sunuyorum."',
    },
  },
  es: {
    tag: 'IA · Gratis para empezar',
    h1: 'Tu solicitud perfecta,\nen minutos.',
    p: 'Jobbly usa IA para escribir tu CV y carta de presentación — adaptados a cada trabajo.',
    cta: 'Crear mi CV',
    signin: 'Iniciar sesión',
    stat1: 'tiempo prom.',
    stat2: 'idiomas',
    stat3: 'estilos',
    personal: 'Datos personales',
    career: 'Perfil profesional',
    styleT: 'Estilo de escritura',
    designT: 'Elegir diseño',
    jobsT: 'Empleos coincidentes',
    cover: 'Carta de presentación',
    preview: 'Vista previa',
    styleSub: 'Sin adulación, todos auténticos.',
    jobsSub: 'Selecciona un puesto para una solicitud personalizada.',
    sn: ['Equilibrado', 'Amigable & cálido', 'Seguro & directo', 'Formal & preciso'],
    sd: [
      'Natural, genuino.',
      'Animado, personal, educado.',
      'Seguro, sin relleno.',
      'Serio, objetivo, estructurado.',
    ],
    loadMsgs: [
      'Analizando perfil...',
      'Creando CV...',
      'Escribiendo carta...',
      'Revisando ortografía...',
      'Toques finales...',
    ],
    ok: 'Solicitud creada con éxito',
    previews: {
      balanced: '"Me postulo porque mi experiencia coincide perfectamente con el puesto."',
      friendly: '"¡Estoy muy emocionado/a por esta oportunidad!"',
      confident: '"Me postulo y soy muy bueno/a en esto."',
      formal: '"Por la presente presento mi candidatura para el puesto anunciado."',
    },
  },
  fr: {
    tag: 'IA · Gratuit pour commencer',
    h1: 'Votre candidature parfaite,\nen minutes.',
    p: "Jobbly rédige votre CV et lettre de motivation avec l'IA — adaptés à chaque offre.",
    cta: 'Créer mon CV',
    signin: 'Se connecter',
    stat1: 'durée moy.',
    stat2: 'langues',
    stat3: 'styles',
    personal: 'Informations personnelles',
    career: 'Profil professionnel',
    styleT: "Style d'écriture",
    designT: 'Choisir un design',
    jobsT: 'Offres correspondantes',
    cover: 'Lettre de motivation',
    preview: 'Aperçu',
    styleSub: 'Chaque style est authentique — sans flagornerie.',
    jobsSub: 'Sélectionnez un poste pour une candidature personnalisée.',
    sn: ['Équilibré', 'Chaleureux & amical', 'Confiant & direct', 'Formel & précis'],
    sd: [
      'Naturel, authentique.',
      'Dynamique, personnel, poli.',
      'Assuré, sans fioritures.',
      'Sérieux, objectif, structuré.',
    ],
    loadMsgs: [
      'Analyse du profil...',
      'Création du CV...',
      'Rédaction de la lettre...',
      'Vérification orthographique...',
      'Retouches finales...',
    ],
    ok: 'Candidature créée avec succès',
    previews: {
      balanced: '"Je postule car mon expérience correspond parfaitement au poste."',
      friendly: '"Je suis vraiment enthousiaste à l\'idée de rejoindre votre équipe!"',
      confident: '"Je postule pour ce poste et je suis très compétent(e)."',
      formal: '"J\'ai l\'honneur de vous soumettre ma candidature pour le poste annoncé."',
    },
  },
  pl: {
    tag: 'AI · Za darmo',
    h1: 'Twoja idealna aplikacja,\nw minuty.',
    p: 'Jobbly pisze CV i list motywacyjny z AI — dopasowane do każdej oferty pracy.',
    cta: 'Utwórz CV',
    signin: 'Zaloguj się',
    stat1: 'śr. czas',
    stat2: 'języki',
    stat3: 'style',
    personal: 'Dane osobowe',
    career: 'Profil zawodowy',
    styleT: 'Styl pisania',
    designT: 'Wybierz projekt',
    jobsT: 'Pasujące oferty',
    cover: 'List motywacyjny',
    preview: 'Podgląd',
    styleSub: 'Każdy styl jest autentyczny — bez uniżoności.',
    jobsSub: 'Wybierz stanowisko dla spersonalizowanej aplikacji.',
    sn: ['Zrównoważony', 'Przyjazny & ciepły', 'Pewny siebie & bezpośredni', 'Formalny & precyzyjny'],
    sd: [
      'Naturalny, autentyczny.',
      'Energiczny, osobisty, uprzejmy.',
      'Pewny siebie, bez zbędnych słów.',
      'Poważny, obiektywny, strukturyzowany.',
    ],
    loadMsgs: [
      'Analiza profilu...',
      'Tworzenie CV...',
      'Pisanie listu...',
      'Sprawdzanie pisowni...',
      'Ostatnie szlify...',
    ],
    ok: 'Aplikacja utworzona pomyślnie',
    previews: {
      balanced: '"Aplikuję, ponieważ moje doświadczenie doskonale pasuje do tego stanowiska."',
      friendly: '"Jestem naprawdę podekscytowany/a tą możliwością!"',
      confident: '"Aplikuję na to stanowisko i jestem w tym naprawdę dobry/a."',
      formal: '"Niniejszym składam swoją aplikację na ogłoszone stanowisko."',
    },
  },
}

export const legalTexts = {
  impressum: `<h2>Imprint</h2>
<p style="color:rgba(255,255,255,.4);font-size:12px;margin-bottom:1rem">Pursuant to §5 ECG Austria</p>
<h3>Company</h3>
<p>Jobbly (jobblyapp.com)<br>[YOUR FULL NAME]<br>[YOUR ADDRESS]<br>Vienna, Austria<br>hello@jobblyapp.com</p>
<h3>Disclaimer</h3>
<p>AI-generated content is a template only and does not replace professional advice.</p>`,

  datenschutz: `<h2>Privacy Policy</h2>
<p style="color:rgba(255,255,255,.4);font-size:12px;margin-bottom:1rem">GDPR compliant</p>
<h3>1. Controller</h3>
<p>[YOUR NAME], Vienna, Austria. Email: hello@jobblyapp.com</p>
<h3>2. Data collected</h3>
<ul><li>Account: name, email, encrypted password</li><li>Profile: career info, optional photo, skills</li><li>Usage: applications created, styles chosen</li></ul>
<h3>3. Purpose</h3>
<ul><li>Service delivery (Art. 6(1)(b) GDPR)</li><li>Account management</li><li>Job notifications (consent only)</li></ul>
<h3>4. Retention</h3>
<p>Stored while account is active. Deleted within 30 days of cancellation.</p>
<h3>5. Your rights</h3>
<p>Access, rectification, erasure, portability under GDPR. Contact: hello@jobblyapp.com</p>
<h3>6. Processors</h3>
<ul><li>Supabase: EU servers, Frankfurt</li><li>Stripe: PCI-DSS certified</li><li>Anthropic API: data never used for training</li></ul>`,

  agb: `<h2>Terms of Service</h2>
<p style="color:rgba(255,255,255,.4);font-size:12px;margin-bottom:1rem">Jobbly — jobblyapp.com</p>
<h3>1. Service</h3>
<p>AI-assisted creation of job applications. Generated texts are templates, not professional advice.</p>
<h3>2. Pro plan</h3>
<ul><li>€9.99/month incl. 20% VAT</li><li>Billed monthly, auto-renews</li></ul>
<h3>3. Cancellation</h3>
<ul><li>Cancel anytime via dashboard or email</li><li>Access until end of billing period</li><li>14-day withdrawal right (§11 FAGG Austria)</li></ul>
<h3>4. Ownership</h3>
<p>All applications you create belong to you.</p>
<h3>5. Law</h3>
<p>Austrian law. Venue: Vienna.</p>`,

  cookies: `<h2>Cookie Policy</h2>
<h3>Essential only</h3>
<p>We use only technically necessary cookies. No advertising or tracking cookies of any kind.</p>
<ul><li><strong>session_token:</strong> keeps you logged in (30 days)</li><li><strong>lang_pref:</strong> remembers your language</li></ul>
<h3>No tracking</h3>
<p>Jobbly does not use Google Analytics, Facebook Pixel, or any ad network. Your data is never sold.</p>`,
}

export const styleInstructions: Record<WritingStyle, string> = {
  balanced: 'Natural, genuine, on equal footing. No flattery, no grovelling. Direct, clear, human.',
  friendly: 'Friendly, warm, upbeat but polite. Enthusiastic without being excessive.',
  confident: 'Relaxed, self-assured, direct. Short sentences. Shows personality without arrogance.',
  formal: 'Formal, objective, very professional. Precise, structured. No filler phrases.',
}
