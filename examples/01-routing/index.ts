import { getParam, Seasaw, type Operation } from "seasaw"
import Home from "./index.html"
import { BunRequest } from "bun";

const app = new Seasaw({ 
  port: 3001
});


app.use(function* ({req}) {
  const url = new URL(req.url)

  console.log(url.pathname);
});


app.static("/plain", Response.json("Hello, 世界"))
app.static("/html", Home)
app.get("/", () => Response.json("Hello, 世界"))
app.get("/user/:id", ({ req }) => {
  const id = getParam(req, "id")

  return Response.json({
    name: "gary",
    age: 18,
  })
});

app.get("/generator", function* () {
  return Response.json({
    name: "gary",
    age: 18,
  })
});

function* handleUser(): Operation<Response> {
  return Response.json({
    name: "gary",
    age: 18,
  })
}

app.get("/user", handleUser)

app.start(() => {
  console.log(`App is running at ${app.server?.hostname}:${app.server?.port}`);
})
