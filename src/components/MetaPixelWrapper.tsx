'use client'
import dynamic from 'next/dynamic'

const MetaPixel = dynamic(() => import('./MetaPixel'), { ssr: false })

export default function MetaPixelWrapper() {
  return <MetaPixel />
}
