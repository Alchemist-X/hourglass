import { randomUUID } from "node:crypto";
import { artifacts, getDb, getOverview, getPublicPositions } from "@autopoly/db";
import { loadConfig } from "../config.js";
import { buildBacktestReportArtifact } from "../lib/portfolio-report-artifacts.js";

export async function runBacktestJob() {
  const config = loadConfig();
  const db = getDb();
  const [overview, positions] = await Promise.all([getOverview(), getPublicPositions()]);
  const timestamp = new Date().toISOString();
  const artifact = await buildBacktestReportArtifact({
    config,
    generatedAtUtc: timestamp,
    runId: randomUUID(),
    overview,
    positions
  });

  await db.insert(artifacts).values({
    id: randomUUID(),
    runId: null,
    kind: artifact.kind,
    title: artifact.title,
    path: artifact.path,
    content: artifact.content,
    publishedAtUtc: new Date(timestamp)
  });
}
