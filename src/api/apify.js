const ACTOR_POSTS = 'apify~instagram-scraper'
const ACTOR_REELS = 'apify~instagram-reel-scraper'

export async function fetchInstagramPosts(igUrl, apifyKey) {
  if (!apifyKey) throw new Error('NO_APIFY_KEY')

  const igUsername = extractUsername(igUrl)
  const profileUrl = `https://www.instagram.com/${igUsername}/`

  // 同時跑 posts + reels 兩個 run
  const [postsRun, reelsRun] = await Promise.all([
    startRun(profileUrl, igUsername, 9, apifyKey, ACTOR_POSTS),
    startRun(profileUrl, igUsername, 9, apifyKey, ACTOR_REELS),
  ])

  // 同時等兩個 run 完成
  const [postsDatasetId, reelsDatasetId] = await Promise.all([
    waitForRun(postsRun, apifyKey),
    waitForRun(reelsRun, apifyKey),
  ])

  // 同時抓兩份資料
  const [postsItems, reelsItems] = await Promise.all([
    fetchDataset(postsDatasetId, apifyKey, 9),
    fetchDataset(reelsDatasetId, apifyKey, 9),
  ])

  // 合併並去重（用 shortCode 或 url 判斷）
  const seen = new Set()
  const allItems = [...reelsItems, ...postsItems].filter(item => {
    const key = item.shortCode || item.shortcode || item.id || item.url
    if (!key || seen.has(key)) return false
    seen.add(key)
    return true
  })

  // reel scraper 通常不帶 bio，優先從 posts 抓
  const bioSource = [...postsItems, ...reelsItems].find(
    item => item.biography || item.bio || item.ownerBiography
      || item.owner?.biography || item.parentData?.biography
  ) || {}
  const bio = bioSource.biography || bioSource.bio || bioSource.ownerBiography
    || bioSource.owner?.biography || bioSource.parentData?.biography || ''

  return { rawData: formatApifyPosts(allItems, igUsername), bio }
}

async function startRun(profileUrl, igUsername, limit, apifyKey, actorId = ACTOR_POSTS) {
  const body = actorId === ACTOR_REELS
    ? { username: [igUsername], resultsLimit: limit }
    : { directUrls: [profileUrl], resultsType: 'posts', resultsLimit: limit, addParentData: true }

  const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/runs?token=${apifyKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`APIFY_RUN_ERROR:${res.status}:${err?.error?.message || ''}`)
  }
  const run = await res.json()
  const runId = run.data?.id
  if (!runId) throw new Error('APIFY_NO_RUN_ID')
  return runId
}

async function fetchDataset(datasetId, apifyKey, limit) {
  const res = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apifyKey}&limit=${limit}`
  )
  if (!res.ok) throw new Error(`APIFY_DATASET_ERROR:${res.status}`)
  return await res.json()
}

async function waitForRun(runId, apifyKey, maxWaitMs = 90000) {
  const start = Date.now()
  while (Date.now() - start < maxWaitMs) {
    await sleep(3000)
    const res = await fetch(`https://api.apify.com/v2/actor-runs/${runId}?token=${apifyKey}`)
    const data = await res.json()
    const status = data.data?.status
    if (status === 'SUCCEEDED') return data.data.defaultDatasetId
    if (status === 'FAILED' || status === 'ABORTED') {
      throw new Error(`APIFY_RUN_${status}`)
    }
  }
  throw new Error('APIFY_TIMEOUT')
}

function getViewCount(item) {
  // videoPlayCount 是 IG 顯示的播放數，通常最接近實際觀看數
  const candidates = [
    item.videoPlayCount,
    item.videoViewCount,
    item.playCount,
    item.playsCount,
    item.viewsCount,
    item.views,
  ].filter(v => typeof v === 'number' && v > 0)
  return candidates.length ? Math.max(...candidates) : 0
}

function getItemType(item) {
  if (item.type === 'Video' || item.productType === 'clips' || item.isVideo || getViewCount(item) > 0) return 'Reels'
  if (item.type === 'Sidecar' || item.images?.length > 1 || item.childPosts?.length > 1) return '輪播'
  return '靜態圖'
}

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六']

function formatApifyPosts(items, username) {
  if (!items?.length) return '（未取得貼文資料）'

  const reels = items.filter(i => getItemType(i) === 'Reels')
  const carousels = items.filter(i => getItemType(i) === '輪播')
  const statics = items.filter(i => getItemType(i) === '靜態圖')

  const followers = items.find(i => i.followersCount)?.followersCount || 0

  const engagementRate = (item) => {
    if (!followers) return null
    const rate = ((item.likesCount ?? 0) + (item.commentsCount ?? 0)) / followers * 100
    return rate.toFixed(2) + '%'
  }

  const avgEngagement = (arr) => {
    if (!followers || !arr.length) return 'N/A'
    const total = arr.reduce((s, i) => s + (i.likesCount ?? 0) + (i.commentsCount ?? 0), 0)
    return (total / arr.length / followers * 100).toFixed(2) + '%'
  }

  const summary = `【帳號基本資料】
追蹤者：${followers.toLocaleString()}
貼文總數（資料庫）：${items.find(i => i.postsCount)?.postsCount || 'N/A'}
抓取貼文數：${items.length} 則

【格式分佈與平均互動率】
- Reels：${reels.length} 則，平均互動率 ${avgEngagement(reels)}（平均讚 ${Math.round(reels.reduce((s,i)=>s+(i.likesCount??0),0)/Math.max(reels.length,1))}，平均留言 ${Math.round(reels.reduce((s,i)=>s+(i.commentsCount??0),0)/Math.max(reels.length,1))}）
- 輪播：${carousels.length} 則，平均互動率 ${avgEngagement(carousels)}
- 靜態圖：${statics.length} 則，平均互動率 ${avgEngagement(statics)}`

  const postList = items.map((item, i) => {
    const type = getItemType(item)
    const dt = item.timestamp ? new Date(item.timestamp) : null
    const date = dt ? `${dt.toLocaleDateString('zh-TW')}（週${WEEKDAYS[dt.getDay()]} ${dt.getHours()}:${String(dt.getMinutes()).padStart(2,'0')}）` : '?'
    const likes = item.likesCount ?? 0
    const comments = item.commentsCount ?? 0
    const er = engagementRate(item)
    const erStr = er ? `，互動率 ${er}` : ''
    const duration = item.videoDuration ? `，時長 ${Math.round(item.videoDuration)}s` : ''
    const pinned = item.isPinned ? '【釘選】' : ''
    const hook = (item.caption || '').split('\n')[0].slice(0, 100)
    const caption = (item.caption || '').slice(0, 300)
    const hashtags = item.hashtags?.length ? `標籤：${item.hashtags.join(' ')}` : ''
    const topComment = item.firstComment ? `熱門留言：${item.firstComment}` : ''

    return `---
貼文${i + 1} ${pinned}【${type}】${date}${duration}
讚 ${likes}，留言 ${comments}${erStr}
Hook：${hook}
文案：${caption}
${hashtags}
${topComment}`.trim()
  }).join('\n')

  return summary + '\n\n【逐則貼文】\n' + postList
}

export function extractUsername(input) {
  if (!input) return ''
  const match = input.match(/instagram\.com\/([^/?#\s]+)/)
  if (match) return match[1].replace(/\/$/, '')
  return input.replace(/^@/, '').replace(/\/$/, '').trim()
}

const sleep = ms => new Promise(r => setTimeout(r, ms))
