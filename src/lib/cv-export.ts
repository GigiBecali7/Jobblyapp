import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

export async function exportToPDF(elementId: string, filename: string): Promise<void> {
  const element = document.getElementById(elementId)
  if (!element) throw new Error('Element not found')

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  })

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = pdf.internal.pageSize.getHeight()
  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  pdf.save(filename)
}

interface CVWordData {
  firstName: string
  lastName: string
  email: string
  phone: string
  city: string
  linkedin?: string
  position: string
  profile: string
  experience: string
  education: string
  skills: string[]
  languages: string
}

export async function exportToWord(cvData: CVWordData, filename: string): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: `${cvData.firstName} ${cvData.lastName}`, heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ children: [new TextRun({ text: cvData.position, bold: true })] }),
        new Paragraph({ text: '' }),
        new Paragraph({ children: [new TextRun({ text: `E-Mail: ${cvData.email}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Telefon: ${cvData.phone}` })] }),
        new Paragraph({ children: [new TextRun({ text: `Ort: ${cvData.city}` })] }),
        ...(cvData.linkedin ? [new Paragraph({ children: [new TextRun({ text: `LinkedIn: ${cvData.linkedin}` })] })] : []),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Profil', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.profile }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Berufserfahrung', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.experience }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Ausbildung', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.education }),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Kenntnisse', heading: HeadingLevel.HEADING_2 }),
        ...cvData.skills.map(s => new Paragraph({ text: `• ${s}` })),
        new Paragraph({ text: '' }),
        new Paragraph({ text: 'Sprachen', heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: cvData.languages }),
      ],
    }],
  })

  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
