(async () => await init())();

async function init() {
    let json = await fetch('//dates').then(rslt => rslt.json());
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

        const urlEndpoint = `//data/${selectedDate}`;
        const json = await fetch(urlEndpoint).then(rslt => rslt.json());

        document.getElementById('data').innerText = JSON.stringify(json.data);
    })
}