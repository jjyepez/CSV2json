const express = require("express");
const http = require("http");
const path = require('path');

require("dotenv").config();

const { getDataByDate } = require('./utils/Data');

const app = express();

console.clear();

app
  .use(express.json())
  .use(require("morgan")('dev'))
  .use('/', express.static(path.join(__dirname, '../public')));

app
  .get('/', (req, res, next) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  })

  .get('/api/dates', (req, res, next) => {
    let data = [];
    let today = new Date();
    let initDate = new Date(2020, 0, 22);
    let diff = ~~((today - initDate) / 1000 / 3600 / 24);

    let date = new Date(today);
    for (let i = 0; i <= diff; i++) {

      let dateArr = date.toLocaleDateString('es-CO').split('-');
      let dateString = `${('0' + dateArr[2]).substr(-2)}-${('0' + dateArr[1]).substr(-2)}-${dateArr[0]}`;
      data.push(dateString);
      date.setDate(date.getDate() - 1);
    }

    res.json({ today, initDate, diff, data })
  })

  .get("/api/data", async (req, res, next) => {
    const today = new Date();
    let json = {};
    json = await getDataByDate({ date: today, fallback: "yesterday+" });
    res.json(json);
  })

  .get("/api/data/:date", async (req, res, next) => {
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
