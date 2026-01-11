import { supabase } from '@/integrations/supabase/client';

export interface ViabilityResult {
  success?: boolean;
  isFamousBrand?: boolean;
  level: 'high' | 'medium' | 'low' | 'blocked';
  title: string;
  description: string;
  laudo?: string;
  brandName?: string;
  businessArea?: string;
  classes?: string[];
  viability?: string;
  searchDate?: string;
  error?: string;
}

export async function checkViability(brandName: string, businessArea: string): Promise<ViabilityResult> {
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
