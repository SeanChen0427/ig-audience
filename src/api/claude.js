import { SYSTEM_PROMPT, buildAnalysisPrompt } from '../prompts/audience-analysis'

export async function analyzeAudience(myAccount, competitors, userContext) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('NO_API_KEY')
  }

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [
        { role: 'user', content: buildAnalysisPrompt(myAccount, competitors, userContext) }
      ]
    })
  })

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    throw new Error(`API_ERROR:${response.status}:${err?.error?.message || ''}`)
  }

  const data = await response.json()
  return data.content[0].text
}

export function parseAnalysisResult(rawText) {
  const sections = {}
  const sectionRegex = /---SECTION:(\S+)---\n([\s\S]*?)(?=---SECTION:|$)/g
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
