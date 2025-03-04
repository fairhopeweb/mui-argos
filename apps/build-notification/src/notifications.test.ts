/* eslint-disable jest/no-disabled-tests */
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  BuildNotification,
  UserRepositoryRight,
} from "@argos-ci/database/models";
import type {
  Build,
  Organization,
  Repository,
  ScreenshotBucket,
  User,
} from "@argos-ci/database/models";
import { factory, useDatabase } from "@argos-ci/database/testing";
import {
  TEST_GITHUB_USER_ACCESS_TOKEN,
  usePlayback,
} from "@argos-ci/github/testing";

import { job as buildNotificationJob } from "./job.js";
import {
  processBuildNotification,
  pushBuildNotification,
} from "./notifications.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));

describe.skip("notifications", () => {
  useDatabase();
  usePlayback({
    fixtures: join(__dirname, "../__fixtures__"),
    name: "notifications.json",
    mode: "dryrun",
    // mode: 'record',
  });

  describe("#pushBuildNotification", () => {
    let build: Build;

    beforeEach(async () => {
      build = await factory.create<Build>("Build");
    });

    it("should create a build notification and add a job", async () => {
      const buildNotification = await pushBuildNotification({
        buildId: build.id,
        type: "progress",
      });

      await buildNotification.reload();

      expect(buildNotification.type).toBe("progress");
      expect(buildNotification.buildId).toBe(build.id);
      expect(buildNotificationJob.push).toBeCalledWith(buildNotification.id);
    });
  });

  describe("#processBuildNotification", () => {
    describe("repository linked to an organization", () => {
      let build: Build;

      beforeEach(async () => {
        const user = await factory.create<User>("User", {
          login: "neoziro",
          accessToken: TEST_GITHUB_USER_ACCESS_TOKEN,
        });
        const organization = await factory.create<Organization>(
          "Organization",
          {
            login: "argos-ci",
          }
        );
        const repository = await factory.create<Repository>("Repository", {
          name: "test-repository",
          organizationId: organization.id,
        });
        await factory.create("UserRepositoryRight", {
          userId: user.id,
          repositoryId: repository.id,
        });
        const compareScreenshotBucket = await factory.create<ScreenshotBucket>(
          "ScreenshotBucket",
          { commit: "e8f58427ebe378ba73dea669c975122fcb8cb9cf" }
        );
        build = await factory.create<Build>("Build", {
          id: "750", // Build id will be in request params
          repositoryId: repository.id,
          compareScreenshotBucketId: compareScreenshotBucket.id,
        });
      });

      it("should notify GitHub", async () => {
        const buildNotification = await factory.create<BuildNotification>(
          "BuildNotification",
          {
            buildId: build.id,
            type: "progress",
            jobStatus: "pending",
          }
        );

        const result = await processBuildNotification(buildNotification);
        expect(result!.data.id).not.toBeUndefined();
        expect(result!.data.description).toBe("Build in progress...");
        expect(result!.data.state).toBe("pending");
        expect(result!.data.target_url).toBe(
          `http://app.test.argos-ci.com/argos-ci/test-repository/builds/${build.number}`
        );
      });
    });

    describe("repository linked to a user", () => {
      let build: Build;

      beforeEach(async () => {
        const user = await factory.create<User>("User", {
          login: "neoziro",
          accessToken: TEST_GITHUB_USER_ACCESS_TOKEN,
        });
        const repository = await factory.create<Repository>("Repository", {
          name: "argos-test-repository",
          userId: user.id,
        });
        await factory.create("UserRepositoryRight", {
          userId: user.id,
          repositoryId: repository.id,
        });
        const compareScreenshotBucket = await factory.create<ScreenshotBucket>(
          "ScreenshotBucket",
          { commit: "77a0572157705698e4bfd26ce01a59029e8100d8" }
        );
        build = await factory.create<Build>("Build", {
          id: "750", // Build id will be in request params
          repositoryId: repository.id,
          compareScreenshotBucketId: compareScreenshotBucket.id,
        });
      });

      it("should create a status", async () => {
        const buildNotification = await factory.create<BuildNotification>(
          "BuildNotification",
          {
            buildId: build.id,
            type: "progress",
            jobStatus: "pending",
          }
        );
        const result = await processBuildNotification(buildNotification);
        expect(result!.data.context).toBe("argos");
        expect(result!.data.state).toBe("pending");
        expect(result!.data.target_url).toBe(
          `http://app.test.argos-ci.com/neoziro/argos-test-repository/builds/${build.number}`
        );
      });
    });

    describe("repository with invalid token", () => {
      let build: Build;
      let user: User;

      beforeEach(async () => {
        user = await factory.create<User>("User", {
          login: "neoziro",
          accessToken: "invalid-token",
        });
        const organization = await factory.create<Organization>(
          "Organization",
          {
            login: "argos-ci",
          }
        );
        const repository = await factory.create<Repository>("Repository", {
          name: "test-repository",
          organizationId: organization.id,
        });
        await factory.create<UserRepositoryRight>("UserRepositoryRight", {
          userId: user.id,
          repositoryId: repository.id,
        });
        const compareScreenshotBucket = await factory.create<ScreenshotBucket>(
          "ScreenshotBucket",
          { commit: "e8f58427ebe378ba73dea669c975122fcb8cb9cf" }
        );
        build = await factory.create<Build>("Build", {
          id: "750", // Build id will be in request params
          repositoryId: repository.id,
          compareScreenshotBucketId: compareScreenshotBucket.id,
        });
      });

      it("should remove rights, add a sync job and add a build job", async () => {
        expect.assertions(4);
        const buildNotification = await factory.create<BuildNotification>(
          "BuildNotification",
          {
            buildId: build.id,
            type: "progress",
            jobStatus: "pending",
          }
        );

        await processBuildNotification(buildNotification);

        // Rights removed
        const userRepositoryRights = await UserRepositoryRight.query();
        expect(userRepositoryRights).toHaveLength(0);

        // Build notification job
        const newBuildNotification = await BuildNotification.query()
          .whereNot({
            id: buildNotification.id,
          })
          .first();

        expect(newBuildNotification).toBeDefined();
        expect(newBuildNotification!.type).toBe("progress");
        expect(newBuildNotification!.buildId).toBe(build.id);
      });
    });
  });
});
