import { useState } from 'react'
import AccountCard from './AccountCard'
import AdvancedSettings from './AdvancedSettings'

const emptyAccount = () => ({ username: '', followers: '', rawData: '', igUrl: '' })

export default function InputForm({
  myAccount, setMyAccount,
  competitors, setCompetitors,
  userContext, setUserContext,
  apifyKey, setApifyKey,
  onSubmit,
}) {
  const [error, setError] = useState('')

  const addCompetitor = () => {
    if (competitors.length < 3) setCompetitors([...competitors, emptyAccount()])
  }

  const removeCompetitor = (i) => {
    setCompetitors(competitors.filter((_, idx) => idx !== i))
  }

  const updateCompetitor = (i, val) => {
    const next = [...competitors]
    next[i] = val
    setCompetitors(next)
  }

  const validate = () => {
    if (!myAccount.username && !myAccount.igUrl) return '請填入你自己的 IG 帳號名稱或網址'
    if (!myAccount.rawData) return '請填入你自己帳號的貼文觀察資料'
    const valid = competitors.filter(c => (c.username || c.igUrl) && c.rawData)
    if (valid.length === 0) return '請至少填入一個目標競品帳號的貼文資料'
    return ''
  }

  const handleSubmit = () => {
    const err = validate()
    if (err) { setError(err); return }
    setError('')
    onSubmit(myAccount, competitors, userContext)
  }

  return (
    <div className="space-y-6">
      {/* 說明文字 */}
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-5">
        <h2 className="font-semibold text-indigo-900 mb-2 text-base">使用說明</h2>
        <ol className="text-sm text-indigo-800 space-y-1 list-decimal list-inside leading-relaxed">
          <li>填入你自己的 IG 帳號與最近 10 則貼文的觀察紀錄</li>
          <li>再填入 1–3 個你想參考的同業帳號（也要填貼文資料）</li>
          <li>按下「開始分析」，AI 幫你找出差距與具體改善方向</li>
        </ol>
        <p className="text-xs text-indigo-600 mt-3">
          親自去翻貼文、記錄資料，這個過程本身就是在訓練你的 IG 判斷力。
        </p>
      </div>

      {/* 我的帳號 */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">我的帳號</h3>
        <AccountCard
          account={myAccount}
          onChange={setMyAccount}
          showRemove={false}
          apifyKey={apifyKey}
          label="我的 IG 帳號"
          isOwn={true}
        />
      </div>

      {/* 自身情境 */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-700 mb-4 text-sm">帳號情境（選填，填了分析更準確）</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">產業類別</label>
            <input
              type="text"
              placeholder="例：美食、健身教練、手作飾品"
              value={userContext.industry}
              onChange={e => setUserContext({ ...userContext, industry: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">你的目標</label>
            <input
              type="text"
              placeholder="例：半年內漲到 1000 粉、增加接案詢問"
              value={userContext.goal}
              onChange={e => setUserContext({ ...userContext, goal: e.target.value })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          </div>
        </div>
      </div>

      {/* 目標競品帳號 */}
      <div>
        <h3 className="font-semibold text-slate-800 mb-3">目標競品帳號</h3>
        <div className="space-y-4">
          {competitors.map((c, i) => (
            <AccountCard
              key={i}
              account={c}
              onChange={val => updateCompetitor(i, val)}
              onRemove={() => removeCompetitor(i)}
              showRemove={competitors.length > 1}
              apifyKey={apifyKey}
              label={`競品帳號 ${i + 1}`}
              isOwn={false}
            />
          ))}
        </div>
        {competitors.length < 3 && (
          <button
            onClick={addCompetitor}
            className="mt-3 w-full py-3 border-2 border-dashed border-slate-300 text-slate-500 rounded-2xl text-sm hover:border-indigo-300 hover:text-indigo-500 transition-colors"
          >
            ＋ 新增競品帳號（最多 3 個）
          </button>
        )}
      </div>

      {/* 進階設定 */}
      <AdvancedSettings apifyKey={apifyKey} onApifyKeyChange={setApifyKey} />

      {/* 錯誤提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {/* 送出按鈕 */}
      <button
        onClick={handleSubmit}
        className="w-full py-4 bg-indigo-600 text-white font-semibold rounded-2xl text-base hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200"
      >
        開始分析受眾偏好
      </button>
    </div>
  )
}
