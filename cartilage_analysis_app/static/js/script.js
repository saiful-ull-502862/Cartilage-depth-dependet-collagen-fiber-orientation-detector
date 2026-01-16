document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.getElementById('file-input');
    const dropZone = document.getElementById('drop-zone');
    const imageToCrop = document.getElementById('image-to-crop');
    const uploadSection = document.getElementById('upload-section');
    const editorSection = document.getElementById('editor-section');
    const resultsSection = document.getElementById('results-section');
    const loader = document.getElementById('loader');

    let cropper = null;

    // Handle File Selection
    fileInput.addEventListener('change', handleFileSelect);

    // Drag & Drop
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--accent)';
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--glass-border)';
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.style.borderColor = 'var(--glass-border)';
        if (e.dataTransfer.files.length) {
            handleFile(e.dataTransfer.files[0]);
        }
    });

    function handleFileSelect(e) {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    }

    function handleFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            imageToCrop.src = e.target.result;
            uploadSection.classList.add('hidden');
            editorSection.classList.remove('hidden');

            // Initialize Cropper
            if (cropper) cropper.destroy();
            cropper = new Cropper(imageToCrop, {
                viewMode: 1,
                responsive: true,
                background: false
            });
        };
        reader.readAsDataURL(file);
    }

    const zoneSection = document.getElementById('zone-section');
    const zonePreviewImg = document.getElementById('zone-preview-img');
    const szLine = document.getElementById('line-sz');
    const mzLine = document.getElementById('line-mz');

    const szInput = document.getElementById('sz-input');
    const mzInput = document.getElementById('mz-input');
    const dzDisplay = document.getElementById('dz-display');

    // Default thickness (percentages)
    let szThick = 10;
    let mzThick = 20;
    let dzThick = 70;

    function updateLinesFromInputs() {
        szThick = parseInt(szInput.value) || 0;
        mzThick = parseInt(mzInput.value) || 0;

        // Ensure valid
        if (szThick + mzThick >= 100) {
            mzThick = 99 - szThick;
            mzInput.value = mzThick;
        }

        dzThick = 100 - (szThick + mzThick);
        dzDisplay.textContent = dzThick;

        // Set lines (accumulative)
        szLine.style.top = szThick + '%';
        mzLine.style.top = (szThick + mzThick) + '%';
    }

    function updateInputsFromLines() {
        // Convert top % to thickness
        let split1 = parseFloat(szLine.style.top);
        let split2 = parseFloat(mzLine.style.top);

        if (split1 > split2) split1 = split2; // Safety

        szThick = Math.round(split1);
        mzThick = Math.round(split2 - split1);

        szInput.value = szThick;
        mzInput.value = mzThick;

        dzThick = 100 - (szThick + mzThick);
        dzDisplay.textContent = dzThick;
    }

    szInput.addEventListener('change', updateLinesFromInputs);
    mzInput.addEventListener('change', updateLinesFromInputs);

    // Reset Button
    document.getElementById('reset-btn').addEventListener('click', () => {
        editorSection.classList.add('hidden');
        uploadSection.classList.remove('hidden');
        if (cropper) cropper.destroy();
        fileInput.value = '';
    });

    // To Zone Button (was Crop & Analyze)
    document.getElementById('to-zone-btn').addEventListener('click', () => {
        if (!cropper) return;

        const canvas = cropper.getCroppedCanvas();
        const base64Image = canvas.toDataURL('image/jpeg');

        // Show Zone Section
        editorSection.classList.add('hidden');
        zoneSection.classList.remove('hidden');

        zonePreviewImg.src = base64Image;

        // Initialize Inputs/Lines
        updateLinesFromInputs();
    });

    // Back to Crop
    document.getElementById('back-to-crop-btn').addEventListener('click', () => {
        zoneSection.classList.add('hidden');
        editorSection.classList.remove('hidden');
    });

    // Dragging Logic
    makeDraggable(szLine, (newPos) => {
        // Limit
        let currentSplit2 = parseFloat(mzLine.style.top);
        if (newPos >= currentSplit2) newPos = currentSplit2 - 1;
        szLine.style.top = newPos + '%';
        updateInputsFromLines();
    });

    makeDraggable(mzLine, (newPos) => {
        // Limit
        let currentSplit1 = parseFloat(szLine.style.top);
        if (newPos <= currentSplit1) newPos = currentSplit1 + 1;
        mzLine.style.top = newPos + '%';
        updateInputsFromLines();
    });

    function makeDraggable(element, callback) {
        let isDragging = false;

        element.querySelector('.line-handle').addEventListener('mousedown', (e) => {
            isDragging = true;
            e.stopPropagation(); // Prevent conflicts
        });
        document.addEventListener('mouseup', () => { isDragging = false; });

        // Use document for mousemove
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const rect = zonePreviewImg.getBoundingClientRect();
            let relativeY = e.clientY - rect.top;

            // Constrain
            if (relativeY < 0) relativeY = 0;
            if (relativeY > rect.height) relativeY = rect.height;

            let percent = (relativeY / rect.height) * 100;

            // Pass plain percent to callback to handle setting and logic
            if (callback) callback(percent);
        });
    }

    // Run Analysis Button
    document.getElementById('run-analysis-btn').addEventListener('click', () => {
        loader.classList.remove('hidden');
        zoneSection.classList.add('hidden');
        resultsSection.classList.add('hidden'); // Hide previous results

        fetch('/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                image: zonePreviewImg.src,
                sz_boundary: szThick, // Pass thickness
                mz_boundary: szThick + mzThick, // Pass absolute split point
                use_ai: document.getElementById('use-ai-checkbox').checked
            })
        })
            .then(response => response.json())
            .then(data => {
                loader.classList.add('hidden');
                if (data.success) {
                    // check for AI results
                    if (data.ai_info && data.ai_info.detected) {
                        alert(`AI Auto-Detection Complete!\nDetected SZ Hue: ${data.ai_info.sz_hue}\nDetected MZ Hue: ${data.ai_info.mz_hue || '--'}\nDetected DZ Hue: ${data.ai_info.dz_hue}\nZones adjusted.`);


                        // Update Inputs with AI results
                        const aiSz = data.ai_info.sz_boundary;
                        const aiMzEnd = data.ai_info.mz_boundary;

                        szInput.value = Math.round(aiSz);
                        mzInput.value = Math.round(aiMzEnd - aiSz);
                        updateLinesFromInputs();
                    }
                    // Store for Excel download
                    window.lastAnalysisData = {
                        depth_profile: data.depth_profile,
                        zone_boundaries: data.zone_boundaries
                    };
                    renderResults(data.results, data.annotated_image_url, data.depth_profile, data.zone_boundaries, data.color_calibration);
                } else {
                    alert('Analysis failed: ' + data.error);
                    zoneSection.classList.remove('hidden');
                }
            })
            .catch(err => {
                loader.classList.add('hidden');
                console.error(err);
                alert('An error occurred.');
                zoneSection.classList.remove('hidden');
            });
    });

    // Excel Download Button
    document.getElementById('download-excel-btn').addEventListener('click', () => {
        if (!window.lastAnalysisData) {
            alert('No analysis data available. Please run an analysis first.');
            return;
        }

        fetch('/download_excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(window.lastAnalysisData)
        })
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'fibril_angle_depth_profile.xlsx';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            })
            .catch(err => {
                console.error(err);
                alert('Failed to download Excel file.');
            });
    });

    // Resize Chart Button
    document.getElementById('resize-chart-btn').addEventListener('click', () => {
        const widthInput = document.getElementById('chart-width');
        const heightInput = document.getElementById('chart-height');
        const chartContainer = document.getElementById('chart-container');

        const newWidth = parseInt(widthInput.value) || 100;
        const newHeight = parseInt(heightInput.value) || 500;

        // Apply new dimensions
        chartContainer.style.width = newWidth + '%';
        chartContainer.style.height = newHeight + 'px';

        // Force the canvas to resize
        const canvas = document.getElementById('depth-profile-chart');
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        // Trigger chart update after a small delay to allow DOM update
        setTimeout(() => {
            if (window.depthChart) {
                window.depthChart.resize();
                window.depthChart.update();
            }
        }, 100);
    });

    // Also allow Enter key to trigger resize
    document.getElementById('chart-width').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('resize-chart-btn').click();
    });
    document.getElementById('chart-height').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('resize-chart-btn').click();
    });

    function renderResults(results, annotatedImageUrl, depthProfile, zoneBoundaries, calibration) {
        resultsSection.classList.remove('hidden');

        // Update ColorBar
        if (calibration) {
            updateColorBar(calibration.zero_hue, calibration.ninety_hue);
        } else {
            // Default
            updateColorBar(0, 60);
        }

        // Set Annotated Image
        const annotatedImgElement = document.getElementById('annotated-image');
        if (annotatedImageUrl) {
            annotatedImgElement.src = annotatedImageUrl;
        }

        if (depthProfile) {
            renderDepthProfile(depthProfile, zoneBoundaries);
        }

        renderZone('SZ', results.SZ);
        renderZone('MZ', results.MZ);
        renderZone('DZ', results.DZ);
    }

    function renderDepthProfile(data, zoneBoundaries) {
        const ctx = document.getElementById('depth-profile-chart').getContext('2d');

        // Prepare data points {x: angle, y: thickness}
        // Reference format: X-axis = Fibril Angle (0-90), Y-axis = Normalized Thickness (0=Deep at bottom, 1=Superficial at top)
        const meanPoints = [];
        const upperPoints = [];
        const lowerPoints = [];

        data.forEach(item => {
            if (item.angle !== null && item.angle !== undefined) {
                meanPoints.push({ x: item.angle, y: item.thickness });
                upperPoints.push({ x: Math.min(90, item.angle + item.std), y: item.thickness });
                lowerPoints.push({ x: Math.max(0, item.angle - item.std), y: item.thickness });
            }
        });

        // Get zone boundaries
        const szEnd = zoneBoundaries ? zoneBoundaries.sz_end : 0.9;
        const mzEnd = zoneBoundaries ? zoneBoundaries.mz_end : 0.7;

        // Destroy existing if needed
        if (window.depthChart) window.depthChart.destroy();

        window.depthChart = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Mean Angle',
                        data: meanPoints,
                        borderColor: '#000000',
                        backgroundColor: 'transparent',
                        borderWidth: 2,
                        pointRadius: 0,
                        showLine: true,
                        tension: 0.2
                    },
                    {
                        label: '+Std Dev',
                        data: upperPoints,
                        borderColor: '#666666',
                        borderDash: [3, 3],
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        backgroundColor: 'transparent',
                        tension: 0.2
                    },
                    {
                        label: '-Std Dev',
                        data: lowerPoints,
                        borderColor: '#666666',
                        borderDash: [3, 3],
                        borderWidth: 1,
                        pointRadius: 0,
                        showLine: true,
                        backgroundColor: 'transparent',
                        tension: 0.2
                    },
                    // Zone boundary lines as horizontal line datasets
                    {
                        label: 'SZ/MZ Boundary',
                        data: [{ x: 0, y: szEnd }, { x: 90, y: szEnd }],
                        borderColor: '#FF6600',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        showLine: true
                    },
                    {
                        label: 'MZ/DZ Boundary',
                        data: [{ x: 0, y: mzEnd }, { x: 90, y: mzEnd }],
                        borderColor: '#00AA00',
                        borderDash: [5, 5],
                        borderWidth: 2,
                        pointRadius: 0,
                        showLine: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        min: 0,
                        max: 90,
                        title: {
                            display: true,
                            text: 'Fibril Angle (Degrees)',
                            color: '#333'
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: {
                            color: '#333',
                            stepSize: 20
                        }
                    },
                    y: {
                        type: 'linear',
                        position: 'left',
                        min: 0,
                        max: 1.0,
                        reverse: false, // 0 at bottom, 1 at top
                        title: {
                            display: true,
                            text: 'Normalized Thickness',
                            color: '#333'
                        },
                        grid: { color: 'rgba(0,0,0,0.1)' },
                        ticks: {
                            color: '#333',
                            stepSize: 0.2
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#333' }
                    }
                }
            },
            plugins: [{
                id: 'zoneLabels',
                afterDraw: function (chart) {
                    const ctx = chart.ctx;
                    const yScale = chart.scales.y;
                    const chartArea = chart.chartArea;

                    ctx.save();
                    ctx.font = 'bold 14px Inter, Arial, sans-serif';
                    ctx.textAlign = 'right';

                    // SZ label (above szEnd line)
                    const szY = yScale.getPixelForValue((1.0 + szEnd) / 2);
                    ctx.fillStyle = '#FF6600';
                    ctx.fillText('SZ', chartArea.right - 10, szY);

                    // MZ label (between szEnd and mzEnd)
                    const mzY = yScale.getPixelForValue((szEnd + mzEnd) / 2);
                    ctx.fillStyle = '#888888';
                    ctx.fillText('MZ', chartArea.right - 10, mzY);

                    // DZ label (below mzEnd line)
                    const dzY = yScale.getPixelForValue(mzEnd / 2);
                    ctx.fillStyle = '#00AA00';
                    ctx.fillText('DZ', chartArea.right - 10, dzY);

                    ctx.restore();
                }
            }]
        });
    }

    function renderZone(zoneId, data) {
        const zoneKey = zoneId.toLowerCase();

        // Set Color Preview
        document.getElementById(`${zoneKey}-color`).style.backgroundColor = data.avg_color_hex;

        // Set Hex color value
        const hexEl = document.getElementById(`${zoneKey}-hex`);
        if (hexEl) hexEl.textContent = data.avg_color_hex || '--';

        // Set Color Properties
        const hueEl = document.getElementById(`${zoneKey}-hue`);
        const rgbEl = document.getElementById(`${zoneKey}-rgb`);
        const intensityEl = document.getElementById(`${zoneKey}-intensity`);

        if (hueEl) hueEl.textContent = data.avg_hue !== undefined ? data.avg_hue.toFixed(1) : '--';
        if (rgbEl) rgbEl.textContent = `${data.avg_r || 0}, ${data.avg_g || 0}, ${data.avg_b || 0}`;
        if (intensityEl) intensityEl.textContent = data.avg_intensity !== undefined ? data.avg_intensity.toFixed(1) : '--';

        // Set Mapping Formula
        const formulaEl = document.getElementById(`${zoneKey}-formula`);
        if (formulaEl && data.avg_hue !== undefined) {
            const hue = data.avg_hue.toFixed(1);
            const calculatedAngle = (data.avg_hue * 1.5).toFixed(1);
            formulaEl.textContent = `Angle = ${hue} × 1.5 = ${calculatedAngle}°`;
        }

        // Set Stats
        const meanEl = document.getElementById(`${zoneKey}-mean`);
        const stdEl = document.getElementById(`${zoneKey}-std`);
        const interpEl = document.getElementById(`${zoneKey}-interpretation`);

        const meanAngle = data.mean_angle !== undefined ? data.mean_angle.toFixed(1) + '°' : '--';
        const stdAngle = data.std_angle !== undefined ? '(±' + data.std_angle.toFixed(1) + '°)' : '';

        if (meanEl) meanEl.textContent = meanAngle;
        if (stdEl) stdEl.textContent = stdAngle;

        // Generate interpretation based on zone and angle
        let interpretation = '';
        const angle = data.mean_angle || 0;

        if (zoneId === 'SZ') {
            if (angle < 30) {
                interpretation = '✓ Expected: Low angles indicate horizontal fibers (parallel to surface)';
            } else if (angle < 50) {
                interpretation = '⚠ Higher than typical SZ (~0-30°)';
            } else {
                interpretation = '⚠ Unusually high for SZ - check zone boundaries';
            }
        } else if (zoneId === 'MZ') {
            if (angle < 30) {
                interpretation = '⚠ Low angles - similar to SZ region';
            } else if (angle < 65) {
                interpretation = '✓ Expected: Transitional zone with oblique fiber orientations';
            } else {
                interpretation = '⚠ Higher than typical MZ (~30-65°)';
            }
        } else if (zoneId === 'DZ') {
            if (angle > 65) {
                interpretation = '✓ Expected: High angles indicate vertical fibers (perpendicular to surface)';
            } else if (angle > 45) {
                interpretation = '⚠ Slightly lower than typical DZ (~65-90°)';
            } else {
                interpretation = '⚠ Low for DZ - check zone boundaries';
            }
        }

        if (interpEl) interpEl.textContent = interpretation;
    }

    function updateColorBar(hue0, hue90) {
        const stops = 10;
        let gradientStr = 'linear-gradient(to right';

        // In HTML, 90 deg is Left, 0 deg is Right.
        // hue90 is 90 deg color (Left), hue0 is 0 deg color (Right)

        for (let i = 0; i <= stops; i++) {
            let t = i / stops;
            // t=0 -> Left (hue90), t=1 -> Right (hue0)
            let h = hue90 + (hue0 - hue90) * t;

            let cssHue = h * 2;
            gradientStr += `, hsl(${cssHue}, 100%, 50%)`;
        }
        gradientStr += ')';

        const spans = document.querySelectorAll('span');
        for (let span of spans) {
            if (span.textContent.includes('90°')) {
                const sibling = span.nextElementSibling;
                if (sibling && sibling.tagName === 'DIV') {
                    sibling.style.background = gradientStr;
                }
            }
        }
    }
});
