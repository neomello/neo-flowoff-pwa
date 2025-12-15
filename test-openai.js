// Teste básico da API OpenAI
// Execute: node test-openai.js

import OpenAI from "openai";
import dotenv from "dotenv";

// Carregar variáveis de ambiente
dotenv.config();

// Configurar cliente OpenAI
// A API key já contém informações de organização e projeto
// Não precisamos especificar manualmente se estiver causando conflitos
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY?.trim(), // Remove espaços em branco
  // Não especificar organization/project aqui - deixar a API key gerenciar
});

async function listAvailableModels() {
  try {
    console.log("📋 Listando modelos disponíveis...");
    const models = await client.models.list();
    const availableModels = models.data
      .filter(m => m.id.includes('gpt') || m.id.includes('o1'))
      .map(m => m.id)
      .sort();
    
    console.log("✅ Modelos disponíveis:");
    availableModels.forEach(model => console.log(`   - ${model}`));
    return availableModels;
  } catch (error) {
    console.log("⚠️  Não foi possível listar modelos:", error.message);
    return [];
  }
}

async function testOpenAI() {
  try {
    console.log("🔄 Testando API OpenAI...");
    console.log("🔑 API Key:", process.env.OPENAI_API_KEY?.substring(0, 20) + "...");
    console.log("");
    
    // Listar modelos disponíveis primeiro
    const availableModels = await listAvailableModels();
    console.log("");
    
    // Tentar modelos em ordem de preferência
    const modelsToTry = availableModels.length > 0 
      ? availableModels.slice(0, 3) // Usar os 3 primeiros disponíveis
      : ["gpt-3.5-turbo", "gpt-4o-mini", "gpt-4", "o1-mini", "o1-preview"]; // Fallback
    
    let response = null;
    let modelUsed = null;
    let lastError = null;

    for (const model of modelsToTry) {
      try {
        console.log(`🔄 Tentando modelo: ${model}...`);
        response = await client.chat.completions.create({
          model: model,
          messages: [
            {
              role: "user",
              content: "Write a one-sentence bedtime story about a unicorn."
            }
          ],
          temperature: 0.7,
          max_tokens: 100
        });
        modelUsed = model;
        break;
      } catch (error) {
        lastError = error;
        if (error.status === 403 && (error.code === 'model_not_found' || error.message?.includes('does not have access'))) {
          console.log(`   ❌ Modelo ${model} não disponível neste projeto`);
          continue;
        }
        throw error;
      }
    }

    if (!response) {
      throw lastError || new Error("Nenhum modelo disponível");
    }

    console.log("\n✅ Sucesso!");
    console.log("📤 Resposta:", response.choices[0]?.message?.content);
    console.log("\n📊 Detalhes:");
    console.log("  - Modelo usado:", modelUsed || response.model);
    console.log("  - Tokens usados:", response.usage?.total_tokens);
    console.log("  - Prompt tokens:", response.usage?.prompt_tokens);
    console.log("  - Completion tokens:", response.usage?.completion_tokens);
    
  } catch (error) {
    console.error("\n❌ Erro:", error.message);
    
    if (error.status === 401) {
      console.error("⚠️  API key inválida ou expirada");
      console.error("   Verifique se OPENAI_API_KEY está correto no .env");
    } else if (error.status === 403) {
      console.error("⚠️  Acesso negado ao modelo");
      console.error("   Possíveis causas:");
      console.error("   1. O projeto não tem acesso ao modelo solicitado");
      console.error("   2. A API key está associada a um projeto diferente");
      console.error("   3. Tente remover PROJECT_ID do .env ou usar outro projeto");
    } else if (error.status === 429) {
      console.error("⚠️  Rate limit excedido");
    } else {
      console.error("   Detalhes:", error);
    }
    process.exit(1);
  }
}

testOpenAI();
