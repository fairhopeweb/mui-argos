/* eslint-disable @typescript-eslint/no-namespace */
import * as authorization from "auth-header";
import type { RequestHandler } from "express";
// @ts-ignore
import { HttpError } from "express-err";

declare global {
  namespace Express {
    interface Request {
      bearerToken?: string;
    }
  }
}

const parseAuthHeader = (authHeader: string) => {
  try {
    return authorization.parse(authHeader);
  } catch (error) {
    const httpError = new HttpError(400, `Invalid authorization header`);
    httpError.cause = httpError;
    throw httpError;
  }
};

export const bearerAuth: RequestHandler = (req, _res, next) => {
  const authHeader = req.get("authorization");

  if (!authHeader) {
    throw new HttpError(400, `Authorization header is missing`);
  }

  const authorization = parseAuthHeader(authHeader);

  if (authorization.scheme !== "Bearer") {
    throw new HttpError(
      400,
      `Invalid authorization header scheme "${authorization.scheme}", please use "Bearer"`
    );
  }
  req.bearerToken = authorization.token as string;
  next();
};
