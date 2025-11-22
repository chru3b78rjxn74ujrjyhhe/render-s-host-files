let miniLSChart, miniFLChart, miniCombinedChart;

// ============================
//    MINI CHART CREATOR
// ============================
function createMiniChart(ctx) {
    return new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '',
                data: [],
                borderWidth: 2,
                fill: false,
                tension: 0.3
            }]
        },
        options: {
            plugins: { legend: { display: false } },
            scales: { x: { display: false }, y: { display: false } },
            animation: { duration: 500, easing: 'easeInOutQuart' }
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    miniLSChart = createMiniChart(document.getElementById("miniLS").getContext("2d"));
    miniFLChart = createMiniChart(document.getElementById("miniFL").getContext("2d"));
    miniCombinedChart = createMiniChart(document.getElementById("miniCombined").getContext("2d"));

    setupMLButtons();
    updateCombined();
    setInterval(updateCombined, 1500);
});

// ============================
//    FETCH COMBINED RISK
// ============================
async function updateCombined() {
    try {
        const respC = await fetch("/api/combined");
        const dC = await respC.json();

        const ls = dC.landslide;
        const fl = dC.flood;
        const comb = dC.combined;

        setRiskBox(document.getElementById("landslideRisk"), ls);
        setRiskBox(document.getElementById("floodRisk"), fl);
        setRiskBox(document.getElementById("combinedRisk"), comb);

        pushAndCap(miniLSChart.data.labels, dC.timestamp);
        pushAndCap(miniLSChart.data.datasets[0].data, ls);
        miniLSChart.update();

        pushAndCap(miniFLChart.data.labels, dC.timestamp);
        pushAndCap(miniFLChart.data.datasets[0].data, fl);
        miniFLChart.update();

        pushAndCap(miniCombinedChart.data.labels, dC.timestamp);
        pushAndCap(miniCombinedChart.data.datasets[0].data, comb);
        miniCombinedChart.update();

        updateStateBox();
    }
    catch (e) {
        console.error("Combined fetch error:", e);
    }
}

// ============================
//   ML CONTROL BUTTON LOGIC
// ============================
function setupMLButtons() {
    const calibBtn = document.getElementById("btnCalibToggle");
    const trainBtn = document.getElementById("btnTrain");

    if (!calibBtn || !trainBtn) return;

    // ---- Calibration Toggle ----
    calibBtn.addEventListener("click", async () => {
        await fetch("/api/calibration", { method: "POST" });

        // Flash button animation
        calibBtn.style.opacity = "0.6";
        setTimeout(() => calibBtn.style.opacity = "1", 300);

        updateStateBox();
    });

    // ---- Training Button ----
    trainBtn.addEventListener("click", async () => {
        await fetch("/api/train", { method: "POST" });

        trainBtn.style.opacity = "0.6";
        setTimeout(() => trainBtn.style.opacity = "1", 300);

        updateStateBox();
    });
}

// ============================
//   STATE DISPLAY (auto update)
// ============================
async function updateStateBox() {
    try {
        const resp = await fetch("/api/state");
        const st = await resp.json();

        const msg = document.getElementById("mlStatusMsg");
        const calibBtn = document.getElementById("btnCalibToggle");

        if (!msg || !calibBtn) return;

        msg.innerText = `${st.message}`;

        // Update button state text + color
        if (st.mode === "calibration" && st.collecting === true) {
            calibBtn.innerText = "■ Stop Calibration";
            calibBtn.style.background = "#f44336";
        } else {
            calibBtn.innerText = "▶ Start Calibration";
            calibBtn.style.background = "#4caf50";
        }

    } catch (e) {
        console.warn("State fetch failed:", e);
    }
}
