import { API } from "@/shared/config/api-routes";
import { fail, guard } from "@/shared/lib/result";
import { http } from "@/shared/lib/http";
import { periodBlocker, type ConnectionReport } from "../domain/connection-time";

export interface BackendConnection {
  from: string;
  to: string;
  drivers: Array<{ driverId: string; days: Array<{ date: string; totalSeconds: number }>; grandTotalSeconds: number }>;
}

export const toReport = (r: BackendConnection): ConnectionReport => ({
  from: r.from,
  to: r.to,
  drivers: r.drivers.map((d) => ({ driverId: d.driverId, days: d.days.map((x) => ({ date: x.date, seconds: x.totalSeconds })), totalSeconds: d.grandTotalSeconds })),
});

export const connectionUseCases = {
  report: async (from: string, to: string) => {
    const blocker = periodBlocker(from, to);
    if (blocker) return fail<never>("validation", blocker);
    return guard(async () => toReport(await http.get<BackendConnection>(API.drivers.connectionTime, { from, to })));
  },
};
