import { Check, Search, User, Building2, CreditCard, FileSignature } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  label: string;
  icon: typeof Search;
}

const steps: Step[] = [
  { number: 1, label: "Viabilidade", icon: Search },
  { number: 2, label: "Dados Pessoais", icon: User },
  { number: 3, label: "Dados da Marca", icon: Building2 },
  { number: 4, label: "Pagamento", icon: CreditCard },
  { number: 5, label: "Contrato", icon: FileSignature },
];

interface CheckoutProgressProps {
  currentStep: number;
}

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between">
        {steps.map((s, index) => (
          <div key={s.number} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                  currentStep >= s.number
                    ? "bg-gradient-to-br from-primary to-blue-500 text-primary-foreground shadow-lg"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {currentStep > s.number ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <s.icon className="w-4 h-4" />
                )}
              </div>
              <span className={cn(
                "text-xs mt-2 hidden sm:block transition-colors",
                currentStep >= s.number ? "text-foreground font-medium" : "text-muted-foreground"
              )}>
                {s.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "flex-1 h-1 mx-2 rounded-full transition-all duration-500",
                  currentStep > s.number ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
