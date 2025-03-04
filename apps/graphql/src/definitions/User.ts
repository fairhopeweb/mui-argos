import gqlTag from "graphql-tag";

import type { User } from "@argos-ci/database/models";

import type { Context } from "../context.js";

// eslint-disable-next-line import/no-named-as-default-member
const { gql } = gqlTag;

export const typeDefs = gql`
  type User implements Node & Owner {
    id: ID!
    email: String
    login: String!
    name: String!
    privateSync: Boolean!
    installations: [Installation!]!
    latestSynchronization: Synchronization
    repositoriesNumber: Int!
    repositories(enabled: Boolean): [Repository!]!
    consumptionRatio: Float
    permissions: [Permission!]!
    currentMonthUsedScreenshots: Int!
    plan: Plan
    screenshotsLimitPerMonth: Int
  }

  extend type Query {
    "Get the authenticated user"
    user: User
  }
`;

export const resolvers = {
  Query: {
    user: async (_root: null, _args: Record<string, never>, ctx: Context) => {
      return ctx.user || null;
    },
  },
  User: {
    installations: async (user: User) => {
      return user.$relatedQuery("installations");
    },
    latestSynchronization: async (user: User) => {
      return user.$relatedQuery("synchronizations").first();
    },
  },
};
