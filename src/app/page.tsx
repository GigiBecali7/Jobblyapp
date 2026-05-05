'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UserProfile, UserData, WritingStyle, Template, Lang, CVData } from '@/lib/types'
import type { Job } from '@/components/steps/Step4Jobs'
import { T } from '@/lib/translations'

import Toast, { type ToastType } from '@/components/Toast'
import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import StepsBar from '@/components/StepsBar'
import CookieBanner from '@/components/CookieBanner'
import AuthModal from '@/components/AuthModal'
import ProModal from '@/components/ProModal'
import LegalModal from '@/components/LegalModal'
import Footer from '@/components/Footer'
import Step1Profile from '@/components/steps/Step1Profile'
import Step2Style from '@/components/steps/Step2Style'
import Step3Design from '@/components/steps/Step3Design'
import Step4Jobs from '@/components/steps/Step4Jobs'
import Step5Result from '@/components/steps/Step5Result'

export default function Home() {
  const supabase = createClient()

  // Auth & user state
  const [user, setUser] = useState<UserProfile | null>(null)

  // App state
  const [lang, setLang] = useState<Lang>('en')
  const [step, setStep] = useState(1)
  const [wStyle, setWStyle] = useState<WritingStyle>('balanced')
  const [template, setTemplate] = useState<Template>('classic')
  const [userData, setUserData] = useState<UserData>({} as UserData)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [cvData, setCvData] = useState<CVData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [loadMsg, setLoadMsg] = useState('')

  // Modal state
  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' })
  const [proModal, setProModal] = useState(false)
  const [legalModal, setLegalModal] = useState<{ open: boolean; section: string }>({ open: false, section: 'impressum' })

  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const appTopRef = useRef<HTMLDivElement>(null)
  const t = T[lang]

  function showToast(message: string, type: ToastType) {
    setToast({ message, type })
  }

  // Fetch user profile on mount and auth state change
  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (data) setUser(data as UserProfile)
  }, [supabase])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) fetchProfile(u.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setUser(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, fetchProfile])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
  }

  function scrollToApp() {
    appTopRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function handleGenerate() {
    if (!user) {
      setAuthModal({ open: true, tab: 'login' })
      return
    }
    if (!user.is_pro) {
      setProModal(true)
      return
    }

    // Validate inputs before proceeding
    try {
      const vRes = await fetch('/api/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          position: userData.position,
          skills: userData.skills,
          lastjob: userData.lastjob,
        }),
      })
      const vData = await vRes.json()
      if (!vData.valid) {
        showToast(vData.reason || 'Please check your inputs and try again.', 'error')
        return
      }
    } catch {
      // Validation network error — fail open
    }

    showToast('Looking good! Generating your CV now…', 'success')

    setStep(5)
    setGenerating(true)
    setCvData(null)

    const msgs = t.loadMsgs
    let mi = 0
    setLoadMsg(msgs[0])
    const iv = setInterval(() => {
      mi++
      if (mi < msgs.length) setLoadMsg(msgs[mi])
    }, 2200)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData, style: wStyle, lang, selectedJob, template }),
      })
      clearInterval(iv)

      const data = await res.json()
      if (data.error) {
        setLoadMsg('Error: ' + data.error)
        setGenerating(false)
        return
      }
      setCvData(data.cvData)
    } catch (err) {
      clearInterval(iv)
      setLoadMsg('Something went wrong. Please try again.')
    } finally {
      setGenerating(false)
    }
  }

  function handleStartOver() {
    setStep(1)
    setCvData(null)
    setSelectedJob(null)
    scrollToApp()
  }

  function showStep(n: number) {
    setStep(n)
    scrollToApp()
  }

  return (
    <div className="app">
      <CookieBanner onOpenLegal={(s) => setLegalModal({ open: true, section: s })} />

      <Nav
        lang={lang}
        onLangChange={setLang}
        user={user}
        onSignIn={() => setAuthModal({ open: true, tab: 'login' })}
        onRegister={() => setAuthModal({ open: true, tab: 'register' })}
        onLogout={handleLogout}
      />

      <Hero
        t={t}
        onCta={scrollToApp}
        onSignIn={() => setAuthModal({ open: true, tab: 'login' })}
      />

      <div ref={appTopRef}>
        <StepsBar step={step} t={t} />
      </div>

      <div className="main">
        {step === 1 && (
          <Step1Profile
            t={t}
            initialData={userData}
            onNext={(data) => { setUserData(data); showStep(2) }}
          />
        )}
        {step === 2 && (
          <Step2Style
            t={t}
            selected={wStyle}
            onSelect={setWStyle}
            onNext={() => showStep(3)}
            onBack={() => showStep(1)}
          />
        )}
        {step === 3 && (
          <Step3Design
            t={t}
            selected={template}
            onSelect={setTemplate}
            onNext={() => showStep(4)}
            onBack={() => showStep(2)}
          />
        )}
        {step === 4 && (
          <Step4Jobs
            t={t}
            userData={userData}
            selectedJob={selectedJob}
            onSelect={setSelectedJob}
            onGenerate={handleGenerate}
            onBack={() => showStep(3)}
          />
        )}
        {step === 5 && (
          <Step5Result
            t={t}
            loading={generating}
            loadMsg={loadMsg}
            cvData={cvData}
            userData={userData}
            template={template}
            onStartOver={handleStartOver}
          />
        )}

        <Footer onOpenLegal={(s) => setLegalModal({ open: true, section: s })} />
      </div>

      {authModal.open && (
        <AuthModal
          initialTab={authModal.tab}
          onClose={() => setAuthModal({ open: false, tab: 'login' })}
          onSuccess={() => {
            setAuthModal({ open: false, tab: 'login' })
          }}
        />
      )}

      {proModal && (
        <ProModal
          onClose={() => setProModal(false)}
          isLoggedIn={!!user}
          onNeedAuth={() => setAuthModal({ open: true, tab: 'login' })}
        />
      )}

      {legalModal.open && (
        <LegalModal
          section={legalModal.section as 'impressum' | 'datenschutz' | 'agb' | 'cookies'}
          onClose={() => setLegalModal({ open: false, section: 'impressum' })}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
    </div>
  )
}
