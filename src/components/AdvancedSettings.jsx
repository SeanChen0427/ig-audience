import { useState, useEffect } from 'react'

export default function AdvancedSettings({ apifyKey, onApifyKeyChange }) {
  const [open, setOpen] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [apifyLocal, setApifyLocal] = useState(apifyKey || '')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const gKey = localStorage.getItem('gemini_key')
    if (gKey) setGeminiKey(gKey)
    setApifyLocal(apifyKey || '')
  }, [apifyKey])

  // 進入頁面沒有 Gemini Key 時自動展開
  useEffect(() => {
    if (!localStorage.getItem('gemini_key')) setOpen(true)
  }, [])

  const handleSave = () => {
    if (geminiKey.trim()) localStorage.setItem('gemini_key', geminiKey.trim())
    if (apifyLocal.trim()) {
      localStorage.setItem('apify_key', apifyLocal.trim())
      onApifyKeyChange(apifyLocal.trim())
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    setOpen(false)
  }

  const hasGeminiKey = !!localStorage.getItem('gemini_key')

  return (
    <div className="border border-slate-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-700 text-sm">進階設定</span>
          {!hasGeminiKey && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">
              需填入 API Key
            </span>
          )}
          {hasGeminiKey && (
            <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full font-medium">
              已設定
            </span>
          )}
        </div>
        <span className="text-slate-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-5 bg-white space-y-5">

          {/* Gemini API Key */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-semibold text-slate-700">Gemini API Key</label>
              <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">必填</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              AI 分析功能需要 Gemini API Key。Google 提供免費額度，有 Gmail 帳號就能申請。
            </p>

            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 mb-3 space-y-2">
              <p className="text-xs font-bold text-indigo-800">三步驟取得免費 Key：</p>
              <ol className="text-xs text-indigo-700 space-y-1.5 list-decimal list-inside">
                <li>
                  前往
                  <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer"
                    className="underline font-bold mx-1 hover:text-indigo-900">
                    Google AI Studio
                  </a>
                  （用 Gmail 登入）
                </li>
                <li>點擊「Create API key」</li>
                <li>複製產生的 Key，貼到下方</li>
              </ol>
            </div>

            <input
              type="password"
              placeholder="AIza..."
              value={geminiKey}
              onChange={e => setGeminiKey(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>

          {/* Apify API Key */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 mb-1">
              <label className="text-sm font-semibold text-slate-700">Apify API Key</label>
              <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">選填，自動抓取用</span>
            </div>
            <p className="text-xs text-slate-500 mb-3 leading-relaxed">
              填入後可直接貼 IG 網址自動抓取貼文，不需手動複製。
            </p>

            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 mb-3 space-y-2">
              <p className="text-xs font-bold text-slate-700">取得 Apify Key：</p>
              <ol className="text-xs text-slate-600 space-y-1.5 list-decimal list-inside">
                <li>
                  前往
                  <a href="https://console.apify.com/sign-up" target="_blank" rel="noopener noreferrer"
                    className="underline font-bold text-indigo-500 mx-1 hover:text-indigo-700">
                    Apify 免費註冊
                  </a>
                </li>
                <li>
                  登入後進
                  <a href="https://console.apify.com/settings/integrations" target="_blank" rel="noopener noreferrer"
                    className="underline font-bold text-indigo-500 mx-1 hover:text-indigo-700">
                    Settings → Integrations
                  </a>
                </li>
                <li>複製 Personal API token 貼到下方</li>
              </ol>
            </div>

            <input
              type="password"
              placeholder="apify_api_..."
              value={apifyLocal}
              onChange={e => setApifyLocal(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 font-mono"
            />
          </div>

          <button
            onClick={handleSave}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl text-sm hover:bg-indigo-700 transition-colors"
          >
            {saved ? '已儲存！' : '儲存設定'}
          </button>
        </div>
      )}
    </div>
  )
}
