import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { GripVertical } from "lucide-react"

interface FeatureProps {
  badge?: string
  title?: string
  description?: string
  imageBefore?: string
  imageAfter?: string
}

function Feature({
  badge = "Plattform",
  title = "Vorher vs. Nachher",
  description = "Sieh den Unterschied den Flowstack für deine Agentur macht.",
  imageBefore = "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=1080&fit=crop",
  imageAfter = "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1920&h=1080&fit=crop",
}: FeatureProps) {
  const [inset, setInset] = useState<number>(50)
  const [isMouseDown, setIsMouseDown] = useState<boolean>(false)

  const onMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isMouseDown) return

    const rect = e.currentTarget.getBoundingClientRect()
    let x = 0

    if ("touches" in e && e.touches.length > 0) {
      x = e.touches[0].clientX - rect.left
    } else if ("clientX" in e) {
      x = e.clientX - rect.left
    }

    const percentage = (x / rect.width) * 100
    setInset(Math.max(0, Math.min(100, percentage)))
  }

  return (
    <div className="w-full py-20 lg:py-40">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col gap-4">
          <div>
            <Badge variant="outline" className="border-white/20 text-white/70 bg-white/[0.05]">
              {badge}
            </Badge>
          </div>
          <div className="flex gap-2 flex-col">
            <h2 className="text-3xl md:text-5xl tracking-tighter lg:max-w-xl font-regular text-white">
              {title}
            </h2>
            <p className="text-lg max-w-xl lg:max-w-xl leading-relaxed tracking-tight text-white/60">
              {description}
            </p>
          </div>
          <div className="pt-12 w-full">
            <div
              className="relative aspect-video w-full h-full overflow-hidden rounded-2xl select-none"
              onMouseMove={onMouseMove}
              onMouseUp={() => setIsMouseDown(false)}
              onTouchMove={onMouseMove}
              onTouchEnd={() => setIsMouseDown(false)}
            >
              <div
                className="bg-white/20 h-full w-1 absolute z-20 top-0 -ml-1 select-none"
                style={{ left: inset + "%" }}
              >
                <button
                  className="bg-white/20 backdrop-blur-sm rounded hover:scale-110 transition-all w-5 h-10 select-none -translate-y-1/2 absolute top-1/2 -ml-2 z-30 cursor-ew-resize flex justify-center items-center"
                  onTouchStart={(e) => {
                    setIsMouseDown(true)
                    onMouseMove(e as unknown as React.TouchEvent)
                  }}
                  onMouseDown={(e) => {
                    setIsMouseDown(true)
                    onMouseMove(e as unknown as React.MouseEvent)
                  }}
                  onTouchEnd={() => setIsMouseDown(false)}
                  onMouseUp={() => setIsMouseDown(false)}
                >
                  <GripVertical className="h-4 w-4 select-none text-white" />
                </button>
              </div>
              <img
                src={imageAfter}
                alt="After"
                className="absolute left-0 top-0 z-10 w-full h-full aspect-video rounded-2xl select-none border border-white/10 object-cover"
                style={{ clipPath: "inset(0 0 0 " + inset + "%)" }}
                draggable={false}
              />
              <img
                src={imageBefore}
                alt="Before"
                className="absolute left-0 top-0 w-full h-full aspect-video rounded-2xl select-none border border-white/10 object-cover"
                draggable={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { Feature }
