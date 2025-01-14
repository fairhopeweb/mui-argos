/* eslint-disable @typescript-eslint/no-namespace */
import * as authorization from "auth-header";
import type { Request, RequestHandler } from "express";

import { User } from "@argos-ci/database/models";

import { verifyJWT } from "../jwt.js";
import { asyncHandler } from "../util.js";

declare global {
  namespace Express {
    interface Request {
      token?: string | null;
      user?: User | null;
    }
  }
}

const parseAuthBearerToken = (req: Request) => {
  try {
    const header = req.get("authorization");
    if (!header) return null;
    const auth = authorization.parse(header);
    if (!auth) return null;
    if (auth.scheme !== "Bearer") return null;
    if (typeof auth.token !== "string") return null;
    return auth.token as string;
  } catch {
    return null;
  }
};

const bearerToken: RequestHandler = (req, _res, next) => {
  const token = parseAuthBearerToken(req);
  req.token = token ?? null;
  next();
};

const getUserFromToken = async (token: string | null) => {
  if (!token) return null;
  const jwt = verifyJWT(token);
  if (!jwt) return null;
  const user = await User.query().findById(jwt.id);
  return user ?? null;
};

const loggedUser = asyncHandler(async (req, _res, next) => {
  const user = await getUserFromToken(req.token ?? null);
  req.user = user;
  next();
});

export const auth = [bearerToken, loggedUser];
