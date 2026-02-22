import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

export interface AIConfig {
  url: string;
  model: string;
  apiKey: string;
  provider: 'openai' | 'gemini' | 'deepseek' | 'lovable';
}

interface ProviderSettings {
  enabled: boolean;
  api_key: string;
  model: string;
}

/**
 * Reads the active AI provider from system_settings and returns
 * the appropriate API URL, model, and key.
 *
 * Priority:
 *  1. Admin-configured provider in system_settings (ai_active_provider)
 *  2. Lovable AI gateway (fallback)
 */
export async function getAIConfig(): Promise<AIConfig> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

  // Default fallback — Lovable AI gateway
  const fallback: AIConfig = {
    url: "https://ai.gateway.lovable.dev/v1/chat/completions",
    model: "openai/gpt-5-mini",
    apiKey: LOVABLE_API_KEY || OPENAI_API_KEY || "",
    provider: "lovable",
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) return fallback;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch the active provider setting
    const { data: providerRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "ai_active_provider")
      .single();

    const activeProvider: string = (providerRow?.value as any)?.provider || "lovable";

    if (activeProvider === "lovable") return fallback;

    // Fetch provider-specific config
    const configKey =
      activeProvider === "openai"
        ? "openai_config"
        : activeProvider === "gemini"
        ? "gemini_config"
        : activeProvider === "deepseek"
        ? "deepseek_config"
        : null;

    if (!configKey) return fallback;

    const { data: configRow } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", configKey)
      .single();

    const config = configRow?.value as unknown as ProviderSettings | null;

    if (!config?.enabled) return fallback;

    // Build config based on provider
    if (activeProvider === "openai") {
      const key = config.api_key || OPENAI_API_KEY || "";
      if (!key) return fallback;
      return {
        url: "https://api.openai.com/v1/chat/completions",
        model: config.model || "gpt-4o-mini",
        apiKey: key,
        provider: "openai",
      };
    }

    if (activeProvider === "gemini") {
      const key = config.api_key || "";
      if (!key) return fallback;
      return {
        url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
        model: config.model || "gemini-2.5-flash",
        apiKey: key,
        provider: "gemini",
      };
    }

    if (activeProvider === "deepseek") {
      const key = config.api_key || "";
      if (!key) return fallback;
      return {
        url: "https://api.deepseek.com/v1/chat/completions",
        model: config.model || "deepseek-chat",
        apiKey: key,
        provider: "deepseek",
      };
    }

    return fallback;
  } catch (e) {
    console.error("[ai-config] Error reading AI config, using fallback:", e);
    return fallback;
  }
}
