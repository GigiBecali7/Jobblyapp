import type { CVData, UserData } from '@/lib/types'

interface Props {
  cvData: CVData
  userData: UserData
}

const NAVY = '#1B2E6B'
const NAVY3 = '#93AFFD'

export default function SplitTemplate({ cvData, userData }: Props) {
  const skills = Array.isArray(cvData.skills) ? cvData.skills : String(cvData.skills || '').split(',').filter(Boolean)

  const sideSecLabel: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, color: NAVY3, textTransform: 'uppercase',
    letterSpacing: '0.15em', marginBottom: 8, marginTop: 20, display: 'block',
    borderBottom: `0.5px solid rgba(147,175,253,0.3)`, paddingBottom: 4,
  }
  const mainSecLabel: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, color: NAVY, textTransform: 'uppercase',
    letterSpacing: '0.15em', marginBottom: 8, marginTop: 20, display: 'block',
    borderBottom: `1.5px solid ${NAVY}`, paddingBottom: 4,
  }

  return (
    <div style={{ display: 'flex', background: '#fff', minHeight: 560, fontFamily: '"DM Sans", Arial, sans-serif', fontSize: 13 }}>
      {/* Navy sidebar */}
      <div style={{ width: '38%', background: NAVY, padding: '32px 22px', flexShrink: 0, color: '#fff' }}>
        {/* Circular photo */}
        <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'center' }}>
          {userData.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={userData.photo} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.25)' }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', border: '2px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: NAVY3, fontWeight: 700 }}>
              {(userData.fname || '?').charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div style={{ fontSize: 17, fontWeight: 600, color: '#fff', textAlign: 'center', marginBottom: 3, lineHeight: 1.2 }}>
          {userData.fullname}
        </div>
        <div style={{ fontSize: 11, color: 'rgba(147,175,253,0.9)', textAlign: 'center', marginBottom: 22, fontStyle: 'italic' }}>
          {userData.position}
        </div>

        <span style={sideSecLabel}>Contact</span>
        <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.9 }}>
          {userData.email && <div>{userData.email}</div>}
          {userData.phone && <div>{userData.phone}</div>}
          {userData.city && <div>{userData.city}</div>}
          {userData.linkedin && <div style={{ color: NAVY3 }}>{userData.linkedin}</div>}
        </div>

        <span style={sideSecLabel}>Skills</span>
        <div>
          {skills.map((sk, i) => (
            <div key={i} style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.9 }}>
              · {sk.trim()}
            </div>
          ))}
        </div>

        {cvData.sprachen && (
          <>
            <span style={sideSecLabel}>Languages</span>
            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.8)', lineHeight: 1.7 }}>{cvData.sprachen}</div>
          </>
        )}
      </div>

      {/* White main content */}
      <div style={{ flex: 1, padding: '32px 26px', background: '#fff' }}>
        <span style={mainSecLabel}>Profile</span>
        <p style={{ fontSize: 12.5, color: '#333', lineHeight: 1.75 }}>{cvData.profil}</p>

        <span style={mainSecLabel}>Experience</span>
        <p style={{ fontSize: 12.5, color: '#333', lineHeight: 1.75 }}>{cvData.erfahrung}</p>

        {cvData.ausbildung && (
          <>
            <span style={mainSecLabel}>Education</span>
            <p style={{ fontSize: 12.5, color: '#333', lineHeight: 1.75 }}>{cvData.ausbildung}</p>
          </>
        )}

        <span style={mainSecLabel}>Cover Letter</span>
        <p style={{ fontSize: 12.5, color: '#333', lineHeight: 1.75, whiteSpace: 'pre-wrap' }}>{cvData.anschreiben}</p>
      </div>
    </div>
  )
}
