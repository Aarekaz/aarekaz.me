import { ArrowUpRight } from "lucide-react"
import { useMemo, useState } from "react"
import { ModuleDiagram } from "./components/ModuleDiagram"
import { moduleParts } from "./data"

export function App() {
  const [selectedId, setSelectedId] = useState("shell")
  const selected = useMemo(
    () => moduleParts.find((part) => part.id === selectedId) ?? moduleParts[0],
    [selectedId],
  )
  const SelectedIcon = selected.icon

  return (
    <main className="site-shell">
      <header className="manual-header" aria-label="Aarekaz module header">
        <a href="https://www.anuragd.me/" className="wordmark">
          aarekaz
        </a>
        <div className="header-meta">
          <span>Personal interface module</span>
          <span>Washington, DC</span>
        </div>
      </header>

      <section className="hero-grid" aria-label="Aarekaz module manual">
        <div className="copy-panel">
          <p className="kicker">FIELD MANUAL / PUBLIC ENTRYPOINT</p>
          <h1>A small machine for finding Anurag on the internet.</h1>
          <p className="lede">
            Builder focused on agent infrastructure, memory, evaluation systems, and useful personal software.
            The full archive lives at anuragd.me; this page is the quick-start diagram.
          </p>

          <div className="selected-readout">
            <div className="selected-topline">
              <SelectedIcon size={16} strokeWidth={1.7} />
              <span>{selected.figure}</span>
              <span>{selected.label}</span>
            </div>
            <h2>{selected.title}</h2>
            <p>{selected.description}</p>
            <a href={selected.href} className="readout-link">
              open part
              <ArrowUpRight size={15} strokeWidth={1.8} />
            </a>
          </div>
        </div>

        <ModuleDiagram parts={moduleParts} selectedId={selectedId} onSelect={setSelectedId} />
      </section>

      <nav className="part-index" aria-label="Aarekaz module links">
        {moduleParts.map((part) => {
          const Icon = part.icon
          const active = part.id === selectedId
          return (
            <a
              href={part.href}
              key={part.id}
              className={active ? "part-link active" : "part-link"}
              onMouseEnter={() => setSelectedId(part.id)}
              onFocus={() => setSelectedId(part.id)}
            >
              <span className="part-figure">{part.figure}</span>
              <Icon size={15} strokeWidth={1.65} />
              <span>{part.title}</span>
              <ArrowUpRight size={14} strokeWidth={1.7} />
            </a>
          )
        })}
      </nav>
    </main>
  )
}
