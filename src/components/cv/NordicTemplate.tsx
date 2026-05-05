import type { CVData, UserData } from '@/lib/types'

interface Props {
  cvData: CVData
  userData: UserData
}

const NAVY = '#1B2E6B'
const s: Record<string, React.CSSProperties> = {
  root: { display: 'flex', background: '#FAFAFA', minHeight: 560, fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 13 },
  sidebar: { width: '35%', background: '#F5F5F5', padding: '28px 20px', borderRight: '1px solid #E8E8E8', flexShrink: 0 },
  main: { flex: 1, padding: '28px 24px', background: '#FAFAFA' },
  photo: { width: '100%', aspectRatio: '1', objectFit: 'cover' as const, borderRadius: 4, marginBottom: 16, display: 'block' },
  photoPlaceholder: { width: '100%', aspectRatio: '1/1', borderRadius: 4, background: '#E0E4EE', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: NAVY },
  sideName: { fontSize: 16, fontWeight: 700, color: '#1a1a2a', marginBottom: 4, lineHeight: 1.2 },
  sidePos: { fontSize: 11, color: '#666', marginBottom: 14, fontStyle: 'italic' },
  sideContact: { fontSize: 10.5, color: '#555', lineHeight: 1.8, marginBottom: 16, fontFamily: '"DM Sans", sans-serif' },
  secHead: { fontSize: 10, fontWeight: 700, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 8, marginTop: 18, paddingBottom: 4, borderBottom: `1.5px solid ${NAVY}` },
  bullet: { fontSize: 11.5, color: '#333', lineHeight: 1.7, paddingLeft: 2 },
  mainHead: { fontSize: 22, fontWeight: 700, color: '#1a1a2a', letterSpacing: '-0.3px', marginBottom: 3 },
  mainPos: { fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 18 },
  secTitle: { fontSize: 10, fontWeight: 700, color: NAVY, textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 8, marginTop: 20, paddingBottom: 4, borderBottom: `1.5px solid ${NAVY}` },
  body: { fontSize: 12.5, color: '#333', lineHeight: 1.75 },
}

export default function NordicTemplate({ cvData, userData }: Props) {
  const skills = Array.isArray(cvData.skills) ? cvData.skills : String(cvData.skills || '').split(',').filter(Boolean)

  return (
    <div style={s.root}>
      <div style={s.sidebar}>
        {userData.photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userData.photo} alt="" style={s.photo} />
        ) : (
          <div style={s.photoPlaceholder as React.CSSProperties}>
            {(userData.fname || '?').charAt(0).toUpperCase()}
          </div>
        )}
        <div style={s.sideName}>{userData.fullname}</div>
        <div style={s.sidePos}>{userData.position}</div>
        <div style={s.sideContact}>
          {userData.email && <div>{userData.email}</div>}
          {userData.phone && <div>{userData.phone}</div>}
          {userData.city && <div>{userData.city}</div>}
          {userData.linkedin && <div>{userData.linkedin}</div>}
        </div>

        <div style={s.secHead as React.CSSProperties}>Skills</div>
        <div style={s.bullet}>
          {skills.map((sk, i) => <div key={i}>· {sk.trim()}</div>)}
        </div>

        {cvData.sprachen && (
          <>
            <div style={s.secHead as React.CSSProperties}>Languages</div>
            <div style={s.bullet}>{cvData.sprachen}</div>
          </>
        )}

        {cvData.ausbildung && (
          <>
            <div style={s.secHead as React.CSSProperties}>Education</div>
            <div style={s.bullet}>{cvData.ausbildung}</div>
          </>
        )}
      </div>

      <div style={s.main}>
        <div style={s.mainHead}>{userData.fullname}</div>
        <div style={s.mainPos}>{userData.position}</div>

        <div style={s.secTitle as React.CSSProperties}>Profile</div>
        <p style={s.body}>{cvData.profil}</p>

        <div style={s.secTitle as React.CSSProperties}>Experience</div>
        <p style={s.body}>{cvData.erfahrung}</p>

        <div style={s.secTitle as React.CSSProperties}>Cover Letter</div>
        <p style={{ ...s.body, whiteSpace: 'pre-wrap' }}>{cvData.anschreiben}</p>
      </div>
    </div>
  )
}
