#!/usr/bin/env node
import { callbackify } from "node:util";

import { Build } from "@argos-ci/database/models";
import logger from "@argos-ci/logger";

import { job as buildJob } from "../job.js";

const main = callbackify(async () => {
  const builds = await Build.query().where({ jobStatus: "pending" });
  await Promise.all(builds.map((build) => buildJob.push(build.id)));
  logger.info(`${builds.length} builds pushed in queue`);
  process.kill(process.pid);
});

main((err) => {
  if (err) throw err;
});
