'use client'

import { useState, useRef } from 'react'
import type { UserData } from '@/lib/types'
import type { Translation } from '@/lib/translations'

interface Props {
  t: Translation
  initialData: Partial<UserData>
  onNext: (data: UserData) => void
}

export default function Step1Profile({ t, initialData, onNext }: Props) {
  const [titel, setTitel] = useState(initialData.titel || '')
  const [fname, setFname] = useState(initialData.fname || '')
  const [lname, setLname] = useState(initialData.lname || '')
  const [email, setEmail] = useState(initialData.email || '')
  const [phone, setPhone] = useState(initialData.phone || '')
  const [city, setCity] = useState(initialData.city || '')
  const [linkedin, setLinkedin] = useState(initialData.linkedin || '')
  const [industry, setIndustry] = useState(initialData.industry || '')
  const [position, setPosition] = useState(initialData.position || '')
  const [experience, setExperience] = useState(initialData.experience || '')
  const [education, setEducation] = useState(initialData.education || '')
  const [skills, setSkills] = useState(initialData.skills || '')
  const [languages, setLanguages] = useState(initialData.languages || '')
  const [lastjob, setLastjob] = useState(initialData.lastjob || '')
  const [photo, setPhoto] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function loadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = (ev) => setPhoto(ev.target?.result as string)
    reader.readAsDataURL(f)
  }

  function handleNext() {
    const fullname = [titel, fname || 'Max', lname || 'Mustermann'].filter(Boolean).join(' ')
    onNext({
      titel, fname: fname || 'Max', lname: lname || 'Mustermann', fullname,
      email, phone, city: city || 'Vienna', linkedin,
      industry, position, experience, education,
      skills, languages, lastjob,
    })
  }

  return (
    <div>
      <div className="sec">
        <div className="sec-title">
          <div className="sec-icon">👤</div>
          <span>{t.personal}</span>
        </div>

        <div className="photo-row">
          <div className="photo-circle" onClick={() => fileRef.current?.click()}>
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="profile" style={{ width: 70, height: 70, objectFit: 'cover' }} />
            ) : (
              <>
                <span style={{ fontSize: 18 }}>+</span>
                <span>Photo</span>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={loadPhoto} />
          </div>
          <div style={{ flex: 1 }}>
            <div className="g3">
              <div className="field">
                <label>Title</label>
                <select value={titel} onChange={(e) => setTitel(e.target.value)}>
                  <option value="">–</option>
                  {['Mag.','Dr.','Prof.','Ing.','DI','BSc','MSc','MBA','Mr.','Ms.'].map(t => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>First name</label>
                <input type="text" placeholder="Max" value={fname} onChange={(e) => setFname(e.target.value)} />
              </div>
              <div className="field">
                <label>Last name</label>
                <input type="text" placeholder="Mustermann" value={lname} onChange={(e) => setLname(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        <div className="g2">
          <div className="field">
            <label>Email</label>
            <input type="email" placeholder="max@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="field">
            <label>Phone</label>
            <input type="tel" placeholder="+43 123 456789" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
        <div className="g2">
          <div className="field">
            <label>City</label>
            <input type="text" placeholder="Vienna" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div className="field">
            <label>LinkedIn</label>
            <input type="text" placeholder="linkedin.com/in/..." value={linkedin} onChange={(e) => setLinkedin(e.target.value)} />
          </div>
        </div>
      </div>

      <div className="sec">
        <div className="sec-title">
          <div className="sec-icon">💼</div>
          <span>{t.career}</span>
        </div>

        <div className="g2">
          <div className="field">
            <label>Industry</label>
            <select value={industry} onChange={(e) => setIndustry(e.target.value)}>
              <option value="">Select...</option>
              {['IT & Technology','Marketing & Communications','Finance & Accounting','Sales & Trade',
                'Hospitality & Tourism','Healthcare & Nursing','Construction & Trades',
                'Education & Social','Law & Administration','Logistics & Transport','Other'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Desired position</label>
            <input type="text" placeholder="e.g. Project Manager" value={position} onChange={(e) => setPosition(e.target.value)} />
          </div>
        </div>
        <div className="g2">
          <div className="field">
            <label>Experience</label>
            <select value={experience} onChange={(e) => setExperience(e.target.value)}>
              <option value="">Select...</option>
              {['Entry level (0–1 yr)','1–2 years','3–5 years','6–10 years','10+ years'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Education</label>
            <select value={education} onChange={(e) => setEducation(e.target.value)}>
              <option value="">Select...</option>
              {['Secondary school','Apprenticeship','A-levels / Matura','Bachelor','Master / Diploma','PhD / Doctorate'].map(o => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="field">
          <label>Skills (comma separated)</label>
          <input type="text" placeholder="e.g. Excel, teamwork, customer service" value={skills} onChange={(e) => setSkills(e.target.value)} />
        </div>
        <div className="field">
          <label>Languages</label>
          <input type="text" placeholder="e.g. German (native), English (fluent)" value={languages} onChange={(e) => setLanguages(e.target.value)} />
        </div>
        <div className="field">
          <label>Last role (optional)</label>
          <textarea placeholder="e.g. 3 years as sales rep at XY, responsible for..." value={lastjob} onChange={(e) => setLastjob(e.target.value)} />
        </div>
      </div>

      <div style={{ padding: '1.25rem 1.5rem', borderTop: '0.5px solid var(--border)' }}>
        <button className="btn" onClick={handleNext}>Continue to writing style →</button>
      </div>
    </div>
  )
}
