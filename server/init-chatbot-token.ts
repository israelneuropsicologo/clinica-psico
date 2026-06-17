/**
 * Initialize Permanent ChatBot Amanda Token
 * Runs once on server startup to create a permanent API token for ChatBot Amanda
 * This ensures the chatbot can always send appointment data without manual token generation
 */

import { createApiToken, validateApiToken } from "./db-webhooks";
import { getDb } from "./db";
import { apiTokens } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

const CHATBOT_TOKEN_NAME = "ChatBot Amanda - Permanent";
const CHATBOT_TOKEN_DESCRIPTION = "Token permanente para integração do ChatBot Amanda com agendamentos diretos. Não expirar.";

/**
 * Initialize the permanent ChatBot token
 * Called on server startup
 */
export async function initChatbotToken() {
  try {
    // Get the owner's user ID (usually 1 or from environment)
    const ownerId = parseInt(process.env.OWNER_ID || "1");

    // Check if token already exists
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existingTokens = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.userId, ownerId), eq(apiTokens.name, CHATBOT_TOKEN_NAME)))
      .limit(1);

    const existingToken = existingTokens.length > 0 ? existingTokens[0] : null;

    if (existingToken) {
      console.log(`[ChatBot] Token permanente já existe: ${existingToken.token.substring(0, 20)}...`);
      return existingToken;
    }

    // Create new permanent token
    console.log(`[ChatBot] Criando token permanente para ChatBot Amanda...`);
    const newToken = await createApiToken(ownerId, CHATBOT_TOKEN_NAME, CHATBOT_TOKEN_DESCRIPTION);

    console.log(`[ChatBot] ✅ Token permanente criado com sucesso!`);
    console.log(`[ChatBot] Token: ${newToken.token}`);
    console.log(`[ChatBot] Use este token na configuração do ChatBot Amanda`);

    return newToken;
  } catch (error) {
    console.error(`[ChatBot] ❌ Erro ao criar token permanente:`, error);
    throw error;
  }
}

/**
 * Get the ChatBot token for configuration
 */
export async function getChatbotToken() {
  try {
    const ownerId = parseInt(process.env.OWNER_ID || "1");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const token = await db
      .select()
      .from(apiTokens)
      .where(and(eq(apiTokens.userId, ownerId), eq(apiTokens.name, CHATBOT_TOKEN_NAME)))
      .limit(1);

    if (!token || token.length === 0) {
      console.warn(`[ChatBot] Token não encontrado. Execute initChatbotToken() primeiro.`);
      return null;
    }

    return token[0];
  } catch (error) {
    console.error(`[ChatBot] Erro ao obter token:`, error);
    return null;
  }
}
