import { useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { validateCNPJ, formatCNPJ } from "@/lib/validators";

const brandDataSchema = z.object({
  brandName: z.string().min(2, "Nome da marca obrigatório").max(100),
  businessArea: z.string().min(3, "Ramo de atividade obrigatório").max(200),
  hasCNPJ: z.boolean(),
  cnpj: z.string().optional(),
  companyName: z.string().optional(),
}).refine((data) => {
  if (data.hasCNPJ) {
    if (!data.cnpj || !validateCNPJ(data.cnpj)) return false;
    if (!data.companyName || data.companyName.length < 3) return false;
  }
  return true;
}, {
  message: "CNPJ ou Razão Social inválidos",
  path: ["cnpj"],
});

export interface BrandData {
  brandName: string;
  businessArea: string;
  hasCNPJ: boolean;
  cnpj: string;
  companyName: string;
}

interface BrandDataStepProps {
  initialData: BrandData;
  onNext: (data: BrandData) => void;
  onBack: () => void;
}

export function BrandDataStep({ initialData, onNext, onBack }: BrandDataStepProps) {
  const [data, setData] = useState<BrandData>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = brandDataSchema.safeParse(data);
    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          newErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(newErrors);
      return;
    }

    onNext(data);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Dados da Marca</h2>
        <p className="text-muted-foreground">
          Informe os detalhes da marca que será registrada.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="brandName">Nome da Marca *</Label>
          <Input
            id="brandName"
            value={data.brandName}
            onChange={(e) => setData({ ...data, brandName: e.target.value })}
            placeholder="Nome que será registrado"
          />
          {errors.brandName && <p className="text-destructive text-sm">{errors.brandName}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="businessArea">Ramo de Atividade *</Label>
          <Input
            id="businessArea"
            value={data.businessArea}
            onChange={(e) => setData({ ...data, businessArea: e.target.value })}
            placeholder="Ex: Serviços Jurídicos, Alimentação, etc."
          />
          {errors.businessArea && <p className="text-destructive text-sm">{errors.businessArea}</p>}
        </div>

        <div className="flex items-center space-x-2 py-2">
          <Checkbox
            id="hasCNPJ"
            checked={data.hasCNPJ}
            onCheckedChange={(checked) => setData({ ...data, hasCNPJ: !!checked })}
          />
          <Label htmlFor="hasCNPJ" className="text-sm font-normal cursor-pointer">
            Tenho CNPJ e quero vincular à marca
          </Label>
        </div>

        {data.hasCNPJ && (
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg border animate-fade-in">
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                value={data.cnpj}
                onChange={(e) => setData({ ...data, cnpj: formatCNPJ(e.target.value) })}
                placeholder="00.000.000/0000-00"
                maxLength={18}
              />
              {errors.cnpj && <p className="text-destructive text-sm">{errors.cnpj}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Razão Social *</Label>
              <Input
                id="companyName"
                value={data.companyName}
                onChange={(e) => setData({ ...data, companyName: e.target.value })}
                placeholder="Nome da empresa"
              />
              {errors.companyName && <p className="text-destructive text-sm">{errors.companyName}</p>}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
        <Button type="submit" className="flex-1">
          Continuar
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </form>
  );
}
