import { Seasaw } from "../../packages/seasaw/index.ts";

const app = new Seasaw();

app.start(() => {
  console.log(`App is running at ${app.server?.hostname}:${app.server?.port}`);
});

