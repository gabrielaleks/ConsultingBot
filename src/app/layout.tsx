import 'highlight.js/styles/github-dark.css'
import type {Metadata} from 'next'

import Root from '@/components/Root'

import './globals.css'
import './chat.css'

export const metadata: Metadata = {
  title: 'Consulting Chatbot',
  description: 'Consulting Chatbot',
}

export default function RootLayout({children}: {children: React.ReactNode}) {
  return <Root>{children}</Root>
}
