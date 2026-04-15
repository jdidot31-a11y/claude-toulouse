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
        system: "Tu es un correcteur de transcription vocale pour accent toulousain. Retourne UNIQUEMENT le texte corrigé, sans aucune explication, sans question, sans commentaire. Si le texte est correct, retourne-le tel quel. Corrections : nasales deformees, terminaisons -ee en -er, r roule, mots phonetiquement proches.",
        messages: [{ role: "user", content: text }]
      })
    });

    const data = await response.json();
    const corrected = (data.content?.[0]?.text || text).trim();

    // Protection 1 : liste noire de phrases conversationnelles
    const suspicious = [
      "je ne comprends pas", "pourriez-vous", "fournir un texte",
      "je suis pret", "pouvez-vous", "je peux pas creer",
      "je ne peux pas", "je peux seulement", "dans cette conversation",
      "copier-coller", "si tu as besoin", "bien sur", "voici :", "voila :"
    ];
    const low = corrected.toLowerCase();
    const isSuspicious = suspicious.some(s => low.includes(s));

    // Protection 2 : si la reponse est 60% plus longue que l'entree c'est suspect
    const isTooLong = corrected.length > text.length * 1.6;

    if (isSuspicious || isTooLong) {
      return res.status(200).json({ corrected: text, wasCorrected: false });
    }

    res.status(200).json({ corrected, wasCorrected: corrected !== text });

  } catch (err) {
    res.status(200).json({ corrected: text, wasCorrected: false });
  }
};
