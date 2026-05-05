import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Shield, FileText, Scale, ChevronRight } from 'lucide-react'

// Import the raw markdown files
import privacyMd from './legal/PrivacyPolicy.md?raw'
import termsMd from './legal/TermsOfUse.md?raw'
import securityMd from './legal/SecurityOverview.md?raw'

interface LegalDoc {
  id: string
  title: string
  icon: React.ReactNode
  content: string
  description: string
}

const LEGAL_DOCS: LegalDoc[] = [
  {
    id: 'privacy',
    title: 'Privacy Policy',
    icon: <Shield className="w-5 h-5" />,
    content: privacyMd,
    description: 'How we collect, use, and protect your personal data',
  },
  {
    id: 'terms',
    title: 'Terms of Use',
    icon: <Scale className="w-5 h-5" />,
    content: termsMd,
    description: 'Rules and conditions for using CareSync',
  },
  {
    id: 'security',
    title: 'Security Overview',
    icon: <FileText className="w-5 h-5" />,
    content: securityMd,
    description: 'Our security architecture and compliance posture',
  },
]

/** Simple markdown-to-HTML renderer for legal documents */
function renderMarkdown(md: string): string {
  return md
    // Headers
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold text-white mt-6 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-bold text-white mt-8 mb-3 pb-2 border-b border-slate-700">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold text-white mt-6 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-slate-700/50 px-1.5 py-0.5 rounded text-blue-300 text-sm font-mono">$1</code>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-blue-400 hover:text-blue-300 underline">$1</a>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-slate-700 my-6" />')
    // Table rows (simple)
    .replace(/^\|(.*)\|$/gm, (match) => {
      const cells = match.split('|').filter(c => c.trim())
      if (cells.every(c => /^[\s-:]+$/.test(c))) return '' // Skip separator rows
      const isHeader = cells.every(c => c.trim().startsWith('**') || /^[A-Z]/.test(c.trim()))
      const tag = isHeader ? 'th' : 'td'
      const cellClass = isHeader
        ? 'px-3 py-2 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider bg-slate-800/50'
        : 'px-3 py-2 text-sm text-slate-300 border-t border-slate-700/50'
      const cellsHtml = cells.map(c => `<${tag} class="${cellClass}">${c.trim()}</${tag}>`).join('')
      return `<tr>${cellsHtml}</tr>`
    })
    // Unordered lists
    .replace(/^- (.*$)/gm, '<li class="text-slate-300 ml-4 list-disc">$1</li>')
    .replace(/^(\d+)\. (.*$)/gm, '<li class="text-slate-300 ml-4 list-decimal">$2</li>')
    // Blockquotes
    .replace(/^> (.*$)/gm, '<blockquote class="border-l-4 border-blue-500/50 pl-4 text-slate-400 italic my-2">$1</blockquote>')
    // Paragraphs (lines that aren't already wrapped)
    .replace(/^(?!<[a-z])((?!^\s*$).+)$/gm, '<p class="text-slate-300 leading-relaxed mb-3">$1</p>')
    // Wrap table rows in table
    .replace(/(<tr>[\s\S]*?<\/tr>\n?)+/g, '<div class="overflow-x-auto my-4"><table class="w-full border-collapse rounded-lg overflow-hidden">$&</table></div>')
}

export function LegalPage() {
  const { docId } = useParams<{ docId: string }>()
  const [activeDoc, setActiveDoc] = useState<LegalDoc | null>(null)

  useEffect(() => {
    if (docId) {
      const doc = LEGAL_DOCS.find(d => d.id === docId)
      setActiveDoc(doc || null)
    } else {
      setActiveDoc(null)
    }
  }, [docId])

  // Index view — list all legal documents
  if (!activeDoc) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Legal & Compliance</h1>
          <p className="text-slate-400">Review our policies, terms, and security documentation</p>
        </div>

        <div className="grid gap-4">
          {LEGAL_DOCS.map(doc => (
            <Link
              key={doc.id}
              to={`/legal/${doc.id}`}
              className="group bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/30 hover:bg-slate-800/70 transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                    {doc.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {doc.title}
                    </h2>
                    <p className="text-sm text-slate-400">{doc.description}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-blue-400 transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Document view
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-400 mb-8">
        <Link to="/legal" className="hover:text-blue-400 transition-colors">Legal</Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-white">{activeDoc.title}</span>
      </nav>

      {/* Document content */}
      <article
        className="prose prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: renderMarkdown(activeDoc.content) }}
      />

      {/* Back link */}
      <div className="mt-12 pt-6 border-t border-slate-700">
        <Link
          to="/legal"
          className="text-blue-400 hover:text-blue-300 text-sm transition-colors"
        >
          ← Back to Legal & Compliance
        </Link>
      </div>
    </div>
  )
}
