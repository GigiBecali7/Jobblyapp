'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import CookieBanner from '@/components/CookieBanner'
import AuthModal from '@/components/AuthModal'
import ProModal from '@/components/ProModal'
import LegalModal from '@/components/LegalModal'
import Footer from '@/components/Footer'
import LandingSections from '@/components/LandingSections'
import Toast, { type ToastType } from '@/components/Toast'

import type { UserProfile, Lang } from '@/lib/types'
import { T } from '@/lib/translations'

export default function Home() {
  const supabase = createClient()

  const [user, setUser] = useState<UserProfile | null>(null)
  const [lang, setLang] = useState<Lang>('en')
  const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null)

  const [authModal, setAuthModal] = useState<{ open: boolean; tab: 'login' | 'register' }>({ open: false, tab: 'login' })
  const [proModal, setProModal] = useState(false)
  const [legalModal, setLegalModal] = useState<{ open: boolean; section: string }>({ open: false, section: 'impressum' })

  const t = T[lang]

  useEffect(() => {
    // Read current auth state once to show/hide the "Zum Dashboard" button — never auto-redirect
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        supabase.from('profiles').select('*').eq('id', u.id).single().then(({ data }) => {
          setUser((data || { id: u.id, email: u.email || '', first_name: '', last_name: '', is_pro: false, stripe_customer_id: null, stripe_subscription_id: null, created_at: '' }) as UserProfile)
        })
      }
    })

    // Listen for auth changes to update the button — but NEVER redirect automatically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setUser(null)
      }
      // Do NOT redirect on session change — user navigates to dashboard manually
    })
    return () => subscription.unsubscribe()
  }, [supabase])

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
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
        onCta={() => setAuthModal({ open: true, tab: 'register' })}
        onSignIn={() => setAuthModal({ open: true, tab: 'login' })}
      />

      <LandingSections
        onCta={() => setAuthModal({ open: true, tab: 'register' })}
        onUpgrade={() => {
          if (!user) setAuthModal({ open: true, tab: 'register' })
          else setProModal(true)
        }}
      />

      <Footer onOpenLegal={(s) => setLegalModal({ open: true, section: s })} />

      {authModal.open && (
        <AuthModal
          initialTab={authModal.tab}
          onClose={() => setAuthModal({ open: false, tab: 'login' })}
          onSuccess={() => setAuthModal({ open: false, tab: 'login' })}
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
