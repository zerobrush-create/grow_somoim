import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export const EmptyState = ({ icon: Icon, title, description, action, className }: Props) => (
  <div className={cn("flex flex-col items-center justify-center text-center py-12 px-6", className)}>
    <div className="h-16 w-16 rounded-full bg-primary-soft flex items-center justify-center mb-4">
      <Icon className="h-7 w-7 text-primary" />
    </div>
    <h3 className="text-base font-bold mb-1">{title}</h3>
    {description && <p className="text-sm text-muted-foreground max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export default EmptyState;