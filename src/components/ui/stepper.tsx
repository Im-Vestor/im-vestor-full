import { cn } from '~/lib/utils';

export type Step = {
  label: string;
  description?: string;
};

interface StepperProps {
  steps: Step[];
  currentStep: number;
  className?: string;
}

export function Stepper({ steps, currentStep, className }: StepperProps) {
  return (
    <div className={cn('w-full px-4', className)}>
      <div className="relative flex w-full items-center justify-between">
        {/* Background lines */}
        <div className="absolute left-4 right-4 top-1/4 h-[2px] -translate-y-1/2 bg-white/10" />

        {/* Progress line */}
        <div
          className="absolute left-4 right-4 top-1/4 h-[2px] -translate-y-1/2 bg-[#EFD687] transition-all duration-300"
          style={{
            width: `${(currentStep / (steps.length - 1)) * 100}%`,
          }}
        />

        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isCurrent = currentStep === index;

          return (
            <div key={step.label} className="relative flex flex-col items-center">
              {/* Step circle */}
              <div
                className={cn(
                  'relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-background transition-colors duration-300',
                  isCompleted
                    ? 'border-[#EFD687] bg-[#EFD687] text-background'
                    : isCurrent
                      ? 'border-[#EFD687] bg-background text-[#EFD687]'
                      : 'border-white/10 bg-background text-white/50'
                )}
              >
                {isCompleted ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  <span className="text-sm">{index + 1}</span>
                )}
              </div>

              {/* Step label */}
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    'text-sm font-medium transition-colors duration-300',
                    isCompleted || isCurrent ? 'text-white' : 'text-white/50'
                  )}
                >
                  {step.label}
                </p>
                {step.description && (
                  <p className="mt-1 text-xs text-white/50">{step.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
