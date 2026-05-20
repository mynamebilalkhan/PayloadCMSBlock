import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

/**
 * POST /api/admin/ai-translate
 *
 * Translates extracted content strings using Gemini 2.5 Flash.
 * Only translates user-facing content — never schemas, slugs, IDs, or config.
 *
 * Body: {
 *   sourceLocale: string        // e.g. "en"
 *   targetLocale: string        // e.g. "ar"
 *   content: Record<string, string>  // { path: sourceText }
 * }
 *
 * Returns: { translated: Record<string, string> }
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await req.json()) as {
      sourceLocale?: string
      targetLocale?: string
      content?: Record<string, string>
    }

    const { sourceLocale, targetLocale, content } = body

    if (!sourceLocale || !targetLocale) {
      return NextResponse.json(
        { error: 'sourceLocale and targetLocale are required' },
        { status: 400 },
      )
    }

    if (!content || typeof content !== 'object' || Object.keys(content).length === 0) {
      return NextResponse.json({ error: 'content object is required and must not be empty' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'GEMINI_API_KEY is not configured' }, { status: 500 })
    }

    if (sourceLocale === targetLocale) {
      return NextResponse.json({ translated: content })
    }

    // Build a stable key list so index order is predictable
    const keys = Object.keys(content)
    const inputMap: Record<string, string> = {}
    keys.forEach((k) => {
      inputMap[k] = content[k]
    })

    const prompt = buildPrompt(sourceLocale, targetLocale, inputMap)

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
      },
    )

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      console.error('[ai-translate] Gemini API error:', errText)
      return NextResponse.json(
        { error: `Gemini API returned ${geminiRes.status}` },
        { status: 502 },
      )
    }

    const geminiData = (await geminiRes.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> }
      }>
    }

    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    const translated = safeParseTranslations(rawText, keys)

    if (!translated) {
      console.error('[ai-translate] Failed to parse Gemini response:', rawText)
      return NextResponse.json(
        { error: 'AI returned an unparseable response. Please retry.' },
        { status: 502 },
      )
    }

    return NextResponse.json({ translated })
  } catch (err) {
    console.error('[ai-translate]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPrompt(
  sourceLocale: string,
  targetLocale: string,
  content: Record<string, string>,
): string {
  const contentJson = JSON.stringify(content, null, 2)
  return `You are a professional translator. Translate the values in the following JSON object from "${sourceLocale}" to "${targetLocale}".

Rules:
- Translate only the VALUES, not the keys.
- Preserve all formatting, HTML tags, punctuation, and whitespace exactly as-is.
- Do not translate URLs, email addresses, code snippets, proper nouns that should stay in source, or values that are already in the target language.
- Return ONLY a valid JSON object with the same keys and translated values. No markdown, no code fences, no extra text.

Input:
${contentJson}

Output (JSON only):`
}

/**
 * Safely parses the Gemini response text into a Record<string, string>.
 * Handles cases where the model wraps output in markdown code fences or adds extra text.
 */
function safeParseTranslations(
  raw: string,
  expectedKeys: string[],
): Record<string, string> | null {
  if (!raw || !raw.trim()) return null

  // Strip markdown code fences if present
  let cleaned = raw.trim()
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }

  // Find first { and last } to extract JSON object
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1 || end <= start) return null

  const jsonStr = cleaned.slice(start, end + 1)

  let parsed: unknown
  try {
    parsed = JSON.parse(jsonStr)
  } catch {
    return null
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return null

  const result: Record<string, string> = {}
  const parsedObj = parsed as Record<string, unknown>

  // Accept only expected keys with string values; fall back to empty string for missing
  for (const key of expectedKeys) {
    const val = parsedObj[key]
    result[key] = typeof val === 'string' ? val : ''
  }

  return result
}
