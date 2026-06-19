// Minimal identity laid over the living world. Kept deliberately sparse — the
// organism is the hero. The machine-readable JSON block makes the site
// meaningful to agents/crawlers even though the visuals are canvas-only.

const IDENTITY = {
  name: "Anurag Dhungana",
  handle: "aarekaz",
  is: "builder of systems, agents, and personal software",
  location: "Washington, DC",
  archive: "https://www.anuragd.me",
  email: "hey@anuragd.me",
  github: "https://github.com/Aarekaz",
  agents: "https://www.anuragd.me/llms.txt",
  about: "aarekaz.me is a living world — a Physarum organism fed by real data and shaped by visitors.",
}

export function Overlay() {
  return (
    <div className="overlay">
      <div className="identity">
        <p className="eyebrow">a living world</p>
        <h1>aarekaz</h1>
        <p className="tagline">
          Fed by my real life. Shaped by everyone who visits. Move to disturb it.
        </p>
        <p className="who">Anurag Dhungana — systems, agents &amp; personal software</p>
        <nav className="links" aria-label="Links">
          <a href="https://www.anuragd.me">the archive</a>
          <a href="mailto:hey@anuragd.me">email</a>
          <a href="https://github.com/Aarekaz">github</a>
          <a href="https://www.anuragd.me/llms.txt">for agents</a>
        </nav>
      </div>
      {/* Machine-readable identity for agents and crawlers (static, trusted content). */}
      <script type="application/json" id="identity">
        {JSON.stringify(IDENTITY)}
      </script>
    </div>
  )
}
