import { useState, useRef } from 'react'
import ReactMarkdown from 'react-markdown'

const TABS = [
  { key: '自己', label: '我的現況', icon: '🪞', color: 'indigo' },
  { key: '解碼', label: '競品成功解碼', icon: '🔍', color: 'violet' },
  { key: '差距', label: '差距分析', icon: '📊', color: 'orange' },
  { key: '話術', label: 'Hook 與話術', icon: '✍️', color: 'emerald' },
]

const COLOR = {
  indigo: { tab: 'bg-indigo-600 text-white', badge: 'bg-indigo-50 border-indigo-200 text-indigo-800', icon: 'bg-indigo-100 text-indigo-600' },
  violet: { tab: 'bg-violet-600 text-white', badge: 'bg-violet-50 border-violet-200 text-violet-800', icon: 'bg-violet-100 text-violet-600' },
  orange: { tab: 'bg-orange-500 text-white', badge: 'bg-orange-50 border-orange-200 text-orange-800', icon: 'bg-orange-100 text-orange-600' },
  emerald: { tab: 'bg-emerald-600 text-white', badge: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: 'bg-emerald-100 text-emerald-600' },
}

// 把 Markdown 文字中的 **粗體** 區塊解析為段落卡片
function parseBlocks(text) {
  if (!text) return []
  const blocks = []
  const lines = text.split('\n')
  let current = null
  let prevWasBlank = true // 起始視為空行

  for (const line of lines) {
    const headingMatch = line.match(/^\*\*(.+?)[:：]\*\*(.*)$/)
    const h2Match = line.match(/^##\s+(.+)/)
    const h3Match = line.match(/^###\s+(.+)/)
    const isBlank = !line.trim()

    if (h2Match || h3Match) {
      if (current) blocks.push(current)
      current = { type: 'section', title: (h2Match || h3Match)[1], lines: [] }
    } else if (headingMatch && prevWasBlank) {
      // 只有前面有空行時才開新卡，否則當作卡內子標題
      if (current) blocks.push(current)
      current = { type: 'block', title: headingMatch[1], lines: headingMatch[2] ? [headingMatch[2].trim()] : [] }
    } else if (headingMatch && !prevWasBlank) {
      // 同段落內的子標題：保留粗體格式放進當前卡
      if (!current) current = { type: 'block', title: '', lines: [] }
      const rest = headingMatch[2] ? ` ${headingMatch[2].trim()}` : ''
      current.lines.push(`**${headingMatch[1]}：**${rest}`)
    } else if (!isBlank) {
      if (!current) current = { type: 'block', title: '', lines: [] }
      current.lines.push(line)
    }

    prevWasBlank = isBlank
  }
  if (current) blocks.push(current)
  return blocks.filter(b => b.title || b.lines.length)
}

function BlockCard({ title, lines, color = 'indigo', icon }) {
  const blockIcon = icon || getBlockIcon(title)
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${COLOR[color]?.icon || 'bg-slate-100 text-slate-500'}`}>
            {blockIcon}
          </span>
          <span className="font-bold text-slate-800 text-sm">{title}</span>
        </div>
      )}
      <div className="text-sm text-slate-700 space-y-1.5 leading-relaxed">
        {lines.map((line, i) => {
          const listMatch = line.match(/^[-•*]\s+(.+)/) || line.match(/^\d+[.)]\s+(.+)/)
          if (listMatch) {
            return (
              <div key={i} className="flex gap-2">
                <span className="text-slate-400 mt-0.5 flex-shrink-0">▸</span>
                <span dangerouslySetInnerHTML={{ __html: renderInline(listMatch[1]) }} />
              </div>
            )
          }
          return line.trim() ? (
            <p key={i} dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
          ) : null
        })}
      </div>
    </div>
  )
}

function renderInline(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-slate-900">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 rounded text-xs">$1</code>')
}

function getBlockIcon(title = '') {
  if (title.includes('Bio')) return '📝'
  if (title.includes('優勢')) return '💪'
  if (title.includes('弱點') || title.includes('缺口')) return '⚠️'
  if (title.includes('目標')) return '🎯'
  if (title.includes('格式')) return '🎬'
  if (title.includes('主題')) return '💡'
  if (title.includes('Hook')) return '🪝'
  if (title.includes('節奏') || title.includes('發文')) return '📅'
  if (title.includes('差距')) return '📏'
  if (title.includes('複製') || title.includes('借鑒')) return '⭐'
  if (title.includes('話術') || title.includes('範本')) return '✍️'
  if (title.includes('成功')) return '🏆'
  if (title.includes('留言') || title.includes('CTA')) return '💬'
  return '•'
}

function TabContent({ text, color }) {
  const blocks = parseBlocks(text)
  if (!blocks.length) return <p className="text-slate-400 text-sm">（此部分無資料）</p>
  return (
    <div className="space-y-3">
      {blocks.map((block, i) => (
        block.type === 'section'
          ? <h3 key={i} className="font-bold text-slate-600 text-xs uppercase tracking-wider pt-2">{block.title}</h3>
          : <BlockCard key={i} title={block.title} lines={block.lines} color={color} />
      ))}
    </div>
  )
}

function ActionCard({ number, text, colors }) {
  const labels = ['今天就做', '本週完成', '下週開始']
  const labelColors = ['bg-red-100 text-red-700', 'bg-amber-100 text-amber-700', 'bg-green-100 text-green-700']
  return (
    <div className="bg-white border border-indigo-100 rounded-xl p-4 flex gap-3 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm flex-shrink-0">
        {number}
      </div>
      <div className="flex-1">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full mb-2 inline-block ${labelColors[number - 1] || 'bg-slate-100 text-slate-600'}`}>
          {labels[number - 1] || `第 ${number} 步`}
        </span>
        <p className="text-sm text-slate-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(text.replace(/^\d+[.)]\s*/, '')) }} />
      </div>
    </div>
  )
}

function parseActionItems(text) {
  if (!text) return []
  const lines = text.split('\n').filter(l => l.trim())
  const items = []
  let buffer = ''
  for (const line of lines) {
    const m = line.match(/^(\d+)[.)]\s+(.+)/)
    if (m) {
      if (buffer) items.push(buffer)
      buffer = line
    } else if (buffer) {
      buffer += ' ' + line.trim()
    }
  }
  if (buffer) items.push(buffer)
  return items.length ? items : lines.filter(l => l.match(/^\d+/))
}

export default function AnalysisResult({ result, onReset }) {
  const [activeTab, setActiveTab] = useState('自己')
  const [copied, setCopied] = useState({})
  const reportRef = useRef(null)

  const activeTabMeta = TABS.find(t => t.key === activeTab)

  const handleCopy = async (key) => {
    await navigator.clipboard.writeText(result[key] || '')
    setCopied(prev => ({ ...prev, [key]: true }))
    setTimeout(() => setCopied(prev => ({ ...prev, [key]: false })), 2000)
  }

  const handleDownloadPDF = () => {
    window.print()
  }

  const actionItems = parseActionItems(result.行動)

  return (
    <div className="space-y-5">
      {/* 標題列 */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-800">分析結果</h2>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
          >
            ⬇ 下載 PDF 報告
          </button>
          <button onClick={onReset} className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
            重新分析
          </button>
        </div>
      </div>

      {/* PDF 輸出範圍 */}
      <div ref={reportRef} className="space-y-5">

        {/* Tabs（螢幕顯示） */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto no-print">
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 whitespace-nowrap py-2 px-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1 ${
                activeTab === tab.key ? COLOR[tab.color].tab + ' shadow-sm' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 螢幕：顯示當前 Tab */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 min-h-[300px] no-print">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-lg">{activeTabMeta?.icon}</span>
              <span className="font-bold text-slate-800">{activeTabMeta?.label}</span>
            </div>
            <button onClick={() => handleCopy(activeTab)} className="text-xs text-slate-400 hover:text-slate-600">
              {copied[activeTab] ? '✓ 已複製' : '複製內容'}
            </button>
          </div>
          <TabContent text={result[activeTab]} color={activeTabMeta?.color} />
        </div>

        {/* 列印：所有 Tab 全部展開 */}
        <div className="hidden print:block space-y-6">
          {TABS.map(tab => (
            <div key={tab.key}>
              <div className="flex items-center gap-2 mb-3 border-b border-slate-200 pb-2">
                <span>{tab.icon}</span>
                <span className="font-bold text-slate-800">{tab.label}</span>
              </div>
              <TabContent text={result[tab.key]} color={tab.color} />
            </div>
          ))}
        </div>

        {/* 本週行動清單 */}
        {actionItems.length > 0 && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-lg">🚀</span>
                <span className="font-bold text-indigo-900">本週第一步行動清單</span>
              </div>
              <button onClick={() => handleCopy('行動')} className="text-xs text-indigo-400 hover:text-indigo-600">
                {copied['行動'] ? '✓ 已複製' : '複製'}
              </button>
            </div>
            <div className="space-y-3">
              {actionItems.map((item, i) => (
                <ActionCard key={i} number={i + 1} text={item} />
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
