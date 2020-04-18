(async () => await init())();

async function init() {
    let json = await fetch('/api/dates').then((rslt) => rslt.json());
    let dates = json.data || [];
    let selectDates = document.getElementById('selectDates');
    dates.forEach((date) => {
        let option = document.createElement('option');
        option.value = date;
        option.text = date;
        selectDates.appendChild(option);
    });
    selectDates.addEventListener('change', async function (ev) {
        let lista = this;
        let selectedDate = lista.options[lista.selectedIndex].value;

        const urlEndpoint = `/api/data/${selectedDate}`;
        const json = await fetch(urlEndpoint).then((rslt) => rslt.json());

        console.log({ raw: json });

        let jsonData = json.data;

        let keys = jsonData[0] || []; // se asume que el elemento 0 tiene los nombres de campos
        jsonData.shift();

        let allowedKeys = [
            'Country_Region',
            'Country/Region',
            'Country',
            'Confirmed',
            'Deaths',
            'Recovered',
        ];
        let ids = keys
            .map((key, i) => (allowedKeys.includes(key) ? i : undefined))
            .filter((x) => x);

        jsonData = arrayRemoveElements(jsonData, ids);

        console.log({ rawJsD: jsonData });

        let calcActives = function (current) {
            if (
                typeof total == 'undefined' ||
                typeof total[selectedDate] == 'undefined' ||
                typeof total[selectedDate][current[0]] == 'undefined'
            ) {
                total = {};
                total[selectedDate] = {};
                total[selectedDate][current[0]] = 0;
            }
            total[selectedDate][current[0]] +=
                parseFloat(current[1]) -
                parseFloat(current[2]) -
                parseFloat(current[3]);

            return total[selectedDate][current[0]];
        };
        let calcDiffDeaths = 0; //function (prev, current) { return parseFloat(current[2]) - parseFloat(prev[2]) };
        let calcDiffConfirm = 0; //function (prev, current) { return parseFloat(current[1]) - parseFloat(prev[1]) };
        let calcDiffRecovered = 0; //function (prev, current) { return parseFloat(current[3]) - parseFloat(prev[3]) };

        //jsonData = arrayFilterBy(jsonData, 0, 'US');

        // ordenar por país
        jsonData.sort((a, b) => {
            return b[0] < a[0] ? -1 : b[0] > a[0] ? 1 : 0;
        });

        console.log({ rawJsDS: jsonData });

        jsonData = arrayGroupBy(jsonData, 0, [
            1,
            2,
            3,
            calcActives,
            calcDiffConfirm,
            calcDiffDeaths,
            calcDiffRecovered,
        ]);

        window.data = jsonData;

        json2table({
            json: jsonData,
            selector: '#data',
            callback: (selector) => initDataTable(selector),
        });
    });
}

function initDataTable(selector) {
    selector = `.display`;
    try {
        $(selector).DataTable().destroy();
    } catch {}
    $(selector).DataTable({
        order: [[1, 'desc']],
        scrollY: 500,
        pageLength: 50,
        formatNumber: function (toFormat) {
            return toFormat.toString().replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        },
    });
}

function getArgs(func) {
    // --- Source: https://davidwalsh.name/javascript-arguments
    // First match everything inside the function argument parens.
    var args = func.toString().match(/function\s.*?\(([^)]*)\)/)[1];

    // Split the arguments string into an array comma delimited.
    return args
        .split(',')
        .map(function (arg) {
            // Ensure no inline comments are parsed and trim the whitespace.
            return arg.replace(/\/\*.*\*\//, '').trim();
        })
        .filter(function (arg) {
            // Ensure no undefined values are added.
            return arg;
        });
}

function arrayFilterBy(arrayIn, id, filterStr) {
    return arrayIn.filter((item) => item[id] === filterStr);
}

function arrayGroupBy(arrayIn, id, aggIds = []) {
    let objOut = {};
    let prevRow = [];
    arrayIn.forEach((row, j) => {
        if (!objOut[row[id]]) {
            objOut[row[id]] = new Array(aggIds.length).fill(0);
        }
        let rowOut = row.map((r) => r);

        let i = 0;
        aggIds.forEach((idAgg) => {
            if (idAgg !== id) {
                if (typeof idAgg === 'function') {
                    if (getArgs(idAgg).length === 1) {
                        objOut[row[id]][i] = idAgg(row);
                    } else if (getArgs(idAgg).length === 2) {
                        objOut[row[id]][i] = idAgg(prevRow, row);
                    } else {
                        alert('error');
                    }
                } else {
                    objOut[row[id]][i] += parseFloat(0 + rowOut[idAgg]);
                }
                i++;
            }
        });
        prevRow = row;
    });
    let arrOut = Object.keys(objOut).map((key) => {
        return [key, ...objOut[key]];
    });
    return arrOut;
}

function arrayRemoveElements(array, ids) {
    if (!ids) return array;
    let arrayOut = array.map((record) => {
        return record.filter((_, i) => ids.includes(i));
    });
    return arrayOut;
}

function json2table({ json, selector, callback }) {
    document.querySelector(selector).innerHTML = '';
    let html = '';
    html = JSON.stringify(json);

    let table = document.createElement('table');
    let tbody = document.createElement('tbody');
    let thead = document.createElement('thead');
    thead.innerHTML = `
        <tr>
        <th>Country</th>
        <th>Confirmed</th>
        <th>Deaths</th>
        <th>Recovered</th>
        <th>Active</th>
        <th>Confirmed Diff</th>
        <th>Deaths Diff</th>
        <th>Recovered Diff</th>
        </tr>
    `;
    table.setAttribute('id', `${selector}__DataTable`);
    table.classList.add('display');
    table.classList.add('stripe');
    json.forEach((row) => {
        let tr = document.createElement('tr');
        row.forEach((value) => {
            let td = document.createElement('td');
            td.innerText = value;
            tr.append(td);
        });
        tbody.append(tr);
    });
    table.append(thead);
    table.append(tbody);
    document.querySelector(selector).append(table);
    callback && callback(selector, json);
}
