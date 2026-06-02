import { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

export interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string;
  initials?: string;
  size?: AvatarSize;
  isOnline?: boolean;
  badge?: ReactNode;
  alt?: string;
}

export function Avatar({
  className,
  src,
  initials,
  size = "md",
  isOnline = false,
  badge,
  alt = "Avatar",
  ...props
}: AvatarProps) {
  const sizes = {
    xs: "h-8 w-8",
    sm: "h-10 w-10",
    md: "h-12 w-12",
    lg: "h-14 w-14",
  };

  const textSizes = {
    xs: "text-caption-sm",
    sm: "text-caption-md",
    md: "text-body-md",
    lg: "text-body-lg",
  };

  const onlineDotSizes = {
    xs: "h-2 w-2",
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <div className="relative inline-flex" {...props}>
      <div
        className={cn(
          "flex items-center justify-center rounded-avatar bg-indigo-100 text-indigo-600 font-semibold",
          sizes[size],
          textSizes[size],
          className
        )}
      >
        {src ? (
          <img
            src={src}
            alt={alt}
            className="h-full w-full rounded-avatar object-cover"
          />
        ) : (
          initials || "?"
        )}
      </div>

      {isOnline && (
        <div
          className={cn(
            "absolute bottom-0 right-0 rounded-full bg-success ring-2 ring-white",
            onlineDotSizes[size]
          )}
        />
      )}

      {badge && (
        <div className="absolute -right-1 -top-1 text-lg">{badge}</div>
      )}
    </div>
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLDivElement> {
  avatars: Array<{
    src?: string;
    initials?: string;
    alt?: string;
  }>;
  size?: AvatarSize;
  maxDisplay?: number;
}

export function AvatarGroup({
  className,
  avatars,
  size = "sm",
  maxDisplay = 3,
  ...props
}: AvatarGroupProps) {
  const displayAvatars = avatars.slice(0, maxDisplay);
  const remaining = Math.max(0, avatars.length - maxDisplay);

  return (
    <div className={cn("flex items-center", className)} {...props}>
      {displayAvatars.map((avatar, i) => (
        <div
          key={i}
          className={cn(
            i > 0 && "-ml-3",
            "ring-2 ring-white"
          )}
        >
          <Avatar
            src={avatar.src}
            initials={avatar.initials}
            size={size}
            alt={avatar.alt}
          />
        </div>
      ))}

      {remaining > 0 && (
        <div className="ml-2 text-caption-md font-semibold text-app-muted">
          +{remaining}
        </div>
      )}
    </div>
  );
}
