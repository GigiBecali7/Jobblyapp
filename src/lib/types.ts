export interface UserProfile {
  id: string
  email: string
  first_name: string
  last_name: string
  is_pro: boolean
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export interface Application {
  id: string
  user_id: string
  position: string
  company: string | null
  template: string
  style: string
  cv_data: CVData
  cover_letter: string
  created_at: string
}

export interface CVData {
  profil: string
  erfahrung: string
  ausbildung: string
  skills: string[]
  sprachen: string
  anschreiben: string
}

export interface UserData {
  titel: string
  fname: string
  lname: string
  fullname: string
  email: string
  phone: string
  city: string
  linkedin: string
  industry: string
  position: string
  experience: string
  education: string
  skills: string
  languages: string
  lastjob: string
  photo?: string
}

export interface JobAlert {
  id: string
  user_id: string
  enabled: boolean
  platforms: string[]
  frequency: 'instant' | 'daily' | 'weekly'
  created_at: string
}

export type WritingStyle = 'balanced' | 'friendly' | 'confident' | 'formal'
export type Template = 'classic' | 'modern' | 'minimal' | 'navy' | 'executive' | 'tech' | 'nordic' | 'mono' | 'split'
export type Lang = 'en' | 'de' | 'tr' | 'es' | 'fr' | 'pl'
