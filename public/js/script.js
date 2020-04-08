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

        json2table({ json: jsonData, selector: '#data' })
    })
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