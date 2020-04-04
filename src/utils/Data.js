const csvjson = require("csvjson");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

async function getDataByDate({ date, fallback }) {
    const dataSourceURL = process.env.COVID19_DATA_URL;
    const cacheSourceDir = path.resolve(__dirname, `../../public/data/cache`);
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

        console.log({ fallback })
        if (json.data.length <= 1) {
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
        } else {
            fs.writeFileSync(cacheFullname, JSON.stringify(json));
        }
    } else {
        json = JSON.parse(
            fs.readFileSync(cacheFullname, { enconding: "utf8" }).toString()
        );
        json.total = json.data.length;
        json.file = cacheFullname;
        json.cached = true;
    }
    return json;
}

module.exports = {
    getDataByDate
}