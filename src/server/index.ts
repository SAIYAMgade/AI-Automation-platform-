import { createExpressApp } from "@/server/express-app";
import { logger } from "@/lib/logger";

const port = Number(process.env.PORT ?? 4000);
const app = createExpressApp();

app.listen(port, () => {
  logger.info({ port }, "BookLeaf Express API adapter listening");
});
