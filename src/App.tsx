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
  MapPin,
  Sparkles,
} from "lucide-react"
import type { ReactNode } from "react"
import type { DashboardLink } from "./data"
import { useDashboardData } from "./hooks/useDashboardData"

function Tile({
  href,
  className,
  icon,
  label,
  title,
  children,
}: {
  href?: string
  className: string
  icon?: ReactNode
  label?: string
  title?: string
  children?: ReactNode
}) {
  const content = (
    <>
      {(icon || label || href) ? (
        <div className="tile-topline">
          {icon}
          {label ? <span>{label}</span> : null}
          {href ? <ArrowUpRight size={15} strokeWidth={2.1} aria-hidden="true" /> : null}
        </div>
      ) : null}
      {title ? <h2>{title}</h2> : null}
      {children}
    </>
  )

  if (href) {
    return (
      <a className={`tile ${className}`} href={href}>
        {content}
      </a>
    )
  }

  return (
    <article className={`tile ${className}`}>
      {content}
    </article>
  )
}

function SocialTile({
  link,
  icon,
  tone,
}: {
  link: DashboardLink
  icon: ReactNode
  tone: string
}) {
  return (
    <Tile href={link.href} className={`social-tile ${tone}`} icon={icon}>
      <strong>{link.title}</strong>
      <span>{link.description}</span>
    </Tile>
  )
}

export function App() {
  const { data, status } = useDashboardData()
  const [primaryProject, ...secondaryProjects] = data.featured
  const gitHubLink = data.links.find((link) => link.title === "GitHub")
  const emailLink = data.links.find((link) => link.title === "Email")
  const agentsLink = data.links.find((link) => link.title === "For agents")
  const fullSiteLink = data.links.find((link) => link.title === "Full site")
  const [steps, sleep, workout] = data.health.metrics

  return (
    <main className="bento-page">
      <header className="profile-header">
        <a className="avatar" href={data.profile.fullSite} aria-label={`${data.profile.name} full site`}>
          <span>A</span>
        </a>
        <div>
          <h1>{data.profile.name}</h1>
          <p className="handle">@{data.profile.handle}</p>
          <p>{data.profile.headline}</p>
        </div>
        <nav className="profile-actions" aria-label="Primary links">
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
        </nav>
      </header>

      <section className="tiles" aria-label="Aarekaz Bento links">
        {primaryProject ? (
          <Tile
            href={primaryProject.href}
            className="project-tile tile-large lavender"
            icon={<Code2 size={17} />}
            label={primaryProject.accent}
            title={primaryProject.title}
          >
            <p>{primaryProject.description}</p>
            <div className="code-preview" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </Tile>
        ) : null}

        <Tile
          className="health-tile tile-tall mint"
          icon={<HeartPulse size={17} />}
          label="Apple Health"
          title={steps?.value ?? "sync"}
        >
          <p>{steps?.label ?? "Steps"}</p>
          <div className="health-rings" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="mini-metrics">
            <span>{sleep?.label ?? "Sleep"}: {sleep?.value ?? "sync"}</span>
            <span>{workout?.label ?? "Workout"}: {workout?.value ?? "sync"}</span>
          </div>
        </Tile>

        <Tile className="now-tile peach" icon={<Radio size={17} />} label="Now" title={data.now.status}>
          <p>{data.now.focus}</p>
        </Tile>

        <Tile
          href={data.writing.href}
          className="writing-tile tile-wide paper"
          icon={<Newspaper size={16} />}
          label={data.writing.accent}
          title={data.writing.title}
        >
          <p>{data.writing.description}</p>
        </Tile>

        {gitHubLink ? <SocialTile link={gitHubLink} icon={<Github size={20} />} tone="ink" /> : null}
        {emailLink ? <SocialTile link={emailLink} icon={<Mail size={20} />} tone="butter" /> : null}
        {agentsLink ? <SocialTile link={agentsLink} icon={<Bot size={20} />} tone="blue" /> : null}

        {secondaryProjects.map((project) => (
          <Tile
            href={project.href}
            key={project.title}
            className="project-small"
            icon={<Activity size={16} />}
            label={project.accent}
            title={project.title}
          >
            <p>{project.description}</p>
          </Tile>
        ))}

        <Tile
          href={fullSiteLink?.href}
          className="site-tile tile-wide sky"
          icon={<Sparkles size={17} />}
          label="anuragd.me"
          title="The full archive"
        >
          <p>{fullSiteLink?.description}</p>
          <div className="page-stack" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </Tile>

        <Tile className="location-tile" icon={<MapPin size={17} />} label="Location" title={data.profile.location}>
          <p>{status === "ready" ? "Dynamic feed loaded" : data.health.updated}</p>
        </Tile>
      </section>
    </main>
  )
}
