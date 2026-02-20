import { supabase } from '@/integrations/supabase/client';

export interface ViabilityResult {
  success: boolean;
  isFamousBrand?: boolean;
  famousBrandMatch?: string;       // qual marca de alto renome foi detectada
  level: 'high' | 'medium' | 'low' | 'blocked';
  title: string;
  description: string;
  laudo?: string;
  classes?: number[];
  classDescriptions?: string[];
  searchDate?: string;
  error?: string;
  // Campos V2 — opcionais, não quebram componentes existentes
  webCollidenceFound?: boolean;    // encontrou empresas/menções na web
  inpiSearched?: boolean;          // INPI foi consultado via Firecrawl
  urgencyScore?: number;           // 0-100 (100 = urgentíssimo)
}

export async function checkViability(brandName: string, businessArea: string): Promise<ViabilityResult> {
  // Add artificial delay of 3 seconds for more realistic UX
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const { data, error } = await supabase.functions.invoke('inpi-viability-check', {
    body: { brandName, businessArea },
  });

  if (error) {
    console.error('Viability check error:', error);
    return {
      success: false,
      level: 'low',
      title: 'Erro na Consulta',
      description: 'Não foi possível realizar a consulta. Tente novamente.',
      error: error.message,
    };
  }

  return data as ViabilityResult;
}
