const express = require("express");
const client = require("prom-client");
const winston = require("winston");

// Prometheus metrics
const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

const httpRequestDurationMicroseconds = new client.Histogram({
  name: "http_request_duration_ms",
  help: "Duration of HTTP requests in ms",
  labelNames: ["method", "route", "code"],
  buckets: [50, 100, 200, 500, 1000],
});

const app = express();
app.use(express.json());

// Structured logger (console JSON)
const logger = winston.createLogger({
  level: "info",
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Simple routes
app.get("/", (req, res) => res.send("Banking API is alive"));
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

// Simulated banking endpoints
app.get("/account/:id", (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  // Simulate processing
  const account = { id: req.params.id, balance: 1200.5 };
  logger.info("get_account", {
    route: "/account/:id",
    accountId: req.params.id,
  });
  res.json(account);
  end({ method: req.method, route: "/account/:id", code: res.statusCode });
});

app.post("/transfer", (req, res) => {
  const end = httpRequestDurationMicroseconds.startTimer();
  // simple validation
  if (!req.body.from || !req.body.to || !req.body.amount) {
    logger.warn("invalid_transfer_request", { body: req.body });
    res.status(400).json({ error: "invalid" });
    end({ method: req.method, route: "/transfer", code: res.statusCode });
    return;
  }
  // simulate transfer
  logger.info("transfer", {
    from: req.body.from,
    to: req.body.to,
    amount: req.body.amount,
  });
  res.json({ status: "success" });
  end({ method: req.method, route: "/transfer", code: res.statusCode });
});

// Metrics endpoint
app.get("/metrics", async (req, res) => {
  res.set("Content-Type", client.register.contentType);
  res.end(await client.register.metrics());
});

// Simulate intermittent failure endpoint (for alerts testing)
let flip = true;
app.get("/maybe-down", (req, res) => {
  flip = !flip;
  if (flip) {
    logger.error("simulated_failure", { route: "/maybe-down" });
    res.status(500).send("boom");
  } else {
    res.send("ok");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  logger.info("server_started", { port });
  console.log(`Listening ${port}`);
});
