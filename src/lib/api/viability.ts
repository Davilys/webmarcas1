import { supabase } from '@/integrations/supabase/client';

export interface INPIConflict {
  processo: string;
  marca: string;
  situacao: string;
  titular: string;
  classe: string;
  pais: string;
}

export interface CompanyResult {
  name: string;
  cnpj: string;
  status: string;
  city: string;
  state: string;
  opened: string;
}

export interface WebSource {
  title: string;
  url: string;
  snippet: string;
}

export interface WebAnalysis {
  googleMeuNegocio: boolean;
  linkedin: boolean;
  instagramFound?: boolean;
  webMentions: number;
  sources: WebSource[];
  summary: string;
  socialProfiles?: Array<{
    platform: string;
    profileName: string;
    url: string;
    followers?: string;
  }>;
  cnpjSources?: Array<{
    source: string;
    name: string;
    cnpj?: string;
    city?: string;
    state?: string;
    status?: string;
  }>;
}

export interface INPIResults {
  found: boolean;
  totalResults: number;
  conflicts: INPIConflict[];
  source: string;
}

export interface CompaniesResult {
  found: boolean;
  companies: CompanyResult[];
  total: number;
}

export interface ViabilityResult {
  success: boolean;
  isFamousBrand?: boolean;
  level: 'high' | 'medium' | 'low' | 'blocked';
  title: string;
  description: string;
  laudo?: string;
  urgencyScore?: number;
  classes?: number[];
  classDescriptions?: string[];
  searchDate?: string;
  error?: string;
  // Novos campos enriquecidos
  inpiResults?: INPIResults;
  companiesResult?: CompaniesResult;
  webAnalysis?: WebAnalysis;
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
