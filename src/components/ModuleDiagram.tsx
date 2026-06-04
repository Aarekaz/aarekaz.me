import type { CSSProperties } from "react"
import type { ModulePart } from "../data"

type ModuleDiagramProps = {
  parts: ModulePart[]
  selectedId: string
  onSelect: (id: string) => void
}

export function ModuleDiagram({ parts, selectedId, onSelect }: ModuleDiagramProps) {
  return (
    <section className="diagram-stage" aria-label="Exploded diagram of the aarekaz module">
      <div className="drawing-rules" aria-hidden="true" />
      <div className="figure-label left">FIG-000 / exploded interface object</div>
      <div className="figure-label right">REV-001 / public surface</div>

      <div className="module-stack" aria-hidden="true">
        <div className="module-layer layer-top">
          <div className="slot slot-wide" />
          <div className="slot slot-small" />
          <span>aarekaz</span>
        </div>
        <div className="module-layer layer-memory">
          <div className="trace trace-one" />
          <div className="trace trace-two" />
          <div className="trace trace-three" />
        </div>
        <div className="module-disc">
          <div className="disc-ring" />
          <div className="disc-core" />
        </div>
        <div className="module-layer layer-core">
          <div className="chip" />
          <div className="pins pins-left" />
          <div className="pins pins-right" />
        </div>
        <div className="module-layer layer-bottom">
          <div className="port port-one" />
          <div className="port port-two" />
        </div>
      </div>

      <svg className="connector-lines" viewBox="0 0 100 100" aria-hidden="true">
        {parts.map((part) => (
          <line
            key={part.id}
            className={part.id === selectedId ? "connector active" : "connector"}
            x1="50"
            y1="50"
            x2={part.x}
            y2={part.y}
          />
        ))}
      </svg>

      {parts.map((part) => {
        const active = part.id === selectedId
        return (
          <a
            href={part.href}
            key={part.id}
            className={active ? "diagram-callout active" : "diagram-callout"}
            style={{ "--x": `${part.x}%`, "--y": `${part.y}%` } as CSSProperties}
            onMouseEnter={() => onSelect(part.id)}
            onFocus={() => onSelect(part.id)}
          >
            <span>{part.figure}</span>
            <strong>{part.label}</strong>
          </a>
        )
      })}
    </section>
  )
}
