const rawKeys = [
  Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEttZmlrMHlHcVozSThXbGMxRnFnbFE=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SmExX2VVOEo1WDFEZWFhRWhsRWtabWpCWXRCVlJDWEhiUzgxb3N5WllXSGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SUdlSTVqWWVLQjRSdlJVMU5UX0I2RlRhbl9qZ3NKRHk1TUJYYnpjczFpNGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SlRKNmdYTjNuLVBqVmN6OWo4YU5VSmZsU0dXMExkOHFXQl9GaElrMjlieVE=", "base64").toString("utf-8")
];

async function testAllKeysWithVision() {
  const modelsToTest = [
    "gemini-2.5-flash",
    "gemini-2.5-pro",
    "gemini-2.0-flash",
    "gemini-1.5-flash"
  ];
  
  // 1x1 transparent png base64
  const dummyImage = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

  for (let k = 0; k < rawKeys.length; k++) {
    const key = rawKeys[k];
    console.log(`\n========================================`);
    console.log(`Testing Key #${k + 1} (${key.slice(0, 12)}...${key.slice(-4)})`);

    let keyWorked = false;
    for (const model of modelsToTest) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: "قول كلمة واحدة: تمام" },
                { inline_data: { mime_type: "image/png", data: dummyImage } }
              ]
            }]
          })
        });

        if (res.ok) {
          const data = await res.json();
          const reply = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
          console.log(` -> Model [${model}]: SUCCESS! Reply: "${reply}"`);
          keyWorked = true;
          break; // Key works with this model
        } else {
          const err = await res.json().catch(() => ({}));
          console.log(` -> Model [${model}]: FAILED HTTP ${res.status}:`, err.error?.message || res.statusText);
        }
      } catch (e: any) {
        console.log(` -> Model [${model}]: EXCEPTION:`, e.message);
      }
    }

    if (!keyWorked) {
      console.error(` -> KEY #${k + 1} FAILED ON ALL TESTED MODELS!`);
    }
  }
}

testAllKeysWithVision();
