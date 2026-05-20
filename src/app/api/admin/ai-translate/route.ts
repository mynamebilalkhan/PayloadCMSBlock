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
      sourceLocale?: string | number
      targetLocale?: string | number
      content?: Record<string, string>
    }

    const { content, sourceLocale, targetLocale } = body

    if (
      sourceLocale === undefined || sourceLocale === null || sourceLocale === '' ||
      targetLocale === undefined || targetLocale === null || targetLocale === ''
    ) {
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

    // ── Resolve locale codes + names ─────────────────────────────────────────
    const resolveLocale = async (
      value: string | number,
    ): Promise<{ code: string; name: string }> => {
      const isId =
        typeof value === 'number' ||
        (typeof value === 'string' && /^\d+$/.test(value))

      if (isId) {
        const doc = await payload.findByID({
          collection: 'locales',
          id: typeof value === 'number' ? value : parseInt(value, 10),
          depth: 0,
        })
        const d = doc as unknown as { code?: string; name?: string }
        if (!d.code) throw new Error(`Locale ID ${value} has no code`)
        return { code: d.code, name: d.name ?? d.code }
      }

      // It's already a code string — look up the name from DB
      const result = await payload.find({
        collection: 'locales',
        where: { code: { equals: String(value) } },
        limit: 1,
        depth: 0,
      })
      const doc = result.docs[0] as unknown as { code?: string; name?: string } | undefined
      return { code: String(value), name: doc?.name ?? String(value) }
    }

    let resolvedSource: { code: string; name: string }
    let resolvedTarget: { code: string; name: string }

    try {
      ;[resolvedSource, resolvedTarget] = await Promise.all([
        resolveLocale(sourceLocale),
        resolveLocale(targetLocale),
      ])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to resolve locales'
      return NextResponse.json({ error: msg }, { status: 400 })
    }

    console.log(
      `[ai-translate] ${resolvedSource.code} (${resolvedSource.name}) → ${resolvedTarget.code} (${resolvedTarget.name}) | ${Object.keys(content).length} strings`,
    )

    if (resolvedSource.code === resolvedTarget.code) {
      return NextResponse.json({ translated: content })
    }

    // Build a stable key list so index order is predictable
    const keys = Object.keys(content)
    const inputMap: Record<string, string> = {}
    keys.forEach((k) => {
      inputMap[k] = content[k]
    })

    const translated = await translateContentInBatches(
      resolvedSource,
      resolvedTarget,
      inputMap,
      keys,
      apiKey,
    )

    return NextResponse.json({
      translated,
      debug: {
        sourceLocale: resolvedSource,
        targetLocale: resolvedTarget,
        stringCount: keys.length,
      },
    })
  } catch (err) {
    console.error('[ai-translate]', err)
    if (err instanceof GeminiApiError) {
      return NextResponse.json({ error: err.message }, { status: err.statusCode })
    }
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildPrompt(
  source: { code: string; name: string },
  target: { code: string; name: string },
  content: Record<string, string>,
): string {
  const contentJson = JSON.stringify(content, null, 2)
  return `Translate the following JSON values from ${source.name} to ${target.name}.

IMPORTANT: Every value in the output MUST be written in ${target.name}. This is a translation task — do NOT copy the source text.

Rules:
1. Keep every JSON key exactly as-is.
2. Replace every JSON value with its ${target.name} translation.
3. Preserve HTML tags, URLs, email addresses, and file paths verbatim.
4. Output ONLY the JSON object. No markdown, no explanation, no extra text.

Input (${source.name}):
${contentJson}

Output (${target.name}):`
}

// ─── Batching (reduces rate-limit spikes on large pages) ─────────────────────

/** Max strings per Gemini request; smaller batches lower 429 risk. */
const TRANSLATE_BATCH_SIZE = 8
/** Pause between batch requests (ms). */
const TRANSLATE_BATCH_DELAY_MS = 3000

class GeminiApiError extends Error {
  statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'GeminiApiError'
    this.statusCode = statusCode
  }
}

async function translateContentInBatches(
  source: { code: string; name: string },
  target: { code: string; name: string },
  content: Record<string, string>,
  keys: string[],
  apiKey: string,
): Promise<Record<string, string>> {
  const translated: Record<string, string> = {}
  const batchCount = Math.ceil(keys.length / TRANSLATE_BATCH_SIZE)

  for (let i = 0; i < keys.length; i += TRANSLATE_BATCH_SIZE) {
    const batchIndex = Math.floor(i / TRANSLATE_BATCH_SIZE) + 1
    const batchKeys = keys.slice(i, i + TRANSLATE_BATCH_SIZE)
    const batchMap: Record<string, string> = {}
    for (const k of batchKeys) {
      batchMap[k] = content[k]
    }

    if (batchCount > 1) {
      console.log(`[ai-translate] Batch ${batchIndex}/${batchCount} (${batchKeys.length} strings)`)
    }

    const prompt = buildPrompt(source, target, batchMap)
    try {
      const rawText = await callGeminiWithRetry(prompt, apiKey)
      const batchResult = safeParseTranslations(rawText, batchKeys)

      if (!batchResult) {
        console.error('[ai-translate] Failed to parse Gemini response:', rawText.slice(0, 500))
        throw new GeminiApiError('AI returned an unparseable response. Please retry.', 502)
      }

      Object.assign(translated, batchResult)
    } catch (err) {
      // If Gemini signals rate-limit/quota (429), return partial translations collected so far.
      if (err instanceof GeminiApiError && err.statusCode === 429) {
        console.warn('[ai-translate] Rate limit reached — returning partial translations')
        return translated
      }
      // Re-throw other errors to be handled by caller
      throw err
    }

    if (i + TRANSLATE_BATCH_SIZE < keys.length) {
      await sleep(TRANSLATE_BATCH_DELAY_MS)
    }
  }

  return translated
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// ─── Gemini HTTP caller with retry ───────────────────────────────────────────

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

function geminiErrorMessage(status: number, errText: string): string {
  if (status === 429) {
    const quotaExhausted = /quota|exhausted|RESOURCE_EXHAUSTED|rate.?limit/i.test(errText)
    if (quotaExhausted) {
      return (
        'Gemini API quota or rate limit reached. Wait a few minutes and try again, ' +
        'or check usage and billing at https://ai.google.dev/rate-limit.'
      )
    }
    return 'Too many translation requests. Please wait a minute and try again.'
  }
  if (status === 401 || status === 403) {
    return 'Gemini API key is invalid or does not have permission. Check GEMINI_API_KEY.'
  }
  if (status === 400) {
    return 'Gemini rejected the request. The page may have too much content to translate at once.'
  }
  return `Gemini API error (${status}). Please try again later.`
}

function retryDelayMs(status: number, attempt: number, retryAfterHeader: string | null): number {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10)
    if (!Number.isNaN(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, 120_000)
    }
  }
  if (status === 429) {
    // 5s, 15s, 45s — quota limits need longer backoff than 1s/2s
    return 5000 * Math.pow(3, attempt - 1)
  }
  return 1000 * Math.pow(2, attempt - 1)
}

async function callGeminiWithRetry(
  prompt: string,
  apiKey: string,
  maxAttempts = 4,
): Promise<string> {
  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.1, responseMimeType: 'application/json' },
  })

  let lastStatus = 0
  let lastErrText = ''

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
    })

    if (res.ok) {
      const data = (await res.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
      }
      return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ''
    }

    lastStatus = res.status
    lastErrText = await res.text().catch(() => '')
    const isRetryable = res.status === 429 || res.status === 500 || res.status === 503

    if (!isRetryable || attempt === maxAttempts) {
      console.error(
        `[ai-translate] Gemini ${res.status} (attempt ${attempt}/${maxAttempts}):`,
        lastErrText.slice(0, 400),
      )
      throw new GeminiApiError(
        geminiErrorMessage(res.status, lastErrText),
        res.status === 429 ? 429 : res.status >= 500 ? 502 : res.status,
      )
    }

    const delayMs = retryDelayMs(res.status, attempt, res.headers.get('Retry-After'))
    console.warn(
      `[ai-translate] Gemini ${res.status} — retrying in ${delayMs}ms (attempt ${attempt}/${maxAttempts})`,
    )
    await sleep(delayMs)
  }

  throw new GeminiApiError(
    geminiErrorMessage(lastStatus, lastErrText),
    lastStatus === 429 ? 429 : 502,
  )
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
