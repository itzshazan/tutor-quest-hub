import { analyzePassword, PasswordStrength } from "@/lib/validations";
import { cn } from "@/lib/utils";

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
}

const strengthColors: Record<PasswordStrength, string> = {
  weak: "bg-destructive",
  fair: "bg-orange-500",
  good: "bg-yellow-500",
  strong: "bg-green-500",
};

const strengthLabels: Record<PasswordStrength, string> = {
  weak: "Weak",
  fair: "Fair",
  good: "Good",
  strong: "Strong",
};

export function PasswordStrengthIndicator({ password, className }: PasswordStrengthIndicatorProps) {
  if (!password) return null;

  const { strength, score, feedback } = analyzePassword(password);

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center gap-2">
        <div className="flex gap-1 flex-1">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < score ? strengthColors[strength] : "bg-muted"
              )}
            />
          ))}
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            strength === "weak" && "text-destructive",
            strength === "fair" && "text-orange-500",
            strength === "good" && "text-yellow-600",
            strength === "strong" && "text-green-600"
          )}
        >
          {strengthLabels[strength]}
        </span>
      </div>
      {feedback.length > 0 && strength !== "strong" && (
        <ul className="text-xs text-muted-foreground space-y-0.5">
          {feedback.slice(0, 2).map((tip, i) => (
            <li key={i}>• {tip}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
