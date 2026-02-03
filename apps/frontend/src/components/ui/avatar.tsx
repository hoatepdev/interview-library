import * as React from "react"
import { cn } from "@/lib/utils"

const Avatar = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span"> & {
    asChild?: boolean
  } & {
    src?: string
    alt?: string
    className?: string
  }
>(({ className, asChild = false, src, alt, ...props }, ref) => {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700",
        className
      )}
      {...props}
    >
      {src ? (
        <img
          src={src}
          alt={alt || "Avatar"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium">
          {alt ? alt[0]?.toUpperCase() : '?'}
        </span>
      )}
    </span>
  )
})
Avatar.displayName = "Avatar"

export { Avatar }
