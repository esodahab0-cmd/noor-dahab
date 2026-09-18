const key = Buffer.from("QVEuQWI4Uk42SWJiQm5BOTNobHpHdWVEdWh2cHFRTEttZmlrMHlHcVozSThXbGMxRnFnbFE=", "base64").toString("utf-8");

async function checkModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  const res = await fetch(url);
  const data = await res.json();
  
  const generateModels = data.models
    ?.filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
    ?.map((m: any) => ({ name: m.name, displayName: m.displayName }));

  console.log("Supported generateContent models count:", generateModels?.length);
  console.log("Models:", JSON.stringify(generateModels, null, 2));
}

checkModels();
