import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function EscalationBadge({ requiresHuman }: { requiresHuman?: boolean }) {
  if (requiresHuman) {
    return (
      <Badge variant="warning">
        <AlertTriangle className="h-3.5 w-3.5" />
        Human review
      </Badge>
    );
  }

  return (
    <Badge variant="success">
      <CheckCircle2 className="h-3.5 w-3.5" />
      Automated
    </Badge>
  );
}
