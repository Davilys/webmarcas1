import { useState } from "react";
import { ArrowLeft, ArrowRight, Check, CreditCard, QrCode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PaymentOption {
  id: string;
  title: string;
  subtitle: string;
  price: string;
  priceValue: number;
  icon: typeof CreditCard;
  highlight?: boolean;
}

const paymentOptions: PaymentOption[] = [
  {
    id: "avista",
    title: "À Vista (PIX)",
    subtitle: "Pagamento instantâneo",
    price: "R$ 698,97",
    priceValue: 698.97,
    icon: QrCode,
    highlight: true,
  },
  {
    id: "cartao6x",
    title: "Cartão de Crédito",
    subtitle: "6x de R$ 199,00",
    price: "R$ 1.194,00",
    priceValue: 1194,
    icon: CreditCard,
  },
  {
    id: "boleto3x",
    title: "Boleto Parcelado",
    subtitle: "3x de R$ 399,00",
    price: "R$ 1.197,00",
    priceValue: 1197,
    icon: FileText,
  },
];

interface PaymentStepProps {
  selectedMethod: string;
  onNext: (method: string, value: number) => void;
  onBack: () => void;
}

export function PaymentStep({ selectedMethod, onNext, onBack }: PaymentStepProps) {
  const [selected, setSelected] = useState(selectedMethod || "");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selected) {
      setError("Selecione uma forma de pagamento");
      return;
    }

    const option = paymentOptions.find(o => o.id === selected);
    if (option) {
      onNext(selected, option.priceValue);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-2">Forma de Pagamento</h2>
        <p className="text-muted-foreground">
          Escolha como deseja realizar o pagamento do registro.
        </p>
      </div>

      <div className="space-y-3">
        {paymentOptions.map((option) => (
          <Card
            key={option.id}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              selected === option.id
                ? "border-primary ring-2 ring-primary/20"
                : "hover:border-primary/50",
              option.highlight && "relative overflow-hidden"
            )}
            onClick={() => setSelected(option.id)}
          >
            {option.highlight && (
              <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                Melhor preço
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "flex items-center justify-center w-12 h-12 rounded-xl transition-all",
                  selected === option.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}>
                  <option.icon className="w-6 h-6" />
                </div>

                <div className="flex-1">
                  <h4 className="font-semibold">{option.title}</h4>
                  <p className="text-sm text-muted-foreground">{option.subtitle}</p>
                </div>

                <div className="text-right">
                  <p className={cn(
                    "font-bold text-lg",
                    selected === option.id ? "text-primary" : ""
                  )}>
                    {option.price}
                  </p>
                </div>

                <div className={cn(
                  "w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all",
                  selected === option.id
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-muted-foreground/30"
                )}>
                  {selected === option.id && <Check className="w-4 h-4" />}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {error && <p className="text-destructive text-sm text-center">{error}</p>}

      <Card className="border-emerald-200 bg-emerald-50 dark:bg-emerald-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Check className="w-5 h-5 text-emerald-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-emerald-700 dark:text-emerald-400">
                Garantia de Satisfação
              </p>
              <p className="text-emerald-600/80 dark:text-emerald-500/80">
                Se o INPI indeferir seu registro, devolvemos 100% do valor investido.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
