import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // See input.tsx - solid white, explicit border, no reliance on tokens.
        "flex min-h-[60px] w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus-visible:outline-none focus-visible:border-teal-500 focus-visible:ring-2 focus-visible:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
