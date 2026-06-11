import { Bot, BriefcaseBusiness, Code2, Database, Github, Mail, NotebookPen, Radio } from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type ModulePart = {
  id: string
  label: string
  title: string
  description: string
  href: string
  icon: LucideIcon
  figure: string
  x: number
  y: number
}

export const moduleParts: ModulePart[] = [
  {
    id: "shell",
    label: "identity shell",
    title: "Anurag Dhungana",
    description: "ML engineer, MSCS at GWU, builder of agent infrastructure and personal systems.",
    href: "https://www.anuragd.me/",
    icon: BriefcaseBusiness,
    figure: "FIG-001",
    x: 72,
    y: 14,
  },
  {
    id: "bus",
    label: "agent bus",
    title: "Shrimp",
    description: "Open source agent harness for memory, tools, sub-agents, browser control, and app integrations.",
    href: "https://github.com/Aarekaz/shrimp",
    icon: Code2,
    figure: "FIG-002",
    x: 78,
    y: 32,
  },
  {
    id: "archive",
    label: "archive plate",
    title: "Projects",
    description: "A compact index of shipped work: Metro MCP, Session Base, SEAS Search, Personal API, and more.",
    href: "https://www.anuragd.me/projects",
    icon: Github,
    figure: "FIG-003",
    x: 73,
    y: 52,
  },
  {
    id: "memory",
    label: "memory plate",
    title: "Writing",
    description: "Notes on agent harnesses, the body around the model, building hard things, and learning in public.",
    href: "https://www.anuragd.me/blog",
    icon: NotebookPen,
    figure: "FIG-004",
    x: 14,
    y: 54,
  },
  {
    id: "core",
    label: "api core",
    title: "Personal API",
    description: "Cloudflare Workers, D1, and R2 as the source of truth behind the public site and private OS.",
    href: "https://github.com/Aarekaz/api",
    icon: Database,
    figure: "FIG-005",
    x: 17,
    y: 34,
  },
  {
    id: "agents",
    label: "machine context",
    title: "llms.txt",
    description: "A readable map for agents: pages, markdown twins, projects, writing, and current public context.",
    href: "https://www.anuragd.me/llms.txt",
    icon: Bot,
    figure: "FIG-006",
    x: 15,
    y: 17,
  },
  {
    id: "now",
    label: "signal port",
    title: "Now",
    description: "Current focus, learning, projects, reading, and the active layer of the system.",
    href: "https://www.anuragd.me/now",
    icon: Radio,
    figure: "FIG-007",
    x: 82,
    y: 72,
  },
  {
    id: "contact",
    label: "write port",
    title: "Contact",
    description: "For useful notes, roles, collaborations, and strange good ideas.",
    href: "mailto:hey@anuragd.me",
    icon: Mail,
    figure: "FIG-008",
    x: 14,
    y: 76,
  },
]
