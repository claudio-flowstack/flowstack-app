interface CanvasToastProps {
  message: string | null
}

export function CanvasToast({ message }: CanvasToastProps) {
  if (!message) return null

  return (
    <div
      className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50
        bg-foreground text-background px-4 py-2 rounded-full
        text-xs font-medium shadow-lg
        animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      {message}
    </div>
  )
}
