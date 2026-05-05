import type { CVData, UserData } from '@/lib/types'

interface Props {
  cvData: CVData
  userData: UserData
}

const NAVY = '#1B2E6B'

export default function MonoTemplate({ cvData, userData }: Props) {
  const skills = Array.isArray(cvData.skills) ? cvData.skills : String(cvData.skills || '').split(',').filter(Boolean)

  const secLabel: React.CSSProperties = {
    fontSize: 9, fontWeight: 700, color: '#999', textTransform: 'uppercase',
    letterSpacing: '0.15em', marginBottom: 8, marginTop: 20, display: 'block',
  }
  const body: React.CSSProperties = { fontSize: 12.5, color: '#333', lineHeight: 1.75, fontFamily: '"DM Sans", Arial, sans-serif' }

  return (
    <div style={{ background: '#fff', fontFamily: '"DM Sans", Arial, sans-serif', fontSize: 13 }}>
      {/* Top accent bar */}
      <div style={{ height: 4, background: NAVY }} />

      {/* Header */}
      <div style={{ padding: '28px 32px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid #eee' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 28, fontWeight: 300, color: '#1a1a2a', letterSpacing: '-0.5px', marginBottom: 4, lineHeight: 1.1 }}>
            {userData.fullname}
          </div>
          <div style={{ fontSize: 13, color: '#666', fontStyle: 'italic', marginBottom: 10 }}>{userData.position}</div>
          <div style={{ fontSize: 11, color: '#888', lineHeight: 1.8 }}>
            {[userData.email, userData.phone, userData.city, userData.linkedin].filter(Boolean).join('  ·  ')}
          </div>
        </div>
        {userData.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={userData.photo} alt="" style={{ width: 80, height: 80, borderRadius: 3, objectFit: 'cover', flexShrink: 0, marginLeft: 24 }} />
        )}
      </div>

      {/* Two-column body */}
      <div style={{ display: 'flex', padding: '0 32px 32px' }}>
        {/* Main column */}
        <div style={{ flex: 1.6, paddingRight: 32, borderRight: '1px solid #eee' }}>
          <span style={secLabel}>Profile</span>
          <p style={body}>{cvData.profil}</p>
          <span style={secLabel}>Experience</span>
          <p style={body}>{cvData.erfahrung}</p>
          <span style={secLabel}>Cover Letter</span>
          <p style={{ ...body, whiteSpace: 'pre-wrap' }}>{cvData.anschreiben}</p>
        </div>

        {/* Side column */}
        <div style={{ flex: 1, paddingLeft: 28 }}>
          <span style={secLabel}>Skills</span>
          <div>
            {skills.map((sk, i) => (
              <div key={i} style={{ fontSize: 12, color: '#333', lineHeight: 1.9, fontFamily: '"DM Sans", Arial, sans-serif' }}>
                — {sk.trim()}
              </div>
            ))}
          </div>

          {cvData.ausbildung && (
            <>
              <span style={secLabel}>Education</span>
              <p style={{ ...body, fontSize: 12 }}>{cvData.ausbildung}</p>
            </>
          )}

          {cvData.sprachen && (
            <>
              <span style={secLabel}>Languages</span>
              <p style={{ ...body, fontSize: 12 }}>{cvData.sprachen}</p>
            </>
          )}

          {userData.linkedin && (
            <>
              <span style={secLabel}>Links</span>
              <p style={{ ...body, fontSize: 12 }}>{userData.linkedin}</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
