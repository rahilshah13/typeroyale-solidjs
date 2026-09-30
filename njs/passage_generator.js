async function handlePassageRequest(r) {
  try {
    let promptText = "Generate a concise reading passage for a whiteboard canvas.";
    if (r.requestText) {
      try {
        const body = JSON.parse(r.requestText);
        if (body.prompt) promptText = body.prompt;
      } catch (e) {
        // Fall back to default prompt if body isn't JSON
      }
    }

    const payload = JSON.stringify({
      model: "gemma:2b",
      prompt: promptText,
      stream: false
    });

    const reply = await r.subrequest("/ollama/api/generate", {
      method: "POST",
      body: payload,
      headers: { "Content-Type": "application/json" }
    });

    if (reply.status === 200) {
      const parsed = JSON.parse(reply.responseText);
      r.headersOut["Content-Type"] = "application/json";
      r.return(200, JSON.stringify({ passage: parsed.response || "" }));
    } else {
      r.return(500, JSON.stringify({ error: "Failed to generate passage from Ollama" }));
    }
  } catch (err) {
    r.return(500, JSON.stringify({ error: err.message }));
  }
}

export default { handlePassageRequest };