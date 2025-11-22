let soil1Chart, soil2Chart, tiltChart, vibChart;

function createLine(ctx, label, opts={}) {
    return new Chart(ctx, {
        type: 'line',
        data: { labels: [], datasets: [{ label: label, data: [], fill: false }] },
        options: {
            animation: { duration: 600, easing: 'easeInOutQuart' },
            scales: {
                y: { beginAtZero: false }
            },
            plugins: { legend: { display: true } }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    soil1Chart = createLine(document.getElementById("soil1").getContext("2d"), "Soil 1");
    soil2Chart = createLine(document.getElementById("soil2").getContext("2d"), "Soil 2");
    tiltChart = createLine(document.getElementById("tiltGraph").getContext("2d"), "Tilt");
    vibChart = createLine(document.getElementById("vibration").getContext("2d"), "Vibration");

    fetchAndUpdate();
    setInterval(fetchAndUpdate, 1000);
});

async function fetchAndUpdate() {
    const resp = await fetch("/api/landslide");
    const data = await resp.json();

    // fill full series on first run (if empty)
    if (soil1Chart.data.labels.length === 0) {
        soil1Chart.data.labels = data.labels.slice();
        soil1Chart.data.datasets[0].data = data.soil1.slice();
        soil2Chart.data.labels = data.labels.slice();
        soil2Chart.data.datasets[0].data = data.soil2.slice();
        tiltChart.data.labels = data.labels.slice();
        tiltChart.data.datasets[0].data = data.tilt.slice();
        vibChart.data.labels = data.labels.slice();
        vibChart.data.datasets[0].data = data.vibration.slice();

        soil1Chart.update(); soil2Chart.update(); tiltChart.update(); vibChart.update();
    } else {
        // push latest point only
        const t = data.labels[data.labels.length-1];
        pushAndCap(soil1Chart.data.labels, t);
        pushAndCap(soil1Chart.data.datasets[0].data, data.soil1[data.soil1.length-1]);

        pushAndCap(soil2Chart.data.labels, t);
        pushAndCap(soil2Chart.data.datasets[0].data, data.soil2[data.soil2.length-1]);

        pushAndCap(tiltChart.data.labels, t);
        pushAndCap(tiltChart.data.datasets[0].data, data.tilt[data.tilt.length-1]);

        pushAndCap(vibChart.data.labels, t);
        pushAndCap(vibChart.data.datasets[0].data, data.vibration[data.vibration.length-1]);

        soil1Chart.update(); soil2Chart.update(); tiltChart.update(); vibChart.update();
    }

    // rain text
    document.getElementById("rainStatus").innerText = data.rain[data.rain.length-1] ? "Raining" : "No Rain";

    // landslide danger box
    setRiskBox(document.getElementById("landslideDanger"), data.landslide_danger);
}
