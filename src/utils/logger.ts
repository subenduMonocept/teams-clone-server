import winston from "winston";
import path from "path";

const logFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const logger = winston.createLogger({
  level: "info",
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, "../../error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(__dirname, "../../combined.log"),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export const logError = (error: Error, req?: any) => {
  logger.error("Error occurred", {
    error: {
      message: error.message,
      stack: error.stack,
    },
    request: req && {
      method: req.method,
      url: req.url,
      body: req.body,
      query: req.query,
      params: req.params,
      ip: req.ip,
    },
    timestamp: new Date().toISOString(),
  });
};

export const logInfo = (message: string, meta?: any) => {
  logger.info(message, {
    ...meta,
    timestamp: new Date().toISOString(),
  });
};

export default logger;
