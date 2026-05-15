export interface CVSections {
  profile: string
  experience: string
  education: string
  skills: string
  languages: string
  contact: string
}

export const DEFAULT_SECTIONS: CVSections = {
  profile: 'Profil',
  experience: 'Berufserfahrung',
  education: 'Ausbildung',
  skills: 'Kenntnisse',
  languages: 'Sprachen',
  contact: 'Kontakt',
}

export interface CVProps {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  linkedin?: string
  photoUrl?: string
  position: string
  profile: string
  experience: string
  education: string
  skills: string[]
  languages: string
  fontFamily?: FontFamily
  fontSize?: FontSize
  lineSpacing?: LineSpacing
  sections?: CVSections
}

export type FontFamily = 'Inter' | 'Georgia' | 'Playfair Display' | 'Roboto' | 'Lato' | 'Montserrat'
export type FontSize = 'small' | 'medium' | 'large'
export type LineSpacing = 'compact' | 'normal' | 'relaxed'
export type CVDesign = 'NordicMinimal' | 'NordicSidebar' | 'ModernSplit' | 'DarkPro' | 'ExecutivePhoto' | 'MonoElegant'
