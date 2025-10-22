import { app } from "./app";
import { env } from "./config/env";

const start = async () => {
  app.listen(env.port, () => {
    console.log(`Server listening on port ${env.port}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
