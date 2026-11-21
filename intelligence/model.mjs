import { getVercelOidcToken } from "@vercel/oidc";

let checkedAt = 0;
let verifiedModel = "";
const gateway = "https://ai-gateway.vercel.sh/v1";

async function checkFreeModel(model) {
  if (verifiedModel === model && Date.now() - checkedAt < 60000) return;
  const response = await fetch(gateway + "/models", {signal: AbortSignal.timeout(4000)});
  if (!response.ok) throw Error("Catálogo indisponible");
  const catalog = await response.json();
  const price = catalog.data?.find(item => item.id === model)?.pricing;
  if (!price || String(price.input) !== "0" || String(price.output) !== "0" || price.varies_by_provider) throw Error("Modelo gratuito indisponible");
  verifiedModel = model; checkedAt = Date.now();
}

export async function modelResponse(messages,schema) {
  if (process.env.VERCEL) {
    const model = process.env.AI_PROCESS_GATEWAY_MODEL;
    if (!model) throw Error("Modelo sin configurar");
    await checkFreeModel(model);
    const token = await getVercelOidcToken();
    const response = await fetch(gateway + "/chat/completions", {
      method:"POST", headers:{Authorization:"Bearer " + token, "Content-Type":"application/json"},
      signal:AbortSignal.timeout(22000),
      body:JSON.stringify({model,messages,temperature:0,max_tokens:650,stream:false,
        ...(schema?{response_format:{type:"json_schema",json_schema:{name:"process_map",strict:true,schema}}}:{})
      })
    });
    if (!response.ok) {
      const details = await response.json().catch(() => null);
      if (response.status === 403 && details?.error?.type === "customer_verification_required") {
        const error = new Error("El proveedor requiere verificar la cuenta de Vercel.");
        error.code = "gateway_verification_required";
        throw error;
      }
      throw Error("Gateway indisponible");
    }
    return {engine:"Vercel AI Gateway · " + model,content:(await response.json()).choices?.[0]?.message?.content};
  }
  const model=process.env.AI_PROCESS_MODEL || "gemma3:1b";
  const response=await fetch("http://127.0.0.1:11434/api/chat", {
    method:"POST",headers:{"Content-Type":"application/json"},signal:AbortSignal.timeout(45000),
    body:JSON.stringify({model,messages,stream:false,...(schema?{format:schema}:{}),options:{temperature:0,num_predict:schema?280:140,num_ctx:2048}})
  });
  if (!response.ok) throw Error("Ollama indisponible");
  return {engine:"Ollama · "+model,content:(await response.json()).message?.content};
}
