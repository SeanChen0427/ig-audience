import { useState } from 'react'
import { fetchInstagramPosts, extractUsername } from '../api/apify'

export default function AccountCard({ account, onChange, onRemove, showRemove, apifyKey, label, isOwn }) {
  const [mode, setMode] = useState('manual') // 'manual' | 'auto'
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')

  const update = (field, value) => onChange({ ...account, [field]: value })

  const handleAutoFetch = async () => {
    if (!account.igUrl) {
      setFetchError('請先填入 IG 網址')
      return
    }
    if (!apifyKey) {
      setFetchError('請先在「進階設定」填入 Apify API Key')
      return
    }
    setFetching(true)
    setFetchError('')
    try {
      const result = await fetchInstagramPosts(account.igUrl, apifyKey)
      const username = extractUsername(account.igUrl)
      onChange({ ...account, rawData: result.rawData, bio: result.bio || account.bio, username: account.username || username })
    } catch (e) {
      const msg = e.message || ''
      if (msg.includes('NO_APIFY_KEY')) setFetchError('請先在「進階設定」填入 Apify API Key')
      else if (msg.includes('APIFY_TIMEOUT')) setFetchError('抓取逾時，請稍後再試或改用手動模式')
      else if (msg.includes('APIFY_RUN_FAILED')) setFetchError('Apify 執行失敗，請確認帳號為公開帳號')
      else setFetchError(`抓取失敗：${msg.slice(0, 80)}`)
    } finally {
      setFetching(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="font-semibold text-slate-700 text-sm">{label}</span>
        {showRemove && (
          <button onClick={onRemove} className="text-slate-400 hover:text-red-400 text-sm transition-colors">
            移除
          </button>
        )}
      </div>

      {/* 資料來源切換 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode('manual')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'manual'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          手動貼入
        </button>
        <button
          onClick={() => setMode('auto')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
            mode === 'auto'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          自動抓取（需 Apify Key）
        </button>
      </div>

      {/* 帳號資訊 */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-slate-500 mb-1">
            {mode === 'auto' ? 'IG 網址' : '帳號名稱'}
            {isOwn && <span className="text-red-400 ml-1">*</span>}
          </label>
          {mode === 'auto' ? (
            <input
              type="text"
              placeholder="https://www.instagram.com/帳號名/"
              value={account.igUrl || ''}
              onChange={e => update('igUrl', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          ) : (
            <input
              type="text"
              placeholder="帳號名稱（不含 @）"
              value={account.username || ''}
              onChange={e => update('username', e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
            />
          )}
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">追蹤數（選填）</label>
          <input
            type="text"
            placeholder="例：1,200"
            value={account.followers || ''}
            onChange={e => update('followers', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
          />
        </div>
      </div>

      {/* 自動抓取按鈕 */}
      {mode === 'auto' && (
        <div className="mb-3">
          <button
            onClick={handleAutoFetch}
            disabled={fetching}
            className="w-full py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {fetching ? '抓取中，約需 30–60 秒...' : '點此自動抓取貼文資料'}
          </button>
          {fetchError && <p className="text-red-500 text-xs mt-1">{fetchError}</p>}
          {fetching && (
            <p className="text-slate-400 text-xs mt-1">正在從 Instagram 抓取最近 12 則貼文...</p>
          )}
        </div>
      )}

      {/* Bio */}
      <div className="mb-3">
        <label className="block text-xs text-slate-500 mb-1">Bio 個人簡介（選填）</label>
        <input
          type="text"
          placeholder="直接複製 IG 個人頁的 Bio 文字貼入"
          value={account.bio || ''}
          onChange={e => update('bio', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
        />
      </div>

      {/* 貼文資料 */}
      <div>
        <label className="block text-xs text-slate-500 mb-1">
          貼文觀察資料
          {mode === 'manual' && <span className="text-red-400 ml-1">*</span>}
        </label>
        {mode === 'manual' && (
          <p className="text-xs text-slate-400 mb-2">
            到 IG 查看這個帳號最近 10 則貼文，把你觀察到的內容貼在這裡。格式不限，例如：<br />
            <span className="text-slate-500">貼文1：教做咖哩飯，讚 3200，留言 87，週三晚上 8 點</span>
          </p>
        )}
        <textarea
          rows={mode === 'auto' && account.rawData ? 6 : 5}
          placeholder={mode === 'auto' ? '自動抓取後資料會顯示在這裡，也可以手動補充或修改' : '貼文1：...\n貼文2：...'}
          value={account.rawData || ''}
          onChange={e => update('rawData', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-y min-h-[120px]"
        />
      </div>
    </div>
  )
}
