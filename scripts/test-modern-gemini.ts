const key = Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEttZmlrMHlHcVozSThXbGMxRnFnbFE=", "base64").toString("utf-8");

async function testModernModels() {
  const models = [
    "gemini-3.8-flash",
    "gemini-3.7-flash",
    "gemini-3.6-flash",
    "gemini-3.5-flash",
    "gemini-flash-latest",
    "gemini-flash-lite-latest"
  ];

  const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  for (const m of models) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${key}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "أنت المساعد نور دهب، قول كلمة واحدة بس: شغال تمام" },
              { inline_data: { mime_type: "image/png", data: dummyImage } }
            ]
          }]
        })
      });

      if (res.ok) {
        const d = await res.json();
        console.log(`✅ SUCCESS on model [${m}]! Response:`, d.candidates?.[0]?.content?.parts?.[0]?.text);
      } else {
        const err = await res.json();
        console.log(`❌ FAILED on model [${m}] HTTP ${res.status}:`, err.error?.message);
      }
    } catch (e: any) {
      console.log(`❌ EXCEPTION on model [${m}]:`, e.message);
    }
  }
}

testModernModels();
