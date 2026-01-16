document.addEventListener('DOMContentLoaded', () => {

    // Globals
    let plotData = [];

    // Initialize Resize/Drag
    $("#resizable-plot-container").resizable({
        handles: "all",
        stop: function (event, ui) {
            Plotly.relayout('plot-area', {
                width: ui.size.width,
                height: ui.size.height
            });
            // Update inputs
            document.getElementById('graph-w').value = Math.round(ui.size.width);
            document.getElementById('graph-h').value = Math.round(ui.size.height);
        }
    }).draggable();

    // Manual Resize
    document.getElementById('btn-resize').addEventListener('click', () => {
        const w = parseInt(document.getElementById('graph-w').value);
        const h = parseInt(document.getElementById('graph-h').value);
        $("#resizable-plot-container").css({ width: w, height: h });
        Plotly.relayout('plot-area', { width: w, height: h });
    });

    // File Handling
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileList = document.getElementById('file-list');

    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
    fileInput.addEventListener('change', (e) => { handleFiles(e.target.files); });

    function handleFiles(files) {
        const formData = new FormData();
        for (let i = 0; i < files.length; i++) formData.append('files[]', files[i]);

        fetch('/upload', { method: 'POST', body: formData })
            .then(r => r.json())
            .then(data => {
                fileList.innerHTML = '';
                if (data.results) {
                    plotData = [];
                    data.results.forEach(res => {
                        addFileItem(res);
                        if (res.success) processData(res);
                    });
                    generateSeriesControls();
                    updatePlot();
                }
            });
    }

    function addFileItem(res) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `<span>${res.filename}</span> <i class="fa-solid ${res.success ? 'fa-check' : 'fa-xmark'}"></i>`;
        fileList.appendChild(div);
    }

    function processData(res) {
        const d = res.data;
        plotData.push({
            id: 'trace_' + plotData.length,
            name: d.filename.replace('.xlsx', ''),
            thickness: d.thickness,
            angle: d.angle || d.mean_angle,
            std: d.std || d.std_angle || d.std_dev,
            // Styling Config Per Series
            color: getColor(plotData.length),
            fillColor: getColor(plotData.length), // Usually lighter, we calc later
            borderColor: '#333333',
            borderStyle: 'none', // none, solid, dash, dot
            borderWidth: 1
        });
    }

    function getColor(i) {
        const p = ['#bb86fc', '#03dac6', '#cf6679', '#ffb74d', '#4fc3f7', '#aed581'];
        return p[i % p.length];
    }

    function generateSeriesControls() {
        const container = document.getElementById('series-styles');
        container.innerHTML = '<h4>Series Styling</h4>';

        plotData.forEach((series, idx) => {
            const div = document.createElement('div');
            div.className = 'setting-item';
            div.innerHTML = `
                <div style="font-weight:600; margin-bottom:5px; font-size:0.8rem;">${series.name}</div>
                <div class="flex-row">
                    <div style="flex:1">
                        <label>Line Color</label>
                        <input type="color" value="${series.color}" onchange="updateSeriesStyle(${idx}, 'color', this.value)" style="width:100%; height:25px;">
                    </div>
                     <div style="flex:1">
                        <label>Border Line</label>
                        <select onchange="updateSeriesStyle(${idx}, 'borderStyle', this.value)" style="font-size:0.8rem; padding:2px;">
                            <option value="none" ${series.borderStyle == 'none' ? 'selected' : ''}>None</option>
                            <option value="solid" ${series.borderStyle == 'solid' ? 'selected' : ''}>Solid</option>
                            <option value="dash" ${series.borderStyle == 'dash' ? 'selected' : ''}>Dash</option>
                            <option value="dot" ${series.borderStyle == 'dot' ? 'selected' : ''}>Dot</option>
                        </select>
                    </div>
                </div>
            `;
            container.appendChild(div);
        });
    }

    window.updateSeriesStyle = function (idx, prop, val) {
        plotData[idx][prop] = val;
    };

    // Plot Updating
    document.getElementById('btn-update-plot').addEventListener('click', updatePlot);

    function updatePlot() {
        if (plotData.length === 0) return;

        const title = document.getElementById('plot-title').value;
        const titleColor = document.getElementById('title-color').value;
        const xLabel = document.getElementById('x-label').value;
        const yLabel = document.getElementById('y-label').value;

        const legX = parseFloat(document.getElementById('legend-x').value);
        const legY = parseFloat(document.getElementById('legend-y').value);
        const legBg = document.getElementById('legend-bg').value;
        const legText = document.getElementById('legend-text').value;

        const traces = [];

        plotData.forEach(series => {
            const xMean = series.angle;
            const y = series.thickness;
            const std = series.std;

            // Calc Bounds
            const xUpper = xMean.map((v, i) => v + (std ? std[i] || 0 : 0));
            const xLower = xMean.map((v, i) => v - (std ? std[i] || 0 : 0));

            const mainColor = series.color;
            const fillColor = hexToRgba(mainColor, 0.2);

            // Border Line Style for Shaded Area
            let borderDash = 'solid';
            if (series.borderStyle === 'dash') borderDash = 'dash';
            if (series.borderStyle === 'dot') borderDash = 'dot';
            const borderWidth = series.borderStyle === 'none' ? 0 : 1;
            const borderColor = series.borderStyle === 'none' ? 'transparent' : series.borderColor;

            // Trace 1: Lower (Invisible or Border)
            traces.push({
                x: xLower, y: y,
                mode: 'lines',
                line: { width: borderWidth, color: borderColor, dash: borderDash },
                showlegend: false, hoverinfo: 'skip',
                type: 'scatter'
            });

            // Trace 2: Upper (Filled)
            traces.push({
                x: xUpper, y: y,
                mode: 'lines',
                line: { width: borderWidth, color: borderColor, dash: borderDash },
                fill: 'tonextx', // Fill between Upper and Lower
                fillcolor: fillColor,
                showlegend: false, hoverinfo: 'skip',
                name: series.name + ' Area',
                type: 'scatter'
            });

            // Trace 3: Mean Line
            traces.push({
                x: xMean, y: y,
                mode: 'lines',
                line: { color: mainColor, width: 3 },
                name: series.name,
                type: 'scatter'
            });
        });

        const layout = {
            title: { text: title, font: { size: 18, color: titleColor } },
            paper_bgcolor: 'rgba(0,0,0,0)', // Transparant to show container
            plot_bgcolor: 'rgba(0,0,0,0)',
            xaxis: {
                title: { text: xLabel, font: { color: titleColor } },
                showgrid: true, gridcolor: '#444',
                tickfont: { color: titleColor }
            },
            yaxis: {
                title: { text: yLabel, font: { color: titleColor } },
                range: [1.0, 0], // Inverted Depth
                showgrid: true, gridcolor: '#444',
                tickfont: { color: titleColor }
            },
            legend: {
                x: legX, y: legY,
                bgcolor: legBg,
                font: { color: legText },
                bordercolor: '#444', borderwidth: 1
            },
            margin: { l: 60, r: 20, b: 60, t: 60 }
        };

        const config = { responsive: true };

        Plotly.newPlot('plot-area', traces, layout, config);
    }

    function hexToRgba(hex, alpha) {
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            let c = hex.substring(1).split('');
            if (c.length == 3) c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + ',' + alpha + ')';
        }
        return 'rgba(255,255,255,0.2)';
    }
});
