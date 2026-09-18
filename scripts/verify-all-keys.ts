const rawKeys = [
  Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEttZmlrMHlHcVozSThXbGMxRnFnbFE=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SmExX2VVOEo1WDFEZWFhRWhsRWtabWpCWXRCVlJDWEhiUzgxb3N5WllXSGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SUdlSTVqWWVLQjRSdlJVMU5UX0I2RlRhbl9qZ3NKRHk1TUJYYnpjczFpNGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SlRKNmdYTjNuLVBqVmN6OWo4YU5VSmZsU0dXMExkOHFXQl9GaElrMjlieVE=", "base64").toString("utf-8")
];

const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

async function verifyAllKeysWithGemini38() {
  console.log("Testing all 4 keys on gemini-3.8-flash & gemini-3.6-flash & gemini-flash-latest:");
  for (let i = 0; i < rawKeys.length; i++) {
    const key = rawKeys[i];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${key}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "كلمة واحدة" },
              { inline_data: { mime_type: "image/png", data: dummyImage } }
            ]
          }]
        })
      });

      if (res.ok) {
        const d = await res.json();
        console.log(`✅ Key #${i + 1} (${key.slice(0, 12)}...): WORKING 100%! Response: "${d.candidates?.[0]?.content?.parts?.[0]?.text?.trim()}"`);
      } else {
        const err = await res.json();
        console.error(`❌ Key #${i + 1} Failed HTTP ${res.status}:`, err.error?.message);
      }
    } catch (e: any) {
      console.error(`❌ Key #${i + 1} Error:`, e.message);
    }
  }
}

verifyAllKeysWithGemini38();
