import express, { Application } from "express";
import cors from "cors";
import routes from "./routes";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler";

export function createApp(): Application {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.use("/v1", routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
