import pino, { type LoggerOptions } from "pino";

const isProd = process.env.NODE_ENV === "production";

const loggerOptions: LoggerOptions = {
  level: process.env.LOG_LEVEL ?? (isProd ? "info" : "debug"),
  redact: {
    paths: ["req.headers.authorization", "password", "token"],
    remove: true,
  },
  ...(!isProd
    ? {
      transport: {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          singleLine: true,
        },
      },
    }
    : {}),
};

export const logger = pino(loggerOptions);