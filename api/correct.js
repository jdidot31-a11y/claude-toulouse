module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { text } = req.body;
  if (!text || !text.trim()) return res.status(200).json({ corrected: text });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: `Tu es un correcteur spécialisé dans l'accent du Sud-Ouest de la France, particulièrement l'accent toulousain.

L'utilisateur te fournit un texte brut issu d'une reconnaissance vocale qui a mal interprété certains mots à cause de l'accent toulousain.

Corrections typiques à faire :
- "Vincennes" → "Vercel", "sévère" → "créer", "pétète" → "peut-être"
- Les "e" muets doublés → les supprimer
- Terminaisons "-ée" ou "-é" au lieu de "-er"
- Voyelles nasales déformées : "ine", "aing" → "in", "one" → "on"
- Le "r" roulé qui perturbe les mots environnants
- Mots phonétiquement proches mais mal reconnus

RÈGLES ABSOLUES :
1. Corrige UNIQUEMENT les erreurs de transcription liées à l'accent
2. Garde exactement le sens voulu par l'utilisateur
3. Ne change pas le style ou registre de langue
4. Réponds UNIQUEMENT avec le texte corrigé, rien d'autre, pas de guillemets, pas d'explication`,
      messages: [{ role: "user", content: text }]
    })
  });

  const data = await response.json();
  const corrected = data.content?.[0]?.text?.trim() || text;
  res.status(200).json({ corrected, wasCorrected: corrected !== text });
};
