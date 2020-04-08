(async () => await init())();

async function init() {
    let json = await fetch('/api/dates').then(rslt => rslt.json());
    let dates = json.data || [];
    let selectDates = document.getElementById('selectDates');
    dates.forEach(date => {
        let option = document.createElement('option');
        option.value = date;
        option.text = date;
        selectDates.appendChild(option);
    })
    selectDates.addEventListener('change', async function (ev) {
        let lista = this;
        let selectedDate = lista.options[lista.selectedIndex].value;

        const urlEndpoint = `/api/data/${selectedDate}`;
        const json = await fetch(urlEndpoint).then(rslt => rslt.json());

        let jsonData = json.data;

        let keys = jsonData[0] || []; // se asume que el elemento 0 tiene los nombres de campos
        let allowedKeys = ['Country_Region', 'Country/Region', 'Country', 'Confirmed', 'Deaths', 'Recovered'];
        let ids = keys.map((key, i) => allowedKeys.includes(key) ? i : undefined).filter(x => x);
        jsonData = arrayRemoveElements(jsonData, ids);

        jsonData = arrayGroupBy(jsonData, 0);

        json2table({
            json: jsonData,
            selector: '#data'
        })
    })
}


function arrayGroupBy(arrayIn, id) {
    let objOut = {};
    arrayIn.forEach(row => {
        if (!objOut[row[id]]) {
            objOut[row[id]] = [0, 0, 0]
        }
        let rowOut = row.map(r => r); rowOut.shift();
        objOut[row[id]][0] += parseFloat(0 + rowOut[0]);
        objOut[row[id]][1] += parseFloat(0 + rowOut[1]);
        objOut[row[id]][2] += parseFloat(0 + rowOut[2]);
    })
    let arrOut = Object.keys(objOut).map(key => {
        return [key, ...objOut[key]];
    })
    return arrOut;
}

function arrayRemoveElements(array, ids) {
    if (!ids) return array;
    let arrayOut = array.map(record => {
        return record.filter((_, i) => ids.includes(i));
    })
    return arrayOut;
}

function json2table({ json, selector }) {

    document.querySelector(selector).innerHTML = '';
    let html = '';
    html = JSON.stringify(json);

    let table = document.createElement('table');
    json.forEach(row => {
        //console.log(row);
        let tr = document.createElement('tr');
        row.forEach(value => {
            let td = document.createElement('td');
            td.innerText = value;
            tr.append(td);
        });
        table.append(tr);
    });
    document.querySelector(selector).append(table);
}