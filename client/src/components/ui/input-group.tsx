import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

interface InputGroupContextValue {
  isFocused: boolean
  setIsFocused: (focused: boolean) => void
}

const InputGroupContext = React.createContext<InputGroupContextValue | undefined>(undefined)

function useInputGroupContext() {
  const context = React.useContext(InputGroupContext)
  if (!context) {
    throw new Error("InputGroup components must be used within an InputGroup")
  }
  return context
}

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)

  return (
    <InputGroupContext.Provider value={{ isFocused, setIsFocused }}>
      <div
        ref={ref}
        className={cn(
          "relative inline-flex min-w-0 w-full items-center rounded-md border border-input bg-background has-[:focus-visible]:ring-1 has-[:focus-visible]:ring-ring",
          isFocused && "ring-1 ring-ring",
          className
        )}
        {...props}
      />
    </InputGroupContext.Provider>
  )
})
InputGroup.displayName = "InputGroup"

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, onFocus, onBlur, ...props }, ref) => {
  const { setIsFocused } = useInputGroupContext()

  return (
    <Input
      ref={ref}
      className={cn(
        "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      onFocus={(e) => {
        setIsFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsFocused(false)
        onBlur?.(e)
      }}
      {...props}
    />
  )
})
InputGroupInput.displayName = "InputGroupInput"

const InputGroupTextarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, onFocus, onBlur, ...props }, ref) => {
  const { setIsFocused } = useInputGroupContext()

  return (
    <Textarea
      ref={ref}
      className={cn(
        "border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 resize-none",
        className
      )}
      onFocus={(e) => {
        setIsFocused(true)
        onFocus?.(e)
      }}
      onBlur={(e) => {
        setIsFocused(false)
        onBlur?.(e)
      }}
      {...props}
    />
  )
})
InputGroupTextarea.displayName = "InputGroupTextarea"

interface InputGroupAddonProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: "inline-start" | "inline-end" | "block-start" | "block-end"
}

const InputGroupAddon = React.forwardRef<HTMLDivElement, InputGroupAddonProps>(
  ({ className, align = "inline-start", ...props }, ref) => {
    const alignClasses = {
      "inline-start": "order-first",
      "inline-end": "order-last",
      "block-start": "order-first",
      "block-end": "order-last",
    }

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center gap-1 px-2 py-1.5 text-muted-foreground",
          alignClasses[align],
          className
        )}
        {...props}
      />
    )
  }
)
InputGroupAddon.displayName = "InputGroupAddon"

interface InputGroupButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  size?: "xs" | "icon-xs" | "sm" | "icon-sm"
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost"
}

const InputGroupButton = React.forwardRef<
  HTMLButtonElement,
  InputGroupButtonProps
>(({ className, size = "xs", variant = "ghost", ...props }, ref) => {
  return (
    <Button
      ref={ref}
      size={size as any}
      variant={variant}
      className={cn("h-auto px-2 py-1", className)}
      {...props}
    />
  )
})
InputGroupButton.displayName = "InputGroupButton"

const InputGroupText = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "px-2 py-1.5 text-sm font-medium text-muted-foreground",
      className
    )}
    {...props}
  />
))
InputGroupText.displayName = "InputGroupText"

export {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupTextarea,
  InputGroupText,
}
