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
}

export type FontFamily = 'Inter' | 'Georgia' | 'Playfair Display' | 'Roboto' | 'Lato' | 'Montserrat'
export type FontSize = 'small' | 'medium' | 'large'
export type LineSpacing = 'compact' | 'normal' | 'relaxed'
export type CVDesign = 'NordicMinimal' | 'NordicSidebar' | 'ModernSplit' | 'DarkPro' | 'ExecutivePhoto' | 'MonoElegant'
