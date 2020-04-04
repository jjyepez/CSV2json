const http = require("http");
const csvjson = require("csvjson");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

require("dotenv").config();

const express = require("express");
const app = express();

console.clear();

app.use(express.json());
app.use(require("morgan")('dev'));

app
  .get("/data", async (req, res, next) => {
    const today = new Date();
    let json = {};
    json = await getDataByDate({ date: today, fallback: "yesterday+" });
    res.json(json);
  })

  .get("/data/:date", async (req, res, next) => {
    let date = req.params['date'].split('-'); //DD-MM-AAAA
    let dateISO = new Date(date[2], date[1] - 1, date[0]);
    let json = {};
    json = await getDataByDate({ date: dateISO });
    res.json({ ...json, dateISO });
  })

  .get("*", (req, res, next) => {
    res.send("404");
  });

let port = process.env.EXPRESS_PORT || 8080;
http.createServer(app).listen(port, () => {
  console.log(`http://localhost:${port}`)
}); //the server object listens on port 8080


async function getDataByDate({ date, fallback }) {
  const dataSourceURL = process.env.COVID19_DATA_URL;
  const cacheSourceDir = path.resolve(__dirname, `../public/data/cache`);
  const filename =
    `0${date.getMonth() + 1}`.substr(-2) +
    "-" +
    `0${date.getDate()}`.substr(-2) +
    "-" +
    `0${date.getFullYear()}`.substr(-4);

  let cacheFullname = `${cacheSourceDir}/${filename}.csv`;

  let cacheExists = fs.existsSync(cacheFullname);

  let json = {};

  if (!cacheExists) {
    let fileFullname = `${dataSourceURL}/${filename}.csv`;
    const content = await fetch(`${fileFullname}`).then(rslt => rslt.text());
    var options = {
      delimiter: ",",
      quote: '"'
    };
    json.data = csvjson.toArray(content.toString(), options);

    if (json.data.length <= 1) {
      console.log({ fallback })
      if (fallback && fallback.includes("yesterday")) {
        let yesterday = new Date(date);
        yesterday.setDate(date.getDate() - 1);
        let options = { date: yesterday };
        if (fallback.includes("+")) {
          options.fallback = "yesterday";
        }
        let json = await getDataByDate(options);
        return json;
      }
    }
    fs.writeFileSync(cacheFullname, JSON.stringify(json));
  } else {
    json.data = JSON.parse(
      fs.readFileSync(cacheFullname, { enconding: "utf8" }).toString()
    );
    json.total = json.data.data.length;
    json.file = cacheFullname;
    json.cached = true;
  }
  return json;
}
