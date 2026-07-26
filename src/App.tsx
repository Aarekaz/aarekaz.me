import { Suspense, use } from "react"
import {
  Activity,
  ArrowUpRight,
  Code2,
  Footprints,
  Github,
  HeartPulse,
  Mail,
  Radio,
} from "lucide-react"
import { getCrowd } from "./data/crowd"
import { getFeed, type SiteFeed } from "./data/feed"

const number = new Intl.NumberFormat("en-US")
const date = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
})

function hours(seconds: number): string {
  return `${Math.round(seconds / 3600)}h`
}

function statusText(feed: SiteFeed): string {
  if (feed.status.listening) return "listening"
  switch (feed.status.discord) {
    case "online":
      return "online"
    case "idle":
      return "idle"
    case "dnd":
      return "focused"
    default:
      return "quiet"
  }
}

function generatedAtLabel(generatedAt: string | null): string {
  if (!generatedAt) return "fallback feed"
  const parsed = new Date(generatedAt)
  if (Number.isNaN(parsed.valueOf())) return "fallback feed"
  return `updated ${date.format(parsed)}`
}

function LiveIndex() {
  const feed = use(getFeed())
  const crowd = use(getCrowd())
  const steps =
    feed.health.avgSteps == null ? "syncing" : number.format(Math.round(feed.health.avgSteps))

  const signals = [
    {
      icon: Footprints,
      label: "steps",
      value: steps,
      meta: feed.health.avgSteps == null ? "Apple Health pending" : "7 day average",
    },
    {
      icon: Code2,
      label: "code",
      value: hours(feed.wakatime.seconds30d),
      meta: `${number.format(feed.github.commits30d)} commits in 30d`,
    },
    {
      icon: Activity,
      label: "range",
      value: `${feed.github.activeDays30d}d`,
      meta: `${feed.wakatime.languages} languages, ${feed.github.repos} repos`,
    },
    {
      icon: Radio,
      label: "presence",
      value: statusText(feed),
      meta: crowd && crowd.total > 0 ? `${number.format(crowd.tending)} here now` : "public signal",
    },
  ]

  const links = [
    { href: "https://anuragd.me", label: "anuragd.me", meta: "full archive" },
    { href: "https://github.com/aarekaz", label: "github", meta: "code" },
    { href: "mailto:hey@anuragd.me", label: "email", meta: "hey@anuragd.me" },
    { href: "https://anuragd.me/llms.txt", label: "agents", meta: "llms.txt" },
  ]

  return (
    <section className="index-grid" aria-label="aarekaz live index">
      <article className="tile hero-tile">
        <div className="mark-row">
          <span className="dot" aria-hidden="true" />
          <span>{generatedAtLabel(feed.generatedAt)}</span>
        </div>
        <h1>aarekaz</h1>
        <p>
          Anurag Dhungana builds agent infrastructure, applied AI systems, and
          personal software.
        </p>
        <div className="identity-strip" aria-label="contact">
          <a href="mailto:hey@anuragd.me">
            <Mail size={15} aria-hidden="true" />
            hey@anuragd.me
          </a>
          <a href="https://anuragd.me">
            <ArrowUpRight size={15} aria-hidden="true" />
            anuragd.me
          </a>
        </div>
      </article>

      <article className="tile now-tile">
        <span className="tile-label">now</span>
        <p>Making the personal web feel live without turning it into a feed.</p>
      </article>

      <article className="tile health-tile">
        <HeartPulse size={18} aria-hidden="true" />
        <span className="tile-label">health</span>
        <strong>{steps}</strong>
        <small>{feed.health.workouts} recent workouts</small>
      </article>

      <section className="signal-strip" aria-label="live signals">
        {signals.map((signal) => {
          const Icon = signal.icon
          return (
            <article className="tile signal-tile" key={signal.label}>
              <Icon size={18} aria-hidden="true" />
              <span className="tile-label">{signal.label}</span>
              <strong>{signal.value}</strong>
              <small>{signal.meta}</small>
            </article>
          )
        })}
      </section>

      <section className="tile links-tile" aria-label="links">
        <span className="tile-label">links</span>
        <div className="link-list">
          {links.map((link) => (
            <a href={link.href} key={link.href}>
              <span>
                <strong>{link.label}</strong>
                <small>{link.meta}</small>
              </span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </a>
          ))}
        </div>
      </section>

      <article className="tile note-tile">
        <span className="tile-label">index</span>
        <p>
          A small public surface for the pieces that change: health, coding,
          presence, links, and experiments.
        </p>
      </article>

      <article className="tile github-tile">
        <Github size={18} aria-hidden="true" />
        <span className="tile-label">github</span>
        <strong>{number.format(feed.github.commits30d)}</strong>
        <small>{feed.github.activeDays30d} active days this month</small>
      </article>
    </section>
  )
}

function LoadingIndex() {
  return (
    <section className="index-grid index-grid-loading" aria-label="Loading live index">
      <article className="tile hero-tile">
        <div className="mark-row">
          <span className="dot" aria-hidden="true" />
          <span>loading feed</span>
        </div>
        <h1>aarekaz</h1>
      </article>
    </section>
  )
}

export function App() {
  return (
    <main className="page-shell">
      <Suspense fallback={<LoadingIndex />}>
        <LiveIndex />
      </Suspense>
    </main>
  )
}
