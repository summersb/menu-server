import client from "prom-client";
import { pool } from "./db";

const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Gauge metrics for Postgres pool
export const poolTotal = new client.Gauge({
  name: "pg_pool_total",
  help: "Total pool clients",
  labelNames: ["app"],
});
export const poolIdle = new client.Gauge({
  name: "pg_pool_idle",
  help: "Idle pool clients",
  labelNames: ["app"],
});
export const poolUsed = new client.Gauge({
  name: "pg_pool_used",
  help: "Clients in use",
  labelNames: ["app"],
});
export const poolWaiting = new client.Gauge({
  name: "pg_pool_waiting",
  help: "Waiting requests",
  labelNames: ["app"],
});

export const appId = process.env.APP_ID ?? "default";
// Update metrics every second
setInterval(() => {
  poolTotal.set({ app: appId }, pool.totalCount);
  poolIdle.set({ app: appId }, pool.idleCount);
  poolUsed.set({ app: appId }, pool.totalCount - pool.idleCount);
  poolWaiting.set({ app: appId }, pool.waitingCount);
}, 1000);

// Request counters
export const httpRequestsTotal = new client.Counter({
  name: "http_requests_total",
  help: "Total HTTP requests received",
  labelNames: ["method", "route", "status", "app"],
});

export const httpRequestErrors = new client.Counter({
  name: "http_request_errors_total",
  help: "Total HTTP request errors",
  labelNames: ["method", "route", "status", "app"],
});

export const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status", "app"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

export const authDuration = new client.Histogram({
  name: "auth_duration_seconds",
  help: "Duration of auth bcrypt",
  labelNames: ["app"],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5],
});

[authDuration, httpRequestDuration, httpRequestsTotal, httpRequestErrors, poolTotal, poolIdle, poolUsed, poolWaiting].forEach((m) => register.registerMetric(m));

export default register;
