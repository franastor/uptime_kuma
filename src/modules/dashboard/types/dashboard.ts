export interface DashboardSummary {
  total: number;
  up: number;
  down: number;
  pending: number;
  paused: number;
  unknown: number;
  averagePing: number | null;
  activeIncidents: number;
}
