import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  color: "blue" | "purple" | "green" | "orange";
  progress?: number;
  badge?: string;
  avatars?: any[];
}

export const StatCard = ({
  icon,
  title,
  value,
  color,
  progress,
  badge,
  avatars,
}: StatCardProps) => {
  const colorStyles = {
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    green: "bg-green-50 text-green-600",
    orange: "bg-orange-50 text-orange-600",
  };

  const borderColors = {
    blue: "border-blue-100",
    purple: "border-purple-100",
    green: "border-green-100",
    orange: "border-orange-100",
  };

  return (
    <div
      className={cn(
        "bg-white rounded-xl border p-4 hover:shadow-md transition-all duration-200",
        borderColors[color],
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={cn("p-2 rounded-lg", colorStyles[color])}>{icon}</div>
        {progress !== undefined && (
          <span className="text-2xl font-bold text-slate-800">{value}</span>
        )}
      </div>
      <h3 className="text-sm font-medium text-slate-500 mb-1">{title}</h3>
      {progress !== undefined ? (
        <>
          <div className="text-2xl font-bold text-slate-800">{value}</div>
          <Progress value={progress} className="h-1.5 mt-2" />
        </>
      ) : (
        <div className="text-2xl font-bold text-slate-800">{value}</div>
      )}
      {badge && <p className="text-xs text-slate-400 mt-2">{badge}</p>}
      {avatars && avatars.length > 0 && (
        <div className="flex -space-x-2 mt-2">
          {avatars.slice(0, 4).map((member: any) => (
            <Avatar
              key={member.user._id}
              className="w-6 h-6 border-2 border-white"
            >
              <AvatarImage src={member.user.profilePicture} />
              <AvatarFallback className="text-[10px] bg-slate-200 text-slate-600">
                {member.user.name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
          ))}
          {avatars.length > 4 && (
            <div className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[10px] text-slate-500">
              +{avatars.length - 4}
            </div>
          )}
        </div>
      )}
    </div>
  );
};