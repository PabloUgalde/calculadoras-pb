// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Selectores DOM ---
    const airplaneSelect = document.getElementById('airplane-select');
    const airplaneDetailsDiv = document.getElementById('airplane-details');
    const airplaneNameTitle = document.getElementById('airplane-name-title');
    const emptyWeightLbsSpan = document.getElementById('empty-weight-lbs');
    const emptyWeightKgSpan = document.getElementById('empty-weight-kg');
    const emptyMomentSpan = document.getElementById('empty-moment');
    const emptyCgSpan = document.getElementById('empty-cg');
    const inputsContainer = document.getElementById('inputs-container');
    const calculateBtn = document.getElementById('calculate-btn');
    const itemizedResultsContainer = document.getElementById('itemized-results-container');
    const totalResultsContainer = document.getElementById('total-results-container');
    const totalZfwLbsSpan = document.getElementById('total-zfw-lbs');
    const totalZfwKgSpan = document.getElementById('total-zfw-kg');
    const totalWeightLbsSpan = document.getElementById('total-weight-lbs');
    const totalWeightKgSpan = document.getElementById('total-weight-kg');
    const totalMomentSpan = document.getElementById('total-moment');
    const calculatedCgSpan = document.getElementById('calculated-cg');
    const operationCategorySpan = document.getElementById('operation-category');
    const statusMessagesDiv = document.getElementById('status-messages');
    const chartContainer = document.getElementById('chart-container');
    const cgEnvelopeChartCanvas = document.getElementById('cgEnvelopeChart');
    const toggleChartBtn = document.getElementById('toggle-chart-btn');
    let cgChart = null;
    const inputColumn = document.querySelector('.input-column');
    const outputColumn = document.querySelector('.output-column');

    // --- Constantes de Conversión ---
    const LBS_TO_KG_FACTOR = 0.453592;
    const KG_TO_LBS_FACTOR = 1 / LBS_TO_KG_FACTOR;
    const GAL_TO_LTR_FACTOR = 3.78541;
    const LTR_TO_GAL_FACTOR = 1 / GAL_TO_LTR_FACTOR;

    // --- Datos de Aviones (ORDEN y NOMBRES MODIFICADOS) ---
    const airplanesData = {
        "c150f_snc": {
            name: "Cessna 150F Commuter (CC-SNC)",
            emptyWeight_lbs: 1131.6, emptyMoment_lb_in: 38995.0, fuel_gallons_per_lbs: 1 / 6,
            stations: [ 
                { name: "Aceite (6 Qts)", arm_in: -9.09, id: "oil", type: "single_weight", default_value: 11 }, 
                { name: "Piloto y Pasajero", arm_in: 39.0, id: "front_pax", type: "paired_weight" }, 
                { name: "Combustible Usable (Gal)", arm_in: 42.2, id: "fuel", type: "paired_fuel", max_gallons: 38.0 }, 
                { name: "Equipaje Área 1 (Max 120 lbs)", arm_in: 64.0, id: "baggage1", type: "paired_weight", max_lbs: 120 },
                { name: "Equipaje Área 2 (Max 40 lbs)", arm_in: 84.0, id: "baggage2", type: "paired_weight", max_lbs: 40 } 
            ],
            limits: { maxTakeOffWeight_lbs: 1600, maxLandingWeight_lbs: 1600, cgEnvelopeGraphUtility: [ 
                { x: 36.1, y: 1150 }, { x: 40.5, y: 1285 }, { x: 52.8, y: 1600 }, 
                { x: 60.0, y: 1600 }, { x: 49.48, y: 1285 }, { x: 44.97, y: 1150 }, 
                { x: 36.1, y: 1150 } 
            ], 
                cgEnvelopeUtility: [ 
                    { weight: 1150, fwd_in: 31.39, aft_in: 39.10 }, 
                    { weight: 1285, fwd_in: 31.52, aft_in: 38.51 }, 
                    { weight: 1600, fwd_in: 33.00, aft_in: 37.50 } 
                ], 
                maxCombinedBaggage_lbs: 120, defaultCategory: "Utilitaria" }
        },
        "c150l_kug": {
            name: "Cessna 150L Commuter (CC-KUG)",
            emptyWeight_lbs: 1103.4, emptyMoment_lb_in: 37567.0, fuel_gallons_per_lbs: 1 / 6,
            stations: [ 
                { name: "Aceite (6 Qts)", arm_in: -9.09, id: "oil", type: "single_weight", default_value: 11 }, 
                { name: "Piloto y Pasajero", arm_in: 39.0, id: "front_pax", type: "paired_weight" }, 
                { name: "Combustible Usable (Gal)", arm_in: 42.2, id: "fuel", type: "paired_fuel", max_gallons: 22.5 }, 
                { name: "Equipaje Área 1 (Max 120 lbs)", arm_in: 64.0, id: "baggage1", type: "paired_weight", max_lbs: 120 }, 
                { name: "Equipaje Área 2 (Max 40 lbs)", arm_in: 84.0, id: "baggage2", type: "paired_weight", max_lbs: 40 } ],   
            limits: { maxTakeOffWeight_lbs: 1600, maxLandingWeight_lbs: 1600, cgEnvelopeGraphUtility: [ { x: 34.5, y: 1100 }, { x: 40.0, y: 1320 }, { x: 52.5, y: 1600 }, { x: 60.0, y: 1600 }, { x: 49.53, y: 1320 }, { x: 41.3, y: 1100 }, { x: 34.5, y: 1100 } ], cgEnvelopeUtility: [ { weight: 1100, fwd_in: 31.36, aft_in: 37.55 }, { weight: 1320, fwd_in: 30.30, aft_in: 37.52 }, { weight: 1600, fwd_in: 32.81, aft_in: 37.50 } ], maxCombinedBaggage_lbs: 120, defaultCategory: "Utilitaria" }
        },
        "c172m_kua": {
            name: "Cessna 172M Skyhawk (CC-KUA)",
            emptyWeight_lbs: 1366.0, emptyMoment_lb_in: 53800.0, fuel_gallons_per_lbs: 1 / 6,
            stations: [ 
                { name: "Aceite (8 Qts)", arm_in: -13.33, id: "oil", type: "single_weight", default_value: 15 }, 
                { name: "Piloto y Pas. Delantero", arm_in: 37.1, id: "front_pax", type: "paired_weight" }, 
                { name: "Combustible Usable", arm_in: 47.8, id: "fuel", type: "paired_fuel", max_gallons: 38 }, 
                { name: "Pasajeros Traseros", arm_in: 73.0, id: "rear_pax", type: "paired_weight" }, 
                { name: "Equipaje Área 1", arm_in: 90.9, id: "baggage1", type: "paired_weight", max_lbs: 120 }, 
                { name: "Equipaje Área 2", arm_in: 123.0, id: "baggage2", type: "paired_weight", max_lbs: 50 } ],
            limits: { maxRampWeight_lbs: 2307.5, maxTakeOffWeight_lbs: 2300, maxLandingWeight_lbs: 2300, cgEnvelopeGraphNormal: [ { x: 52.5, y: 1500 }, { x: 68.25, y: 1950 }, { x: 88.5, y: 2300 }, { x: 108.8, y: 2300 }, { x: 92.3, y: 1950 }, { x: 71.0, y: 1500 }, { x: 52.5, y: 1500 } ], cgEnvelopeNormal: [ { weight: 1500, fwd_in: 35.0, aft_in: 47.33 }, { weight: 1950, fwd_in: 35.0, aft_in: 47.33 }, { weight: 2300, fwd_in: 38.48, aft_in: 47.30 } ], maxUtilityWeight_lbs: 2000, cgEnvelopeGraphUtility: [ { x: 52.5, y: 1500 }, { x: 68.25, y: 1950 }, { x: 71.2, y: 2000 }, { x: 81.5, y: 2000 }, { x: 60.6, y: 1500 }, { x: 52.5, y: 1500 } ], cgEnvelopeUtility: [ { weight: 1500, fwd_in: 35.0, aft_in: 40.4 }, { weight: 1950, fwd_in: 35.0, aft_in: 40.72 }, { weight: 2000, fwd_in: 35.6, aft_in: 40.75 } ], maxCombinedBaggage_lbs: 120 }
        },
        "c182g_klc": {
            name: "Cessna 182G Skylane (CC-KLC)",
            emptyWeight_lbs: 1728.0, emptyMoment_lb_in: 61157.0, fuel_gallons_per_lbs: 1 / 6,
            stations: [ 
                { name: "Aceite (12 Qts)", arm_in: -13.64, id: "oil", type: "single_weight", default_value: 22 }, 
                { name: "Piloto y Pas. Delantero", arm_in: 36.0, id: "front_pax", type: "paired_weight" }, 
                { name: "Combustible Usable (Gal)", arm_in: 48.0, id: "fuel", type: "paired_fuel", max_gallons: 79.0 }, 
                { name: "Pasajeros Traseros", arm_in: 71.0, id: "rear_pax", type: "paired_weight" }, 
                { name: "Equipaje", arm_in: 97.5, id: "baggage", type: "paired_weight", max_lbs: 120 } ],
            limits: { maxTakeOffWeight_lbs: 2800, maxLandingWeight_lbs: 2800, cgEnvelopeGraphNormal: [ { x: 59.0, y: 1800 }, { x: 74.0, y: 2250 }, { x: 107.5, y: 2800 }, { x: 133.5, y: 2800 }, { x: 107.1, y: 2250 }, { x: 85.5, y: 1800 }, { x: 59.0, y: 1800 } ], cgEnvelopeNormal: [ { weight: 1800, fwd_in: 32.78, aft_in: 47.50 }, { weight: 2250, fwd_in: 32.89, aft_in: 47.60 }, { weight: 2800, fwd_in: 38.39, aft_in: 47.68 } ], defaultCategory: "Normal" }
        }
    };

    // --- Funciones de Utilidad de UI ---
    function hideAllSections() {
        airplaneDetailsDiv.classList.add('hidden');
        if (inputColumn) inputColumn.classList.add('hidden');
        if (outputColumn) outputColumn.classList.add('hidden');
        chartContainer.classList.add('hidden');
        calculateBtn.classList.add('hidden');
        if (toggleChartBtn) toggleChartBtn.classList.add('hidden');
    }
    hideAllSections();

    // --- Funciones Principales ---
    function populateAirplaneSelect() {
        airplaneSelect.innerHTML = '<option value="">-- Elija un avión --</option>';
        const airplaneOrder = ["c150f_snc", "c150l_kug", "c172m_kua", "c182g_klc"];
        airplaneOrder.forEach(id => {
            if (airplanesData[id]) {
                const option = document.createElement('option'); option.value = id; option.textContent = airplanesData[id].name;
                airplaneSelect.appendChild(option);
            }
        });
    }

    function displayAirplaneInputs(airplaneId) {
        inputsContainer.innerHTML = ''; itemizedResultsContainer.innerHTML = ''; statusMessagesDiv.innerHTML = '';
        hideAllSections();
        if (!airplaneId) return;
        const airplane = airplanesData[airplaneId];
        if (!airplane) { console.error("Airplane data not found for ID:", airplaneId); return; }
        airplaneNameTitle.textContent = airplane.name;
        emptyWeightLbsSpan.textContent = airplane.emptyWeight_lbs.toFixed(1);
        emptyWeightKgSpan.textContent = (airplane.emptyWeight_lbs * LBS_TO_KG_FACTOR).toFixed(1);
        emptyMomentSpan.textContent = (airplane.emptyMoment_lb_in / 1000).toFixed(1) + " k-lb-in";
        const emptyCgVal = airplane.emptyWeight_lbs !== 0 ? (airplane.emptyMoment_lb_in / airplane.emptyWeight_lbs).toFixed(2) : "N/A";
        emptyCgSpan.textContent = emptyCgVal + " in";
        airplaneDetailsDiv.classList.remove('hidden');
        const fieldset = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.textContent = 'Pesos en Estaciones'; fieldset.appendChild(legend);
        const allInputs = [];
        if (!airplane.stations || airplane.stations.length === 0) { console.warn("ADVERTENCIA - El avión no tiene estaciones definidas."); }
        airplane.stations.forEach(station => {
            const group = document.createElement('div'); group.classList.add('input-group');
            const label = document.createElement('label'); label.textContent = `${station.name}:`; group.appendChild(label);
            const armInfo = document.createElement('span'); armInfo.classList.add('arm-info'); armInfo.textContent = `(Arm: ${station.arm_in.toFixed(1)} in)`;
            if (station.type === 'single_weight') {
                const input = document.createElement('input'); input.type = 'number'; input.id = `input-${station.id}`; input.dataset.arm = station.arm_in;
                input.classList.add('single-input', 'focusable-input');
                if (station.default_value !== undefined) input.value = station.default_value;
                input.placeholder = `Peso (lbs)`; input.min = "0";
                allInputs.push(input); group.appendChild(input);
            } else if (station.type === 'paired_weight') {
                const pairDiv = document.createElement('div'); pairDiv.classList.add('input-pair-container');
                const inputLbs = document.createElement('input'); inputLbs.type = 'number'; inputLbs.id = `input-${station.id}-lbs`; inputLbs.dataset.arm = station.arm_in;
                inputLbs.placeholder = station.max_lbs ? `Max ${station.max_lbs} lbs` : `Peso (lbs)`;
                if(station.max_lbs) inputLbs.max = station.max_lbs; inputLbs.min = "0";
                inputLbs.classList.add('focusable-input'); allInputs.push(inputLbs);
                const inputKg = document.createElement('input'); inputKg.type = 'number'; inputKg.id = `input-${station.id}-kg`;
                const maxKg = station.max_lbs ? (station.max_lbs * LBS_TO_KG_FACTOR).toFixed(1) : null;
                inputKg.placeholder = maxKg ? `Max ${maxKg} kg` : `Peso (kg)`;
                if(maxKg) inputKg.max = maxKg; inputKg.min = "0";
                inputKg.classList.add('focusable-input'); allInputs.push(inputKg);
                inputLbs.addEventListener('input', () => { const v = parseFloat(inputLbs.value); if(!isNaN(v)&&v>=0){inputKg.value=(v*LBS_TO_KG_FACTOR).toFixed(1);if(station.max_lbs&&v>station.max_lbs){inputLbs.value=station.max_lbs;inputKg.value=(station.max_lbs*LBS_TO_KG_FACTOR).toFixed(1);}}else if(inputLbs.value===''){inputKg.value='';}});
                inputKg.addEventListener('input', () => { const v = parseFloat(inputKg.value); if(!isNaN(v)&&v>=0){const l=(v*KG_TO_LBS_FACTOR);inputLbs.value=l.toFixed(1);if(station.max_lbs&&l>station.max_lbs){inputLbs.value=station.max_lbs.toFixed(1);inputKg.value=(station.max_lbs*LBS_TO_KG_FACTOR).toFixed(1);}}else if(inputKg.value===''){inputLbs.value='';}});
                pairDiv.appendChild(inputLbs); pairDiv.appendChild(inputKg); group.appendChild(pairDiv);
            } else if (station.type === 'paired_fuel') {
                const pairDiv = document.createElement('div'); pairDiv.classList.add('input-pair-container');
                const inputGal = document.createElement('input'); inputGal.type = 'number'; inputGal.id = `input-${station.id}-gal`; inputGal.dataset.arm = station.arm_in;
                inputGal.placeholder = station.max_gallons ? `0 - ${station.max_gallons} gal` : `Galones`;
                if (station.max_gallons) inputGal.max = station.max_gallons; inputGal.min = "0";
                inputGal.classList.add('focusable-input'); allInputs.push(inputGal);
                const inputLtr = document.createElement('input'); inputLtr.type = 'number'; inputLtr.id = `input-${station.id}-ltr`;
                const maxLiters = station.max_gallons ? (station.max_gallons * GAL_TO_LTR_FACTOR).toFixed(1) : null;
                inputLtr.placeholder = maxLiters ? `0 - ${maxLiters} Ltr` : `Litros`;
                if (maxLiters) inputLtr.max = maxLiters; inputLtr.min = "0";
                inputLtr.classList.add('focusable-input'); allInputs.push(inputLtr);
                inputGal.addEventListener('input', () => { const v = parseFloat(inputGal.value); if(!isNaN(v)&&v>=0){inputLtr.value=(v*GAL_TO_LTR_FACTOR).toFixed(1);if(station.max_gallons&&v>station.max_gallons){inputGal.value=station.max_gallons;inputLtr.value=(station.max_gallons*GAL_TO_LTR_FACTOR).toFixed(1);}}else if(inputGal.value===''){inputLtr.value='';}});
                inputLtr.addEventListener('input', () => { const v = parseFloat(inputLtr.value); if(!isNaN(v)&&v>=0){const g=(v*LTR_TO_GAL_FACTOR);inputGal.value=g.toFixed(1);if(station.max_gallons&&g>station.max_gallons){inputGal.value=station.max_gallons.toFixed(1);inputLtr.value=(station.max_gallons*GAL_TO_LTR_FACTOR).toFixed(1);}}else if(inputLtr.value===''){inputGal.value='';}});
                pairDiv.appendChild(inputGal); pairDiv.appendChild(inputLtr); group.appendChild(pairDiv);
            }
            group.appendChild(armInfo); fieldset.appendChild(group); 
        });
        inputsContainer.appendChild(fieldset);
        inputsContainer.classList.remove('hidden');
        if (inputColumn) inputColumn.classList.remove('hidden');
        calculateBtn.classList.remove('hidden');
        setupInputNavigation(allInputs);
    }

    function calculateWeightAndBalance() {
        const airplaneId = airplaneSelect.value; if (!airplaneId) return;
        const airplane = airplanesData[airplaneId];
        let currentTotalWeight = airplane.emptyWeight_lbs; let currentTotalMoment = airplane.emptyMoment_lb_in;
        let zeroFuelWeight = airplane.emptyWeight_lbs; let zeroFuelMoment = airplane.emptyMoment_lb_in;
        let fuelWeightLbs = 0; let fuelMoment = 0;
        statusMessagesDiv.innerHTML = ''; itemizedResultsContainer.innerHTML = '<h4>Desglose de Carga:</h4>';
        const emptyItemP = document.createElement('p'); emptyItemP.innerHTML = `<strong>Peso Vacío:</strong> ${airplane.emptyWeight_lbs.toFixed(1)} lbs, <strong>Momento:</strong> ${(airplane.emptyMoment_lb_in / 1000).toFixed(1)} k-lb-in`; itemizedResultsContainer.appendChild(emptyItemP);
        if (airplane.limits.maxCombinedBaggage_lbs) { const b1 = document.getElementById('input-baggage1-lbs'); const b2 = document.getElementById('input-baggage2-lbs'); if(b1&&b2){const w1=parseFloat(b1.value)||0; const w2=parseFloat(b2.value)||0; if(w1+w2 > airplane.limits.maxCombinedBaggage_lbs){addStatusMessage(`Advertencia: Límite equipaje combinado (${airplane.limits.maxCombinedBaggage_lbs} lbs) excedido. Total: ${(w1+w2).toFixed(1)} lbs`, 'warning');}}}
        airplane.stations.forEach(station => {
            let valueEntered; 
            if (station.type === 'single_weight') valueEntered = parseFloat(document.getElementById(`input-${station.id}`).value) || 0;
            else if (station.type === 'paired_fuel') valueEntered = parseFloat(document.getElementById(`input-${station.id}-gal`).value) || 0;
            else if (station.type === 'paired_weight') valueEntered = parseFloat(document.getElementById(`input-${station.id}-lbs`).value) || 0;
            else valueEntered = 0;
            if (valueEntered < 0) valueEntered = 0;
            let itemWeightLbs = 0; let itemMomentFull = 0; let displayValue = valueEntered;
            if (station.type === 'paired_fuel') { const gallons = valueEntered; itemWeightLbs = gallons / airplane.fuel_gallons_per_lbs; itemMomentFull = itemWeightLbs * station.arm_in; fuelWeightLbs += itemWeightLbs; fuelMoment += itemMomentFull; }
            else { itemWeightLbs = valueEntered; if (station.max_lbs && itemWeightLbs > station.max_lbs) itemWeightLbs = station.max_lbs; itemMomentFull = itemWeightLbs * station.arm_in; zeroFuelWeight += itemWeightLbs; zeroFuelMoment += itemMomentFull;}
            const itemP = document.createElement('p');
            if (station.type === 'paired_fuel') itemP.innerHTML = `<strong>${station.name} (${displayValue.toFixed(1)} gal):</strong> ${itemWeightLbs.toFixed(1)} lbs, <strong>Momento:</strong> ${(itemMomentFull / 1000).toFixed(1)} k-lb-in`;
            else itemP.innerHTML = `<strong>${station.name}:</strong> ${itemWeightLbs.toFixed(1)} lbs, <strong>Momento:</strong> ${(itemMomentFull / 1000).toFixed(1)} k-lb-in`;
            itemizedResultsContainer.appendChild(itemP);
        });
        currentTotalWeight = zeroFuelWeight + fuelWeightLbs; currentTotalMoment = zeroFuelMoment + fuelMoment;
        const calculatedCG = (currentTotalWeight > 0) ? currentTotalMoment / currentTotalWeight : 0;
        totalZfwLbsSpan.textContent = zeroFuelWeight.toFixed(1); totalZfwKgSpan.textContent = (zeroFuelWeight * LBS_TO_KG_FACTOR).toFixed(1);
        totalWeightLbsSpan.textContent = currentTotalWeight.toFixed(1); totalWeightKgSpan.textContent = (currentTotalWeight * LBS_TO_KG_FACTOR).toFixed(1);
        totalMomentSpan.textContent = (currentTotalMoment / 1000).toFixed(1) + " k-lb-in";
        calculatedCgSpan.textContent = calculatedCG.toFixed(2) + " in";
        if (outputColumn) outputColumn.classList.remove('hidden');
        itemizedResultsContainer.classList.remove('hidden'); totalResultsContainer.classList.remove('hidden');
        checkLimitsAndCategory(airplane, currentTotalWeight, calculatedCG, currentTotalMoment);
        chartContainer.classList.add('hidden'); 
        if (toggleChartBtn) toggleChartBtn.classList.remove('hidden');
        if (totalResultsContainer.offsetParent) { totalResultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' }); } 
    }
    
    function setupInputNavigation(inputs) { 
        console.log("setupInputNavigation: Configurando navegación para", inputs.length, "inputs."); // LOG NUEVO
        inputs.forEach((input, index) => { 
            console.log("setupInputNavigation: Añadiendo listener a input:", input.id, "en índice:", index); // LOG NUEVO
            input.addEventListener('keydown', (e) => { 
                // console.log("Input:", input.id, "Keydown event:", e.key); // LOG MUY DETALLADO (descomentar si es necesario)
                if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey && index < inputs.length - 1)) { 
                    console.log("Enter/Tab detectado en:", input.id, "Intentando foco en el siguiente."); // LOG NUEVO
                    e.preventDefault(); 
                    if (inputs[index + 1]) { // Verificar que el siguiente input exista
                        inputs[index + 1].focus();
                        console.log("Foco puesto en:", inputs[index + 1].id); // LOG NUEVO
                    } else {
                        console.log("No hay siguiente input para hacer foco desde:", input.id); // LOG NUEVO
                    }
                }
            });
        });
    }
    
    function checkLimitsAndCategory(airplane, weight, cg, momentFull) { 
        let inLimits = true; let category = "Fuera de Límites"; statusMessagesDiv.innerHTML = ''; 
        if (weight > airplane.limits.maxTakeOffWeight_lbs) { addStatusMessage(`ERROR: Peso Total (${weight.toFixed(1)} lbs) excede el Máximo de Despegue (${airplane.limits.maxTakeOffWeight_lbs} lbs).`, 'error'); inLimits = false; } 
        else { addStatusMessage(`Peso Total (${weight.toFixed(1)} lbs) DENTRO del Máximo de Despegue (${airplane.limits.maxTakeOffWeight_lbs} lbs).`, 'ok');} 
        if (airplane.limits.maxRampWeight_lbs && weight > airplane.limits.maxRampWeight_lbs) { addStatusMessage(`ADVERTENCIA: Peso Total (${weight.toFixed(1)} lbs) excede el Máximo en Rampa (${airplane.limits.maxRampWeight_lbs} lbs).`, 'warning');} 
        let inCalculatedCategoryLimits = false; 
        if (inLimits) { 
            let envelopeToCheck; let categoryName; let maxCategoryWeight = airplane.limits.maxTakeOffWeight_lbs; 
            if (airplane.limits.defaultCategory === "Utilitaria" && airplane.limits.cgEnvelopeUtility) { envelopeToCheck = airplane.limits.cgEnvelopeUtility; categoryName = "Utilitaria"; } 
            else if (airplane.limits.defaultCategory === "Normal" && airplane.limits.cgEnvelopeNormal) { envelopeToCheck = airplane.limits.cgEnvelopeNormal; categoryName = "Normal"; } 
            else if (airplane.limits.cgEnvelopeUtility && airplane.limits.maxUtilityWeight_lbs && weight <= airplane.limits.maxUtilityWeight_lbs) { envelopeToCheck = airplane.limits.cgEnvelopeUtility; categoryName = "Utilitaria"; maxCategoryWeight = airplane.limits.maxUtilityWeight_lbs;} 
            else if (airplane.limits.cgEnvelopeNormal) { envelopeToCheck = airplane.limits.cgEnvelopeNormal; categoryName = "Normal"; } 
            else { addStatusMessage("ERROR: No se encontró envolvente de CG definida.", "error"); inLimits = false;} 
            
            if (envelopeToCheck && inLimits) { // Solo si hay envelope y aún estamos en límites de peso
                if (weight <= maxCategoryWeight) {
                    const { fwdLimit, aftLimit } = getCGLimitsForWeight(envelopeToCheck, weight); 
                    if (fwdLimit !== null && aftLimit !== null) { 
                        if (cg >= fwdLimit && cg <= aftLimit) { inCalculatedCategoryLimits = true; category = categoryName; addStatusMessage(`CG (${cg.toFixed(2)} in) DENTRO de Cat. ${categoryName} (${fwdLimit.toFixed(2)} - ${aftLimit.toFixed(2)} in).`, 'ok'); } 
                        else { if (cg < fwdLimit) addStatusMessage(`ERROR (Cat. ${categoryName}): CG (${cg.toFixed(2)} in) DEMASIADO ADELANTE. Límite: ${fwdLimit.toFixed(2)} in.`, 'error'); if (cg > aftLimit) addStatusMessage(`ERROR (Cat. ${categoryName}): CG (${cg.toFixed(2)} in) DEMASIADO ATRÁS. Límite: ${aftLimit.toFixed(2)} in.`, 'error'); inLimits = false; }
                    } else { addStatusMessage(`ADVERTENCIA: No se pudo determinar límites CG (Cat. ${categoryName}) para peso (${weight.toFixed(1)} lbs).`, 'warning'); inLimits = false; }
                } else if (categoryName === "Utilitaria" && airplane.limits.cgEnvelopeNormal) { // Peso excede Utilitaria, ¿puede ser Normal?
                     const { fwdLimit, aftLimit } = getCGLimitsForWeight(airplane.limits.cgEnvelopeNormal, weight); categoryName = "Normal"; 
                     if (fwdLimit !== null && aftLimit !== null) { 
                        if (cg >= fwdLimit && cg <= aftLimit) { inCalculatedCategoryLimits = true; category = categoryName; addStatusMessage(`Peso excede Cat. Utilitaria. CG (${cg.toFixed(2)} in) DENTRO de Cat. ${categoryName} (${fwdLimit.toFixed(2)} - ${aftLimit.toFixed(2)} in).`, 'ok');} 
                        else { if (cg < fwdLimit) addStatusMessage(`ERROR (Cat. ${categoryName}): CG (${cg.toFixed(2)} in) DEMASIADO ADELANTE. Límite: ${fwdLimit.toFixed(2)} in.`, 'error'); if (cg > aftLimit) addStatusMessage(`ERROR (Cat. ${categoryName}): CG (${cg.toFixed(2)} in) DEMASIADO ATRÁS. Límite: ${aftLimit.toFixed(2)} in.`, 'error'); inLimits = false;}
                    } else { addStatusMessage(`ADVERTENCIA: No se pudo determinar límites CG (Cat. ${categoryName}) para peso (${weight.toFixed(1)} lbs).`, 'warning'); inLimits = false;}
                } else { // Peso excede la categoría única o la Normal si no hay alternativa
                     addStatusMessage(`ERROR: Peso (${weight.toFixed(1)} lbs) excede el máximo para Cat. ${categoryName} (${maxCategoryWeight} lbs).`, 'error');
                     inLimits = false;
                }
            }
        } 
        operationCategorySpan.textContent = category; 
        if (inLimits && inCalculatedCategoryLimits) { addStatusMessage(`AVIÓN DENTRO DE LÍMITES (Categoría ${category}).`, 'ok', true);} 
        else { addStatusMessage("AVIÓN FUERA DE LÍMITES. NO DESPEGAR.", 'error', true);}
    }

    function getCGLimitsForWeight(cgEnvelope, currentWeight) { if (!cgEnvelope || cgEnvelope.length === 0) return { fwdLimit: null, aftLimit: null }; const sortedEnvelope = [...cgEnvelope].sort((a, b) => a.weight - b.weight); if (currentWeight < sortedEnvelope[0].weight) return { fwdLimit: sortedEnvelope[0].fwd_in, aftLimit: sortedEnvelope[0].aft_in }; if (currentWeight > sortedEnvelope[sortedEnvelope.length - 1].weight) return { fwdLimit: sortedEnvelope[sortedEnvelope.length - 1].fwd_in, aftLimit: sortedEnvelope[sortedEnvelope.length - 1].aft_in }; for (let i = 0; i < sortedEnvelope.length - 1; i++) { const p1 = sortedEnvelope[i]; const p2 = sortedEnvelope[i + 1]; if (currentWeight >= p1.weight && currentWeight <= p2.weight) { const weightRatio = (p2.weight - p1.weight === 0) ? 0 : (currentWeight - p1.weight) / (p2.weight - p1.weight); const fwdLimit = p1.fwd_in + weightRatio * (p2.fwd_in - p1.fwd_in); const aftLimit = p1.aft_in + weightRatio * (p2.aft_in - p1.aft_in); return { fwdLimit, aftLimit };}} if (currentWeight === sortedEnvelope[sortedEnvelope.length - 1].weight) { return { fwdLimit: sortedEnvelope[sortedEnvelope.length - 1].fwd_in, aftLimit: sortedEnvelope[sortedEnvelope.length - 1].aft_in };} return { fwdLimit: null, aftLimit: null };}
    
    function addStatusMessage(message, type, isSummary = false) { const p = document.createElement('p'); p.textContent = message; p.classList.add(`status-${type}`); if (isSummary) { p.style.fontWeight = 'bold'; p.style.fontSize = '1.1em';} statusMessagesDiv.appendChild(p);}
    
    function updateCgChart(airplane, calculatedWeight, calculatedMoment1000) {
        if (cgChart) { cgChart.destroy(); }
        const datasets = [];

        let minX_from_envelopes = Infinity, maxX_from_envelopes = -Infinity;
        let minY_from_envelopes = Infinity; // Solo necesitamos el mínimo absoluto de las envolventes
        // maxY_from_envelopes no es tan crucial, ya que finalMaxY se basará en MTOW

        function processEnvelopeDataForAxisBounds(envelopeData) {
            if (envelopeData && envelopeData.length > 0) {
                envelopeData.forEach(point => {
                    if (point.x < minX_from_envelopes) minX_from_envelopes = point.x;
                    if (point.x > maxX_from_envelopes) maxX_from_envelopes = point.x;
                    if (point.y < minY_from_envelopes) minY_from_envelopes = point.y; // Captura el Y más bajo de todas las envolventes
                });
                return true;
            }
            return false;
        }

        // --- Lógica para dibujar datasets (sin cambios respecto a la última versión) ---
        let utilityEnvelopeDrawn = false;
        if (airplane.limits.cgEnvelopeGraphUtility &&
            (airplane.limits.defaultCategory === "Utilitaria" || (airplane.limits.maxUtilityWeight_lbs && calculatedWeight <= airplane.limits.maxUtilityWeight_lbs))) {
            if (processEnvelopeDataForAxisBounds(airplane.limits.cgEnvelopeGraphUtility)) {
                datasets.push({ label: 'Categoría Utilitaria', data: airplane.limits.cgEnvelopeGraphUtility, borderColor: 'rgba(255, 159, 64, 1)', backgroundColor: 'rgba(255, 159, 64, 0.2)', borderWidth: 2, fill: true, pointRadius: 0, tension: 0 });
                utilityEnvelopeDrawn = true;
            }
        }
        if (airplane.limits.cgEnvelopeGraphNormal &&
            (airplane.limits.defaultCategory === "Normal" || !utilityEnvelopeDrawn || (airplane.limits.maxUtilityWeight_lbs && calculatedWeight > airplane.limits.maxUtilityWeight_lbs))) {
            processEnvelopeDataForAxisBounds(airplane.limits.cgEnvelopeGraphNormal);
            datasets.push({ label: 'Categoría Normal', data: airplane.limits.cgEnvelopeGraphNormal, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', borderWidth: 2, fill: true, pointRadius: 0, tension: 0 });
        }
        // --- Fin de lógica para dibujar datasets ---


        // --- Establecer límites de escala ---
        let finalMinX = minX_from_envelopes;
        let finalMaxX = maxX_from_envelopes;
        let finalMinY, finalMaxY;

        // Establecer maxY basado en MTOW
        finalMaxY = airplane.limits.maxTakeOffWeight_lbs || 2500; // Fallback si MTOW no está definido

        // Establecer minY basado en el mínimo de las envolventes
        if (minY_from_envelopes !== Infinity) {
            finalMinY = minY_from_envelopes;
        } else if (calculatedWeight > 0) { // Si no hay envolventes, basar en el punto calculado
            finalMinY = calculatedWeight - 200;
            finalMaxY = calculatedWeight + 200; // También ajustar maxY en este caso
        } else { // Sin envolventes ni punto, defaults amplios
            finalMinY = 1000;
            finalMaxY = 3000;
        }
        if (finalMinY < 0) finalMinY = 0;

        // Si no hay envolventes para X, usar defaults o punto calculado
        if (finalMinX === Infinity) finalMinX = (calculatedMoment1000 > 0 ? calculatedMoment1000 - 20 : 30);
        if (finalMaxX === -Infinity) finalMaxX = (calculatedMoment1000 > 0 ? calculatedMoment1000 + 20 : 130);


        // Añadir el punto calculado y expandir los límites si el punto está fuera
        if (calculatedWeight > 0) {
            datasets.push({ label: 'Punto Calculado', data: [{ x: calculatedMoment1000, y: calculatedWeight }], borderColor: 'rgba(255, 0, 0, 1)', backgroundColor: 'rgba(255, 0, 0, 1)', pointRadius: 6, pointHoverRadius: 8, type: 'scatter' });
            if (calculatedMoment1000 < finalMinX) finalMinX = calculatedMoment1000;
            if (calculatedMoment1000 > finalMaxX) finalMaxX = calculatedMoment1000;
            if (calculatedWeight < finalMinY) finalMinY = calculatedWeight; // El punto calculado puede bajar el minY
            if (calculatedWeight > finalMaxY) finalMaxY = calculatedWeight; // El punto calculado puede subir el maxY
        }
        
        // Añadir padding
        const xPadding = (finalMaxX - finalMinX) * 0.05 || 10; // Fallback si el rango es 0
        const yPadding = (finalMaxY - finalMinY) * 0.05 || 100; // Fallback

        finalMinX -= xPadding;
        finalMaxX += xPadding;
        finalMinY -= yPadding; // Aplicar padding inferior AHORA
        finalMaxY += yPadding; // Aplicar padding superior

        // Asegurar que los min no sean mayores que los max
        if (finalMinX >= finalMaxX) { finalMinX = finalMaxX - 20; }
        if (finalMinY >= finalMaxY) { finalMinY = finalMaxY - 200; }
        
        // Forzar que el minY del gráfico NO sea menor que el minY_from_envelopes (menos un pequeño margen o redondeo)
        // Y que maxY no sea menor que MTOW
        let scaleMinY = Math.floor(finalMinY / 100) * 100;
        let scaleMaxY = Math.ceil(finalMaxY / 100) * 100;

        if (minY_from_envelopes !== Infinity) {
            // Queremos que el eje empiece en o justo por debajo del minY_from_envelopes
            scaleMinY = Math.floor((minY_from_envelopes - yPadding * 0.5) / 100) * 100; // Un poco de padding pero basado en el mínimo real
            if (scaleMinY < 0) scaleMinY = 0;
        }
        if (airplane.limits.maxTakeOffWeight_lbs) {
            scaleMaxY = Math.ceil((airplane.limits.maxTakeOffWeight_lbs + yPadding * 0.5) / 100) * 100;
        }
        
        // Si el punto calculado es más bajo que el mínimo de la envolvente, ajustar scaleMinY
        if (calculatedWeight > 0 && calculatedWeight < scaleMinY) {
            scaleMinY = Math.floor((calculatedWeight - yPadding * 0.5) / 100) * 100;
            if (scaleMinY < 0) scaleMinY = 0;
        }
        // Si el punto calculado es más alto que el MTOW, ajustar scaleMaxY
        if (calculatedWeight > 0 && calculatedWeight > scaleMaxY) {
            scaleMaxY = Math.ceil((calculatedWeight + yPadding * 0.5) / 100) * 100;
        }


        // Evitar que scaleMinY sea mayor que scaleMaxY después de los ajustes
        if (scaleMinY >= scaleMaxY) {
            if (minY_from_envelopes !== Infinity) {
                scaleMinY = Math.floor(minY_from_envelopes / 100) * 100 - 100; // Un tick menos
            } else {
                scaleMinY = scaleMaxY - 200; // Un rango mínimo
            }
            if (scaleMinY < 0) scaleMinY = 0;
        }


        cgChart = new Chart(cgEnvelopeChartCanvas, {
            type: 'line', data: { datasets: datasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear', position: 'bottom',
                        title: { display: true, text: 'Momento Cargado / 1000 (lb-in)' },
                        min: Math.floor(finalMinX / 5) * 5,
                        max: Math.ceil(finalMaxX / 5) * 5
                    },
                    y: {
                        title: { display: true, text: 'Peso de Aeronave Cargada (lbs)' },
                        min: scaleMinY,
                        max: scaleMaxY
                    }
                },
                plugins: { /* ... (tooltips y leyenda como antes) ... */ }
            }
        });
    }
// --- Event Listeners ---
airplaneSelect.addEventListener('change', (e) => { displayAirplaneInputs(e.target.value); });
calculateBtn.addEventListener('click', calculateWeightAndBalance);
if (toggleChartBtn) {
    toggleChartBtn.addEventListener('click', () => {
        if (chartContainer.classList.contains('hidden')) {
            const airplaneId = airplaneSelect.value;
            if (airplaneId && outputColumn && !outputColumn.classList.contains('hidden')) { 
                const airplane = airplanesData[airplaneId];
                const currentTotalWeight = parseFloat(totalWeightLbsSpan.textContent) || 0;
                let momentForChart = 0;
                let tempZeroFuelMoment = airplane.emptyMoment_lb_in; let tempFuelMoment = 0;
                airplane.stations.forEach(station => {
                    let valueEntered;
                    if (station.type === 'single_weight') valueEntered = parseFloat(document.getElementById(`input-${station.id}`).value) || 0;
                    else if (station.type === 'paired_fuel') valueEntered = parseFloat(document.getElementById(`input-${station.id}-gal`).value) || 0;
                    else if (station.type === 'paired_weight') valueEntered = parseFloat(document.getElementById(`input-${station.id}-lbs`).value) || 0;
                    else valueEntered = 0;
                    if (valueEntered < 0) valueEntered = 0;
                    let itemWeightLbs = 0; let itemMomentFull = 0;
                    if (station.type === 'paired_fuel') { const gallons = valueEntered; itemWeightLbs = gallons / airplane.fuel_gallons_per_lbs; itemMomentFull = itemWeightLbs * station.arm_in; tempFuelMoment += itemMomentFull;}
                    else { itemWeightLbs = valueEntered; if (station.max_lbs && itemWeightLbs > station.max_lbs) itemWeightLbs = station.max_lbs; itemMomentFull = itemWeightLbs * station.arm_in; tempZeroFuelMoment += itemMomentFull;}
                });
                momentForChart = (tempZeroFuelMoment + tempFuelMoment) / 1000;

                if (currentTotalWeight > 0) {
                     updateCgChart(airplane, currentTotalWeight, momentForChart);
                     chartContainer.classList.remove('hidden');
                     chartContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                } else { addStatusMessage("No hay datos de peso para mostrar el gráfico.", "warning");}
            } else { addStatusMessage("Calcula P&B para ver el gráfico.", "warning"); }
        } else { chartContainer.classList.add('hidden'); }
    });
}

// --- Inicialización ---
populateAirplaneSelect();

}); // Cierre del DOMContentLoaded