module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  const { text } = req.body;

  // Si pas de texte ou trop court, on renvoie tel quel sans appel API
  if (!text || text.trim().length < 3) {
    return res.status(200).json({ corrected: text, wasCorrected: false });
  }

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 300,
        system: `Tu es un correcteur de transcription vocale pour accent toulousain.
Reçois un texte mal transcrit et retourne UNIQUEMENT le texte corrigé.
JAMAIS de phrases comme "je ne comprends pas" ou "pourriez-vous".
JAMAIS d'explication. JAMAIS de question. JUSTE le texte corrigé.
Si le texte est déjà correct, retourne-le tel quel.
Corrections typiques : "Vincennes"→"Vercel", terminaisons "-ée"→"-er", nasales déformées, "r" roulé.`,
        messages: [{ role: "user", content: text }]
      })
    });

    const data = await response.json();
    const corrected = data.content?.[0]?.text?.trim() || text;

    // Protection : si la réponse ressemble à une réponse conversationnelle
    // (le correcteur a disjoncté), on renvoie le texte original
    const suspicious = [
      "je ne comprends pas",
      "pourriez-vous",
      "fournir un texte",
      "prêt à corriger",
      "je suis prêt",
      "pouvez-vous"
    ];
    const isSuspicious = suspicious.some(s => corrected.toLowerCase().includes(s));

    if (isSuspicious) {
      return res.status(200).json({ corrected: text, wasCorrected: false });
    }

    res.status(200).json({ corrected, wasCorrected: corrected !== text });

  } catch (err) {
    // En cas d'erreur, on renvoie le texte original sans planter
    res.status(200).json({ corrected: text, wasCorrected: false });
  }
};
