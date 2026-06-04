import { useState } from 'react'
const InstagramIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
  </svg>
)
const FacebookIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
  </svg>
)
const ThreadsIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M8 12h8M12 8v8"/>
  </svg>
)
const LineIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 11.5c0-4.3-4.3-7.8-9.6-7.8S1.8 7.2 1.8 11.5c0 3.9 3.4 7.1 8 7.7.3.1.7.2.8.5.1.3.1.6 0 .9l-.1.8c0 .2-.2.9.8.5s5.4-3.2 7.4-5.5c1.3-1.5 2-3.1 2-4.9z"/>
  </svg>
)
import InputForm from './components/InputForm'
import AnalysisResult from './components/AnalysisResult'
import { analyzeAudience, parseAnalysisResult } from './api/gemini'
import './index.css'

const emptyAccount = () => ({ username: '', followers: '', rawData: '', igUrl: '' })

const SocialLink = ({ href, icon: IconComp, label, colorClass }) => (
  <a href={href} target="_blank" rel="noopener noreferrer"
    className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-600 transition-all duration-300 shadow-sm font-bold text-sm ${colorClass}`}>
    <IconComp size={20} />
    {label}
  </a>
)

export default function App() {
  const [phase, setPhase] = useState('input')
  const [result, setResult] = useState(null)
  const [apiError, setApiError] = useState('')

  // 表單狀態提升到 App，切換 phase 時不會流失
  const [myAccount, setMyAccount] = useState(emptyAccount())
  const [competitors, setCompetitors] = useState([emptyAccount()])
  const [userContext, setUserContext] = useState({ industry: '', goal: '' })
  const [apifyKey, setApifyKey] = useState(() => localStorage.getItem('apify_key') || '')

  const handleSubmit = async (accountData, competitorsData, contextData) => {
    setPhase('loading')
    setApiError('')
    try {
      const raw = await analyzeAudience(accountData, competitorsData, contextData)
      const parsed = parseAnalysisResult(raw)
      setResult(parsed)
      setPhase('result')
    } catch (e) {
      const msg = e.message || ''
      if (msg === 'NO_API_KEY') {
        setApiError('請先在「進階設定」填入 Gemini API Key 才能開始分析')
      } else if (msg.startsWith('API_ERROR:')) {
        const parts = msg.split(':')
        const status = parts[1]
        const detail = parts.slice(2).join(':')
        if (status === '400') setApiError(`API Key 格式有誤，請重新確認。${detail ? '詳細：' + detail : ''}`)
        else if (status === '403') setApiError('API Key 無效或沒有權限，請確認 Key 是否正確')
        else if (status === '429') setApiError('Gemini 使用量已達上限，請稍後再試')
        else if (status === 'empty') setApiError(`Gemini 回傳空白內容（${detail}），請稍後再試`)
        else setApiError(`分析暫時無法進行（${status}），請稍後再試${detail ? '：' + detail : ''}`)
      } else {
        setApiError(`發生錯誤，請稍後再試：${msg.slice(0, 150)}`)
      }
      setPhase('input')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-2xl space-y-6">

        {/* Header */}
        <div className="text-center space-y-4 mb-8">
          <div className="inline-flex items-center justify-center mb-2">
            <img
              src="https://i.ibb.co/35mStRnx/Gemini-Generated-Image-8xg52z8xg52z8xg5.jpg"
              alt="熊恩Sean Logo"
              className="w-24 h-24 rounded-full shadow-lg object-cover border-4 border-white"
            />
          </div>
          <div>
            <span className="text-xs font-black text-indigo-700 tracking-widest bg-indigo-100 inline-block px-4 py-1.5 rounded-full uppercase">
              熊恩Sean 社群經營 x AI實戰 課程專屬
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight">
            IG 受眾分析工具
          </h1>
          <p className="text-slate-500 max-w-md mx-auto text-sm md:text-base whitespace-nowrap">
            輸入你的帳號與 1–3 個目標競品，AI 幫你找出差距與具體改善方向
          </p>
        </div>

        {/* API 錯誤提示 */}
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
            {apiError}
          </div>
        )}

        {/* 載入中 */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl shadow-sm border border-slate-100">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-5" />
            <p className="text-slate-700 font-bold mb-2">正在分析受眾偏好</p>
            <p className="text-slate-400 text-sm">約需 15–30 秒，請稍候...</p>
          </div>
        )}

        {/* 輸入介面 — 保持掛載，只用 hidden 隱藏，狀態不流失 */}
        <div className={phase !== 'input' ? 'hidden' : ''}>
          <InputForm
            myAccount={myAccount}
            setMyAccount={setMyAccount}
            competitors={competitors}
            setCompetitors={setCompetitors}
            userContext={userContext}
            setUserContext={setUserContext}
            apifyKey={apifyKey}
            setApifyKey={setApifyKey}
            onSubmit={handleSubmit}
          />
        </div>

        {/* 結果頁面 */}
        {phase === 'result' && result && (
          <AnalysisResult result={result} onReset={() => setPhase('input')} />
        )}

        {/* Footer */}
        <div className="mt-16 pt-10 border-t border-slate-200/60 flex flex-col items-center space-y-10 pb-12">
          <div className="flex flex-col items-center space-y-6">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Connect with Sean</p>
            <div className="flex flex-wrap justify-center gap-4">
              <SocialLink href="https://www.instagram.com/c.ksean" icon={InstagramIcon} label="Instagram" colorClass="hover:text-pink-600 hover:bg-pink-50 hover:border-pink-200" />
              <SocialLink href="https://www.facebook.com/profile.php?id=61577505264423" icon={FacebookIcon} label="Facebook" colorClass="hover:text-blue-600 hover:bg-blue-50 hover:border-blue-200" />
              <SocialLink href="https://www.threads.com/@c.ksean" icon={ThreadsIcon} label="Threads" colorClass="hover:text-black hover:bg-slate-100 hover:border-slate-300" />
              <SocialLink href="https://lin.ee/oDg90C1" icon={LineIcon} label="LINE" colorClass="hover:text-green-600 hover:bg-green-50 hover:border-green-200" />
            </div>
          </div>
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            © 熊恩Sean • AI 實戰教學系列工具
          </p>
        </div>

      </div>
    </div>
  )
}
