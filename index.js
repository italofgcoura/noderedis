const express = require("express");

const { stringify } = require("querystring");

const axios = require("axios");

const redis = require("redis");

const util = require("util");

const REDISURL = "redis://127.0.0.1:6379";

const client = redis.createClient(REDISURL);

const connectRedis = async () => {
  await client.connect();
};
connectRedis();
// client.set = util.promisify(client.set).bind(client);
// client.get = util.promisify(client.get).bind(client);

// client.on("connect", () => {
//   console.log("Redis connected");
// });

const app = express();

app.use(express.json());

app.post("/", async (req, res) => {
  const { key, value } = req.body;
  console.log(key, value);
  const response = await client.set(key, JSON.stringify(value));
  console.log("response", response);
  res.json({ ok: "ok", response: response });
});

app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;

  // to validate if it a id in the Number format
  if (!Number(id)) {
    return res.json({ status: 400, error: "ID must be a number" });
  }

  try {
    const cachedPost = await client.get(`post-${id}`).then((r) => r);

    if (cachedPost) {
      return res.json(JSON.parse(cachedPost));
    }
    // else {
    const response = await axios.get(
      `https://jsonplaceholder.typicode.com/posts/${id}`
    );

    // // setEx recebe como parâmetro também o tempo de expiração
    // await client.setEx(`post-${id}`, 10, JSON.stringify(response.data));

    // set recebe somente a Key e o Value
    await client.set(`post-${id}`, JSON.stringify(response.data));

    return res.json(response.data);
    // }
  } catch (err) {
    return res.json({ status: 404, error: "Not found" });
  }
});

app.get("/", async (req, res) => {
  const { key } = req.body;

  try {
    const r = await client.get(key).then((result) => result);
    res.json(JSON.parse(r));
  } catch (err) {
    res.send({ status: 404, error: "Not Found" });
  }
});

app.get("*", (req, res) => {
  res.send({ status: 404, error: "Endpoint not found" });
});

app.listen(8080, () => {
  console.log("Listening app on port 8080");
});
