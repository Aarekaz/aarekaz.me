import {
  Activity,
  ArrowUpRight,
  Bot,
  Code2,
  Github,
  HeartPulse,
  Mail,
  Newspaper,
  Radio,
  Sparkles,
} from "lucide-react"
import type { ReactNode } from "react"
import type { DashboardLink, HealthMetric } from "./data"
import { useDashboardData } from "./hooks/useDashboardData"

function ExternalArrow() {
  return <ArrowUpRight size={16} strokeWidth={1.8} aria-hidden="true" />
}

function LinkCard({
  link,
  className = "",
  icon,
}: {
  link: DashboardLink
  className?: string
  icon?: ReactNode
}) {
  return (
    <a className={`card link-card ${className}`} href={link.href}>
      <div className="card-topline">
        {icon}
        <span>{link.accent ?? "Open"}</span>
        <ExternalArrow />
      </div>
      <h3>{link.title}</h3>
      <p>{link.description}</p>
    </a>
  )
}

function Metric({ metric }: { metric: HealthMetric }) {
  return (
    <div className="metric">
      <span>{metric.label}</span>
      <strong>{metric.value}</strong>
      {metric.detail ? <small>{metric.detail}</small> : null}
    </div>
  )
}

export function App() {
  const { data, status } = useDashboardData()
  const [primaryProject, ...secondaryProjects] = data.featured

  return (
    <main className="page-shell">
      <section className="hero-card card">
        <div className="hero-copy">
          <p className="eyebrow">@{data.profile.handle}</p>
          <h1>{data.profile.name}</h1>
          <p>{data.profile.headline}</p>
        </div>
        <div className="hero-actions" aria-label="Primary links">
          <a href={`mailto:${data.profile.email}`}>
            <Mail size={16} />
            Email
          </a>
          <a href={data.profile.fullSite}>
            <Sparkles size={16} />
            Full site
          </a>
          <a href="https://github.com/Aarekaz">
            <Github size={16} />
            GitHub
          </a>
        </div>
      </section>

      <section className="bento-grid" aria-label="Aarekaz dashboard">
        <article className="card now-card">
          <div className="card-topline">
            <Radio size={16} />
            <span>Now</span>
          </div>
          <h2>{data.now.status}</h2>
          <p>{data.now.focus}</p>
          <small>{data.now.updated}</small>
        </article>

        <article className="card health-card">
          <div className="card-topline">
            <HeartPulse size={16} />
            <span>Apple Health</span>
            <em>{data.health.status === "live" ? "live" : "sync ready"}</em>
          </div>
          <div className="health-metrics">
            {data.health.metrics.map((metric) => (
              <Metric metric={metric} key={metric.label} />
            ))}
          </div>
          <small>{data.health.updated}</small>
        </article>

        {primaryProject ? (
          <LinkCard
            link={primaryProject}
            className="feature-card"
            icon={<Code2 size={16} />}
          />
        ) : null}

        <LinkCard
          link={data.writing}
          className="writing-card"
          icon={<Newspaper size={16} />}
        />

        {secondaryProjects.map((project) => (
          <LinkCard
            link={project}
            key={project.title}
            icon={<Activity size={16} />}
          />
        ))}

        {data.links.map((link) => {
          const icon =
            link.title === "For agents" ? <Bot size={16} /> :
            link.title === "GitHub" ? <Github size={16} /> :
            link.title === "Email" ? <Mail size={16} /> :
            <Sparkles size={16} />

          return <LinkCard link={link} key={link.title} icon={icon} />
        })}
      </section>

      <footer className="footer-line">
        <span>{data.profile.location}</span>
        <span>{status === "ready" ? "dynamic feed loaded" : "fallback feed"}</span>
      </footer>
    </main>
  )
}
