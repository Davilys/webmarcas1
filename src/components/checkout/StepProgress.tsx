import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StepProgressProps {
  currentStep: number;
  totalSteps: number;
  labels?: string[];
}

const StepProgress = ({ currentStep, totalSteps, labels }: StepProgressProps) => {
  return (
    <div className="mb-8">
      {/* Barra de progresso */}
      <div className="relative">
        <div className="flex justify-between">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
            <div key={step} className="flex flex-col items-center relative z-10">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                  step < currentStep
                    ? "bg-green-500 text-white"
                    : step === currentStep
                    ? "bg-primary text-white shadow-lg shadow-primary/30"
                    : "bg-slate-200 text-slate-400"
                )}
              >
                {step < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step
                )}
              </div>
              {labels && labels[step - 1] && (
                <span
                  className={cn(
                    "text-xs mt-2 font-medium text-center max-w-[60px] leading-tight",
                    step <= currentStep ? "text-slate-700" : "text-slate-400"
                  )}
                >
                  {labels[step - 1]}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Linha de conexão */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200 -translate-y-1/2" style={{ left: '20px', right: '20px' }}>
          <div
            className="h-full bg-green-500 transition-all duration-500"
            style={{
              width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default StepProgress;
