import { Badge } from "@/components/ui/badge";
import { ShieldCheck, GraduationCap, Star, Trophy } from "lucide-react";

interface VerificationBadgesProps {
  isVerified: boolean | null;
  education: string | null;
  rating: number | null;
  totalReviews: number | null;
  compact?: boolean;
}

type VerificationLevel = {
  label: string;
  icon: React.ReactNode;
  className: string;
};

function getVerificationLevels({
  isVerified,
  education,
  rating,
  totalReviews,
}: Omit<VerificationBadgesProps, "compact">): VerificationLevel[] {
  const levels: VerificationLevel[] = [];

  // Level 1 — Identity Verified
  if (isVerified) {
    levels.push({
      label: "Identity Verified",
      icon: <ShieldCheck className="h-3 w-3" />,
      className: "border-primary/30 bg-primary/10 text-primary",
    });
  }

  // Level 2 — Education Verified (has education filled + verified)
  if (isVerified && education && education.trim().length > 0) {
    levels.push({
      label: "Education Verified",
      icon: <GraduationCap className="h-3 w-3" />,
      className: "border-secondary/30 bg-secondary/10 text-secondary-foreground",
    });
  }

  // Level 3 — Expert Tutor (advanced degree)
  const advancedKeywords = ["master", "m.sc", "msc", "m.a.", "ma ", "phd", "ph.d", "doctorate", "m.tech", "mtech", "m.ed", "med"];
  if (
    isVerified &&
    education &&
    advancedKeywords.some((k) => education.toLowerCase().includes(k))
  ) {
    levels.push({
      label: "Expert Tutor",
      icon: <Star className="h-3 w-3" />,
      className: "border-accent/30 bg-accent/10 text-accent-foreground",
    });
  }

  // Level 4 — Top Rated Tutor
  if (isVerified && (rating ?? 0) >= 4.5 && (totalReviews ?? 0) >= 10) {
    levels.push({
      label: "Top Tutor",
      icon: <Trophy className="h-3 w-3" />,
      className: "border-accent/30 bg-accent/20 text-accent-foreground font-bold",
    });
  }

  return levels;
}

export function VerificationBadges({
  isVerified,
  education,
  rating,
  totalReviews,
  compact = false,
}: VerificationBadgesProps) {
  const levels = getVerificationLevels({ isVerified, education, rating, totalReviews });

  if (levels.length === 0) return null;

  if (compact) {
    // Show only highest level badge
    const highest = levels[levels.length - 1];
    return (
      <Badge variant="outline" className={`gap-1 text-xs shrink-0 ${highest.className}`}>
        {highest.icon}
        {highest.label}
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {levels.map((level) => (
        <Badge
          key={level.label}
          variant="outline"
          className={`gap-1 text-xs ${level.className}`}
        >
          {level.icon}
          {level.label}
        </Badge>
      ))}
    </div>
  );
}
