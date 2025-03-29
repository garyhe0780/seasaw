import { Seasaw, type Operation } from "seasaw"
import { type } from "arktype";

const app = new Seasaw({ 
  port: 3001
});


app.get("/", () => Response.json("Hello, 世界"))

const authDTO = type({
  email: "string.email",
  password: "string",
});


app.post("/auth/login", async ({ req, body, params }) => {
  console.log(body);
  return Response.json(true)
}, {
  body: authDTO
})

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
