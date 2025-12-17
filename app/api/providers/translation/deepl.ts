// app/api/providers/translation/deepl.ts

const SUPPORTED_LANGS = ['FI', 'DE', 'NL', 'FR'] as const;
export type SupportedDeeplLang = (typeof SUPPORTED_LANGS)[number];

export function isSupportedDeeplLang(code: string): code is SupportedDeeplLang {
  return SUPPORTED_LANGS.includes(code.toUpperCase() as SupportedDeeplLang);
}

export async function translateTextWithDeepl(
  text: string,
  targetLanguage: SupportedDeeplLang,
): Promise<string> {
  console.log(
    'NODE_TLS_REJECT_UNAUTHORIZED =',
    process.env.NODE_TLS_REJECT_UNAUTHORIZED,
  );

  const apiKey = process.env.DEEPL_API_KEY;
  if (!apiKey) {
    console.warn('DEEPL_API_KEY missing, returning original text');
    return text;
  }

  if (!text.trim()) return text;

  const params = new URLSearchParams();
  params.append('text', text);
  params.append('target_lang', targetLanguage);

  const resp = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `DeepL-Auth-Key ${apiKey}`,
    },
    body: params.toString(),
  });

  if (!resp.ok) {
    console.error('DeepL error', resp.status, await resp.text());
    return text;
  }

  const data = (await resp.json()) as { translations?: { text: string }[] };
  return data.translations?.[0]?.text ?? text;
}
