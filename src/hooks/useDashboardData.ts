import { useEffect, useState } from "react"
import { dashboardFeedUrl, fallbackDashboard, type DashboardData } from "../data"

type DashboardState = {
  data: DashboardData
  status: "loading" | "ready" | "fallback"
}

function isDashboardData(value: unknown): value is DashboardData {
  if (!value || typeof value !== "object") return false
  const data = value as Partial<DashboardData>
  return Boolean(data.profile && data.now && data.health && data.featured && data.writing && data.links)
}

export function useDashboardData(): DashboardState {
  const [state, setState] = useState<DashboardState>({
    data: fallbackDashboard,
    status: "loading",
  })

  useEffect(() => {
    const controller = new AbortController()

    async function loadDashboard() {
      try {
        const response = await fetch(dashboardFeedUrl, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        })

        if (!response.ok) throw new Error(`Dashboard feed returned ${response.status}`)
        const json = (await response.json()) as unknown
        if (!isDashboardData(json)) throw new Error("Dashboard feed shape is invalid")

        setState({ data: json, status: "ready" })
      } catch (error) {
        if (controller.signal.aborted) return
        console.info("Using fallback dashboard data", error)
        setState({ data: fallbackDashboard, status: "fallback" })
      }
    }

    loadDashboard()

    return () => controller.abort()
  }, [])

  return state
}
