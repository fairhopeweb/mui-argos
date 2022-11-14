import * as Sentry from "@sentry/node";
import express from "express";
// @ts-ignore
import { formatters } from "express-err";

import { errorHandler } from "../middlewares/errorHandler.js";
import auth from "./auth.js";
import builds from "./builds.js";
import v2 from "./v2/index.js";
import webhooks from "./webhooks.js";
import { screenshots } from "./screenshot.js";

export const installApiRouter = (app: express.Application) => {
  const router = express.Router();

  router.use("/v2", v2);
  router.use(builds);
  router.use(auth);
  router.use(webhooks);
  router.use("/screenshots", screenshots);

  router.use(Sentry.Handlers.errorHandler());

  router.use(
    errorHandler({
      formatters: {
        json: formatters.json,
        default: formatters.json,
      },
    })
  );

  app.use(router);
};