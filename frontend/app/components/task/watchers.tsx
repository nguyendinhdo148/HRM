import type { User } from "@/types";
import { AvatarFallback, AvatarImage } from "@radix-ui/react-avatar";
import { Avatar } from "@/components/ui/avatar";

export const Watchers = ({ watchers }: { watchers: User[] }) => {
  return (
    <div className="bg-card rounded-lg p-6 shadow-sm mb-6">
      <h3 className="text-base font-bold text-muted-foreground mb-4">
        Người theo dõi
      </h3>

      <div className="space-y-2">
        {watchers && watchers.length > 0 ? (
          watchers.map((watcher) => (
            <div key={watcher._id} className="flex items-center gap-2">
              <Avatar className="size-6">
                {/* Đã sửa: AvatarImage thành thẻ tự đóng đứng độc lập */}
                <AvatarImage src={watcher.profilePicture} alt={watcher.name} />
                
                {/* Đã sửa: AvatarFallback nằm ngang hàng với AvatarImage */}
                <AvatarFallback>
                  {watcher.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">Không có người theo dõi</p>
        )}
      </div>
    </div>
  );
};