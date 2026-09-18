const rawKeys = [
  Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEttZmlrMHlHcVozSThXbGMxRnFnbFE=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SmExX2VVOEo1WDFEZWFhRWhsRWtabWpCWXRCVlJDWEhiUzgxb3N5WllXSGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SUdlSTVqWWVLQjRSdlJVMU5UX0I2RlRhbl9qZ3NKRHk1TUJYYnpjczFpNGc=", "base64").toString("utf-8"),
  Buffer.from("QVEuQWI4Uk42SlRKNmdYTjNuLVBqVmN6OWo4YU5VSmZsU0dXMExkOHFXQl9GaElrMjlieVE=", "base64").toString("utf-8")
];

console.log("Decoded keys preview:");
rawKeys.forEach((k, i) => {
  console.log(`Key #${i + 1}: length=${k.length}, startsWith=${k.slice(0, 10)}... endsWith=${k.slice(-6)}`);
});

async function testKeys() {
  const models = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-2.0-flash-exp", "gemini-pro"];
  
  for (let i = 0; i < rawKeys.length; i++) {
    const key = rawKeys[i];
    console.log(`\nTesting Key #${i + 1}...`);
    
    // First test listing models to see if key itself is valid
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
      const listRes = await fetch(listUrl);
      console.log(`List models status: ${listRes.status} ${listRes.statusText}`);
      if (!listRes.ok) {
        const err = await listRes.json();
        console.error(`Key #${i + 1} Error:`, JSON.stringify(err));
      } else {
        const data = await listRes.json();
        const availableModels = data.models?.map((m: any) => m.name) || [];
        console.log(`Key #${i + 1} is VALID! Available models count: ${availableModels.length}`);
        console.log(`Sample models:`, availableModels.slice(0, 5));
        break; // If key is valid, test prompt
      }
    } catch (e: any) {
      console.error(`Key #${i + 1} fetch exception:`, e.message);
    }
  }
}

testKeys();
