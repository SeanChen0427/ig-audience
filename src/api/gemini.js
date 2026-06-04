import { SYSTEM_PROMPT, buildAnalysisPrompt } from '../prompts/audience-analysis'

// 自動從帳號可用 model 中選最適合的 flash 模型
async function resolveModel(apiKey) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
  )
  if (!res.ok) throw new Error(`API_ERROR:${res.status}:無法取得模型列表`)

  const data = await res.json()
  const models = (data.models || [])
    .map(m => m.name.replace('models/', ''))
    .filter(n => n.includes('flash') && !n.includes('lite') && !n.includes('tts') && !n.includes('audio') && !n.includes('live'))

  // 優先選 2.5 flash，其次 2.0，再其次任何 flash
  const preferred = [
    models.find(n => n.startsWith('gemini-2.5-flash') && !n.includes('preview') === false),
    models.find(n => n.startsWith('gemini-2.5-flash')),
    models.find(n => n.startsWith('gemini-2.0-flash')),
    models.find(n => n.startsWith('gemini-flash')),
    models[0],
  ].find(Boolean)

  if (!preferred) throw new Error('API_ERROR:no_model:找不到可用的 Gemini 模型')
  return preferred
}

export async function analyzeAudience(myAccount, competitors, userContext) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    || localStorage.getItem('gemini_key')

  if (!apiKey) throw new Error('NO_API_KEY')

  const model = await resolveModel(apiKey)
  const prompt = buildAnalysisPrompt(myAccount, competitors, userContext)

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 16384, temperature: 0.7 },
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    const msg = err?.error?.message || JSON.stringify(err).slice(0, 200)
    throw new Error(`API_ERROR:${response.status}:${msg}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason || '無回應'
    throw new Error(`API_ERROR:empty:${reason}`)
  }
  console.log('[Gemini finish]', data.candidates?.[0]?.finishReason, '| tokens:', data.usageMetadata?.candidatesTokenCount)
  console.log('[Gemini tail]', text.slice(-300))
  return text
}

export function parseAnalysisResult(rawText) {
  const sections = {}
  // 支援任意數量的破折號，例如 ---、----、-----
  const sectionRegex = /<<<SECTION:([^>]+)>>>\s*\n([\s\S]*?)(?=<<<SECTION:|$)/g
  let match
  while ((match = sectionRegex.exec(rawText)) !== null) {
    sections[match[1]] = match[2].trim()
  }
  return {
    自己: sections['自己'] || '',
    解碼: sections['解碼'] || '',
    差距: sections['差距'] || '',
    話術: sections['話術'] || '',
    行動: sections['行動'] || '',
  }
}
