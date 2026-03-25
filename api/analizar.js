// api/analizar.js — Vercel Serverless Function
// Soporta Gemini Flash (gratis) y Claude (de pago) según env var AI_PROVIDER

const fetch = require('node-fetch');

const PROMPT = `Sos un perito de seguros de autos experto en el mercado argentino.
Analizá esta imagen de un auto dañado y respondé SOLO con un JSON válido, sin texto adicional:

{
  "auto": "Marca y modelo detectado",
  "año": "Rango de año estimado",
  "color": "Color del auto",
  "confianza": 85,
  "descripcion": "Una oración describiendo el daño principal",
  "piezas": [
    {
      "nombre": "Nombre de la pieza dañada en español",
      "icono": "emoji representativo",
      "severidad": "alto|medio|bajo",
      "query": "búsqueda sin tildes para MercadoLibre Argentina"
    }
  ]
}

Reglas: entre 2 y 5 piezas. Solo JSON puro, sin markdown, sin backticks.`;

// ── GEMINI ────────────────────────────────────────────────
async function analyzeWithGemini(base64, mediaType) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('Falta GEMINI_API_KEY');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [
        { inline_data: { mime_type: mediaType || 'image/jpeg', data: base64 } },
        { text: PROMPT }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.error) throw new Error(data.error.message);

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ── CLAUDE ────────────────────────────────────────────────
async function analyzeWithClaude(base64, mediaType) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('Falta ANTHROPIC_API_KEY');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001', // más barato, igual de bueno para visión
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType || 'image/jpeg', data: base64 } },
          { type: 'text', text: PROMPT }
        ]
      }]
    })
  });

  const data = await res.json();
  if (data.error) throw new Error(data.error.message);

  const text = data.content[0].text;
  return JSON.parse(text.replace(/```json|```/g, '').trim());
}

// ── HANDLER ───────────────────────────────────────────────
module.exports = async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { base64, mediaType } = req.body;
  if (!base64) return res.status(400).json({ error: 'Falta imagen (base64)' });

  const provider = process.env.AI_PROVIDER || 'gemini'; // gemini | claude

  try {
    let result;
    if (provider === 'claude') {
      result = await analyzeWithClaude(base64, mediaType);
    } else {
      result = await analyzeWithGemini(base64, mediaType);
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error(`[${provider}] Error:`, err.message);
    return res.status(500).json({ error: err.message, provider });
  }
};
