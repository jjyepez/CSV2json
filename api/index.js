const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const csvjson = require('csvjson');

require('dotenv').config();

const { getDataByDate } = require('./utils/Data');

const app = express();

console.clear();

app.use(require('morgan')('dev'))
    .use(express.json())
    .use(require('cors')())
    .use('/', express.static(path.join(__dirname, '../public')));

app.get('/', (req, res, next) => {
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
            let dateString = `${('0' + dateArr[2]).substr(-2)}-${(
                '0' + dateArr[1]
            ).substr(-2)}-${dateArr[0]}`;
            data.push(dateString);
            date.setDate(date.getDate() - 1);
        }

        res.json({ today, initDate, diff, data });
    })

    .get('/api/data/:date', async (req, res, next) => {
        let date = req.params['date'].split('-'); //DD-MM-AAAA
        let dateISO = new Date(date[2], date[1] - 1, date[0]);
        let json = {};
        json = await getDataByDate({ date: dateISO });
        res.json({ ...json, dateISO });
    })

    .get('/api/data', async (req, res, next) => {
        const today = new Date();
        let json = {};
        json = await getDataByDate({ date: today, fallback: 'yesterday+' });
        res.json(json);
    })

    .get('/api/countries', async (req, res, next) => {
        let countriesCSVfile = path.join(
            __dirname,
            '../public/data/lists/countries-ISO.csv'
        );
        let content = fs.readFileSync(countriesCSVfile);
        var options = {
            delimiter: '\t',
            quote: '"',
        };
        let dataRaw = csvjson.toObject(content.toString(), options);
        let dataNormalized = {};
        dataRaw.forEach((country) => {
            dataNormalized[country['Código Alfa-3']] = country;
        });
        res.json({
            source: `https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes/blob/master/all/all.csv`,
            local: countriesCSVfile,
            raw: dataRaw,
            data: dataNormalized,
            total: dataRaw.length,
        });
    })

    .get('/api/countries/extras', async (req, res, next) => {
        let countriesCSVfile = path.join(
            __dirname,
            '../public/data/lists/countries.csv'
        );
        let content = fs.readFileSync(countriesCSVfile);
        var options = {
            delimiter: ',',
            quote: '"',
        };
        let dataRaw = csvjson.toObject(content.toString(), options);
        let dataNormalized = {};
        dataRaw.forEach((country) => {
            dataNormalized[country['alpha-3']] = country;
        });
        res.json({
            source: `https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes/blob/master/all/all.csv`,
            local: countriesCSVfile,
            raw: dataRaw,
            data: dataNormalized,
            total: dataRaw.length,
        });
    })

    .get('/api/countries/coords', async (req, res, next) => {
        let countriesCSVfile = path.join(
            __dirname,
            '../public/data/lists/countries_coords.csv'
        );
        let content = fs.readFileSync(countriesCSVfile);
        var options = {
            delimiter: '\t',
            quote: '"',
        };
        let dataRaw = csvjson.toObject(content.toString(), options);
        let dataNormalized = {};
        dataRaw.forEach((country) => {
            dataNormalized[country['country']] = country;
        });
        res.json({
            source: `https://github.com/lukes/ISO-3166-Countries-with-Regional-Codes/blob/master/all/all.csv`,
            local: countriesCSVfile,
            raw: dataRaw,
            data: dataNormalized,
            total: dataRaw.length,
        });
    })

    .get('*', (req, res, next) => {
        res.send('404');
    });

let port = process.env.EXPRESS_PORT || 8080;
http.createServer(app).listen(port, () => {
    console.log(`http://localhost:${port}`);
}); //the server object listens on port 8080
