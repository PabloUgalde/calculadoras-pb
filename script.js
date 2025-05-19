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

    // --- Datos de Aviones ---
    const airplanesData = {
        "c172m_kua": {
            name: "Cessna 172M Skyhawk (CC-KUA)",
            emptyWeight_lbs: 1366.0,
            emptyMoment_lb_in: 53800.0,
            fuel_gallons_per_lbs: 1 / 6,
            stations: [
                { name: "Aceite (8 Qts)", arm_in: -13.33, id: "oil", type: "single_weight", default_value: 15 },
                { name: "Piloto y Pas. Delantero", arm_in: 37.1, id: "front_pax", type: "paired_weight" },
                { name: "Pasajeros Traseros", arm_in: 73.0, id: "rear_pax", type: "paired_weight" },
                { name: "Combustible Usable", arm_in: 47.8, id: "fuel", type: "paired_fuel", max_gallons: 38 },
                { name: "Equipaje Área 1", arm_in: 90.9, id: "baggage1", type: "paired_weight", max_lbs: 120 },
                { name: "Equipaje Área 2", arm_in: 123.0, id: "baggage2", type: "paired_weight", max_lbs: 50 }
            ],
            limits: { 
                maxRampWeight_lbs: 2307.5, maxTakeOffWeight_lbs: 2300, maxLandingWeight_lbs: 2300,
                cgEnvelopeGraphNormal: [ { x: 52.5, y: 1500 }, { x: 68.25, y: 1950 }, { x: 88.5, y: 2300 }, { x: 108.8, y: 2300 }, { x: 92.3, y: 1950 }, { x: 71.0, y: 1500 }, { x: 52.5, y: 1500 } ],
                cgEnvelopeNormal: [ { weight: 1500, fwd_in: 35.0, aft_in: 47.33 }, { weight: 1950, fwd_in: 35.0, aft_in: 47.33 }, { weight: 2300, fwd_in: 38.48, aft_in: 47.30 } ],
                maxUtilityWeight_lbs: 2000,
                cgEnvelopeGraphUtility: [ { x: 52.5, y: 1500 }, { x: 68.25, y: 1950 }, { x: 71.2, y: 2000 }, { x: 81.5, y: 2000 }, { x: 60.6, y: 1500 }, { x: 52.5, y: 1500 } ],
                cgEnvelopeUtility: [ { weight: 1500, fwd_in: 35.0, aft_in: 40.4 }, { weight: 1950, fwd_in: 35.0, aft_in: 40.72 }, { weight: 2000, fwd_in: 35.6, aft_in: 40.75 } ],
                maxCombinedBaggage_lbs: 120
            }
        },
    };

    // --- Funciones de Utilidad de UI ---
    function hideAllSections() {
        console.log("--- hideAllSections INICIO ---");
        airplaneDetailsDiv.classList.add('hidden');
        if (inputColumn) {
            inputColumn.classList.add('hidden');
            console.log("inputColumn oculto.");
        } else { console.error("hideAllSections: inputColumn no encontrado."); }
        
        if (outputColumn) {
            outputColumn.classList.add('hidden');
            console.log("outputColumn oculto.");
        } else { console.error("hideAllSections: outputColumn no encontrado."); }
        
        // Los hijos de outputColumn (itemizedResultsContainer, totalResultsContainer)
        // se ocultan cuando outputColumn se oculta. No es necesario ocultarlos individualmente aquí
        // a menos que haya una razón específica para gestionarlos por separado en otros contextos.
        // itemizedResultsContainer.classList.add('hidden');
        // totalResultsContainer.classList.add('hidden');

        chartContainer.classList.add('hidden');
        console.log("chartContainer oculto.");
        calculateBtn.classList.add('hidden');
        console.log("calculateBtn oculto.");
        if (toggleChartBtn) {
            toggleChartBtn.classList.add('hidden');
            console.log("toggleChartBtn oculto.");
        }
        console.log("--- hideAllSections FIN ---");
    }
    
    hideAllSections(); // Ocultar todo al cargar la página

    // --- Funciones Principales ---
    function populateAirplaneSelect() {
        console.log("populateAirplaneSelect: Iniciando...");
        for (const id in airplanesData) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = airplanesData[id].name;
            airplaneSelect.appendChild(option);
        }
        console.log("populateAirplaneSelect: Finalizado.");
    }

    function displayAirplaneInputs(airplaneId) {
        console.log("--- displayAirplaneInputs INICIO --- ID:", airplaneId);
        inputsContainer.innerHTML = '';
        itemizedResultsContainer.innerHTML = '';
        statusMessagesDiv.innerHTML = '';
        hideAllSections();

        if (!airplaneId) {
            console.log("displayAirplaneInputs: No airplaneId. Saliendo.");
            return;
        }

        const airplane = airplanesData[airplaneId];
        if (!airplane) {
            console.error("displayAirplaneInputs: CRÍTICO - Datos del avión no encontrados para ID:", airplaneId);
            return;
        }
        console.log("displayAirplaneInputs: Datos del avión cargados:", airplane.name);
        
        airplaneNameTitle.textContent = airplane.name;
        emptyWeightLbsSpan.textContent = airplane.emptyWeight_lbs.toFixed(1);
        emptyWeightKgSpan.textContent = (airplane.emptyWeight_lbs * LBS_TO_KG_FACTOR).toFixed(1);
        emptyMomentSpan.textContent = airplane.emptyMoment_lb_in.toFixed(1);
        const emptyCgVal = airplane.emptyWeight_lbs !== 0 ? (airplane.emptyMoment_lb_in / airplane.emptyWeight_lbs).toFixed(2) : "N/A";
        emptyCgSpan.textContent = emptyCgVal;
        airplaneDetailsDiv.classList.remove('hidden');
        console.log("displayAirplaneInputs: Mostrando airplaneDetailsDiv.");

        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = 'Pesos en Estaciones';
        fieldset.appendChild(legend);
        const allInputs = [];

        if (!airplane.stations || airplane.stations.length === 0) {
            console.warn("displayAirplaneInputs: ADVERTENCIA - El avión no tiene estaciones definidas.");
        } else {
            console.log(`displayAirplaneInputs: Procesando ${airplane.stations.length} estaciones...`);
        }

        airplane.stations.forEach((station, index) => {
            console.log(`  Estación ${index + 1}: ${station.name}, Tipo: ${station.type}`);
            const group = document.createElement('div'); group.classList.add('input-group');
            const label = document.createElement('label'); label.textContent = `${station.name}:`; group.appendChild(label);
            const armInfo = document.createElement('span'); armInfo.classList.add('arm-info'); armInfo.textContent = `(Arm: ${station.arm_in.toFixed(1)} in)`;

            if (station.type === 'single_weight') {
                console.log("    Creando input 'single_weight'");
                const input = document.createElement('input'); input.type = 'number'; input.id = `input-${station.id}`; input.dataset.arm = station.arm_in;
                input.classList.add('single-input', 'focusable-input');
                if (station.default_value !== undefined) input.value = station.default_value;
                input.placeholder = `Peso (lbs)`; input.min = "0";
                allInputs.push(input); group.appendChild(input);
                console.log("      Input single_weight añadido al grupo.");
            } else if (station.type === 'paired_weight') {
                console.log("    Creando inputs 'paired_weight'");
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
                inputLbs.addEventListener('input', () => { const lbsVal = parseFloat(inputLbs.value); if (!isNaN(lbsVal) && lbsVal >= 0) { inputKg.value = (lbsVal * LBS_TO_KG_FACTOR).toFixed(1); if(station.max_lbs && lbsVal > station.max_lbs) { inputLbs.value = station.max_lbs; inputKg.value = (station.max_lbs * LBS_TO_KG_FACTOR).toFixed(1);}} else if (inputLbs.value === '') {inputKg.value = '';}});
                inputKg.addEventListener('input', () => { const kgVal = parseFloat(inputKg.value); if (!isNaN(kgVal) && kgVal >= 0) { const correspLbs = kgVal * KG_TO_LBS_FACTOR; inputLbs.value = correspLbs.toFixed(1); if(station.max_lbs && correspLbs > station.max_lbs) { inputLbs.value = station.max_lbs.toFixed(1); inputKg.value = (station.max_lbs * LBS_TO_KG_FACTOR).toFixed(1);}} else if (inputKg.value === '') {inputLbs.value = '';}});
                pairDiv.appendChild(inputLbs); pairDiv.appendChild(inputKg); group.appendChild(pairDiv);
                console.log("      pairDiv (con inputs lbs/kg) añadido al grupo.");
            } else if (station.type === 'paired_fuel') {
                console.log("    Creando inputs 'paired_fuel'");
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
                inputGal.addEventListener('input', () => { const galVal = parseFloat(inputGal.value); if (!isNaN(galVal) && galVal >= 0) { inputLtr.value = (galVal * GAL_TO_LTR_FACTOR).toFixed(1); if (station.max_gallons && galVal > station.max_gallons) { inputGal.value = station.max_gallons; inputLtr.value = (station.max_gallons * GAL_TO_LTR_FACTOR).toFixed(1);}} else if (inputGal.value === '') {inputLtr.value = '';}});
                inputLtr.addEventListener('input', () => { const ltrVal = parseFloat(inputLtr.value); if (!isNaN(ltrVal) && ltrVal >= 0) { const correspondingGal = ltrVal * LTR_TO_GAL_FACTOR; inputGal.value = correspondingGal.toFixed(1); if (station.max_gallons && correspondingGal > station.max_gallons) { inputGal.value = station.max_gallons.toFixed(1); inputLtr.value = (station.max_gallons * GAL_TO_LTR_FACTOR).toFixed(1);}} else if (inputLtr.value === '') {inputGal.value = '';}});
                pairDiv.appendChild(inputGal); pairDiv.appendChild(inputLtr); group.appendChild(pairDiv);
                console.log("      pairDiv (con inputs gal/ltr) añadido al grupo.");
            } else {
                console.warn(`    ADVERTENCIA: Tipo de estación desconocido '${station.type}' para la estación '${station.name}'. No se crearon inputs.`);
            }
            group.appendChild(armInfo); fieldset.appendChild(group); 
            console.log(`  Grupo para '${station.name}' añadido al fieldset.`);
        });
        
        console.log("displayAirplaneInputs: Contenido del fieldset ANTES de añadir a inputsContainer:", fieldset.innerHTML);
        inputsContainer.appendChild(fieldset);
        console.log("displayAirplaneInputs: Fieldset añadido a inputsContainer. Contenido de inputsContainer:", inputsContainer.innerHTML);
        
        inputsContainer.classList.remove('hidden'); // Mostrar el contenedor de inputs
        console.log("displayAirplaneInputs: Clase 'hidden' quitada de inputsContainer.");

        if (inputColumn) {
            inputColumn.classList.remove('hidden');
            console.log("displayAirplaneInputs: Mostrando inputColumn. classList:", inputColumn.classList);
        } else {
            console.error("displayAirplaneInputs: CRÍTICO - inputColumn no encontrado en el DOM.");
        }
        calculateBtn.classList.remove('hidden');
        console.log("displayAirplaneInputs: Mostrando calculateBtn.");

        console.log("displayAirplaneInputs: Llamando a setupInputNavigation. Número de allInputs:", allInputs.length);
        setupInputNavigation(allInputs);   
        console.log("--- displayAirplaneInputs FIN ---");
    }

    function calculateWeightAndBalance() {
        console.log("--- calculateWeightAndBalance INICIO ---"); // LOG E

        const airplaneId = airplaneSelect.value;
        if (!airplaneId) {
            console.log("calculateWeightAndBalance: No airplaneId. Saliendo."); // LOG F
            return;
        }
        const airplane = airplanesData[airplaneId];
        // ... (inicio de la lógica de cálculo) ...
        let currentTotalWeight = airplane.emptyWeight_lbs; let currentTotalMoment = airplane.emptyMoment_lb_in;
        let zeroFuelWeight = airplane.emptyWeight_lbs; let zeroFuelMoment = airplane.emptyMoment_lb_in;
        let fuelWeightLbs = 0; let fuelMoment = 0;
        statusMessagesDiv.innerHTML = ''; itemizedResultsContainer.innerHTML = '<h4>Desglose de Carga:</h4>';
        const emptyItemP = document.createElement('p');
        emptyItemP.innerHTML = `<strong>Peso Vacío:</strong> ${airplane.emptyWeight_lbs.toFixed(1)} lbs, <strong>Momento:</strong> ${airplane.emptyMoment_lb_in.toFixed(1)} lb-in`;
        itemizedResultsContainer.appendChild(emptyItemP);
        if (airplane.limits.maxCombinedBaggage_lbs) { /* ... */ } // Lógica de equipaje combinado
        airplane.stations.forEach(station => {
            let valueEntered; 
            if (station.type === 'single_weight') valueEntered = parseFloat(document.getElementById(`input-${station.id}`).value) || 0;
            else if (station.type === 'paired_fuel') valueEntered = parseFloat(document.getElementById(`input-${station.id}-gal`).value) || 0;
            else if (station.type === 'paired_weight') valueEntered = parseFloat(document.getElementById(`input-${station.id}-lbs`).value) || 0;
            else valueEntered = 0;
            if (valueEntered < 0) valueEntered = 0;
            let itemWeightLbs = 0; let itemMoment = 0; let displayValue = valueEntered;
            if (station.type === 'paired_fuel') {
                const gallons = valueEntered; itemWeightLbs = gallons / airplane.fuel_gallons_per_lbs;
                itemMoment = itemWeightLbs * station.arm_in; fuelWeightLbs += itemWeightLbs; fuelMoment += itemMoment;
            } else { 
                itemWeightLbs = valueEntered; 
                if (station.max_lbs && itemWeightLbs > station.max_lbs) itemWeightLbs = station.max_lbs;
                itemMoment = itemWeightLbs * station.arm_in; zeroFuelWeight += itemWeightLbs; zeroFuelMoment += itemMoment;
            }
            const itemP = document.createElement('p');
            if (station.type === 'paired_fuel') itemP.innerHTML = `<strong>${station.name} (${displayValue.toFixed(1)} gal):</strong> ${itemWeightLbs.toFixed(1)} lbs, <strong>Momento:</strong> ${itemMoment.toFixed(1)} lb-in`;
            else itemP.innerHTML = `<strong>${station.name}:</strong> ${itemWeightLbs.toFixed(1)} lbs, <strong>Momento:</strong> ${itemMoment.toFixed(1)} lb-in`;
            itemizedResultsContainer.appendChild(itemP);
        });
        currentTotalWeight = zeroFuelWeight + fuelWeightLbs; currentTotalMoment = zeroFuelMoment + fuelMoment;
        const calculatedCG = (currentTotalWeight > 0) ? currentTotalMoment / currentTotalWeight : 0;
        totalZfwLbsSpan.textContent = zeroFuelWeight.toFixed(1); totalZfwKgSpan.textContent = (zeroFuelWeight * LBS_TO_KG_FACTOR).toFixed(1);
        totalWeightLbsSpan.textContent = currentTotalWeight.toFixed(1); totalWeightKgSpan.textContent = (currentTotalWeight * LBS_TO_KG_FACTOR).toFixed(1);
        totalMomentSpan.textContent = currentTotalMoment.toFixed(1); calculatedCgSpan.textContent = calculatedCG.toFixed(2);
        // ... (Fin de la lógica de cálculo) ...

        console.log("calculateWeightAndBalance: Cálculos completados. Peso Total:", currentTotalWeight, "Momento Total:", currentTotalMoment, "CG:", calculatedCG.toFixed(2)); // LOG G
        console.log("calculateWeightAndBalance: Intentando mostrar outputColumn:", outputColumn);
        console.log("calculateWeightAndBalance: Intentando mostrar itemizedResultsContainer:", itemizedResultsContainer);
        console.log("calculateWeightAndBalance: Intentando mostrar totalResultsContainer:", totalResultsContainer);
        console.log("calculateWeightAndBalance: Intentando mostrar toggleChartBtn:", toggleChartBtn);

        if (outputColumn) {
            outputColumn.classList.remove('hidden');
            console.log("calculateWeightAndBalance: outputColumn classList:", outputColumn.classList); // LOG H
        } else {
            console.error("calculateWeightAndBalance: outputColumn no encontrado!");
        }
        
        itemizedResultsContainer.classList.remove('hidden'); // Asegurarse que estos también se muestren
        totalResultsContainer.classList.remove('hidden');
        console.log("calculateWeightAndBalance: itemizedResultsContainer classList:", itemizedResultsContainer.classList); // LOG I
        console.log("calculateWeightAndBalance: totalResultsContainer classList:", totalResultsContainer.classList);     // LOG J
        
        checkLimitsAndCategory(airplane, currentTotalWeight, calculatedCG, currentTotalMoment);

        chartContainer.classList.add('hidden'); 
        if (toggleChartBtn) {
            toggleChartBtn.classList.remove('hidden');
            console.log("calculateWeightAndBalance: toggleChartBtn classList:", toggleChartBtn.classList); // LOG K
        }

        if (totalResultsContainer.offsetParent) {
             totalResultsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
             console.log("calculateWeightAndBalance: Scroll a totalResultsContainer ejecutado."); // LOG L
        } else {
             console.warn("calculateWeightAndBalance: totalResultsContainer no es visible (offsetParent es null), no se puede hacer scroll."); // LOG M
        }
        console.log("--- calculateWeightAndBalance FIN ---"); // LOG N
    }
    
    // --- Funciones de Apoyo (checkLimitsAndCategory, getCGLimitsForWeight, etc.) ---
    function setupInputNavigation(inputs) { inputs.forEach((input, index) => { input.addEventListener('keydown', (e) => { if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey && index < inputs.length - 1)) { e.preventDefault(); inputs[index + 1]?.focus();}});});}
    function checkLimitsAndCategory(airplane, weight, cg, moment) { let inLimits = true; let category = "Fuera de Límites"; statusMessagesDiv.innerHTML = ''; if (weight > airplane.limits.maxTakeOffWeight_lbs) { addStatusMessage(`ERROR: Peso Total (${weight.toFixed(1)} lbs) excede el Máximo de Despegue (${airplane.limits.maxTakeOffWeight_lbs} lbs).`, 'error'); inLimits = false; } else { addStatusMessage(`Peso Total (${weight.toFixed(1)} lbs) DENTRO del Máximo de Despegue (${airplane.limits.maxTakeOffWeight_lbs} lbs).`, 'ok');} if (airplane.limits.maxRampWeight_lbs && weight > airplane.limits.maxRampWeight_lbs) { addStatusMessage(`ADVERTENCIA: Peso Total (${weight.toFixed(1)} lbs) excede el Máximo en Rampa (${airplane.limits.maxRampWeight_lbs} lbs).`, 'warning');} let inUtilityLimits = false; if (airplane.limits.cgEnvelopeUtility && weight <= airplane.limits.maxUtilityWeight_lbs) { const { fwdLimit, aftLimit } = getCGLimitsForWeight(airplane.limits.cgEnvelopeUtility, weight); if (fwdLimit !== null && aftLimit !== null) { if (cg >= fwdLimit && cg <= aftLimit) { inUtilityLimits = true; category = "Utilitaria"; addStatusMessage(`CG (${cg.toFixed(2)} in) DENTRO de límites de Cat. Utilitaria (${fwdLimit.toFixed(2)} - ${aftLimit.toFixed(2)} in).`, 'ok'); } else { if (cg < fwdLimit) addStatusMessage(`ERROR (Cat. Utilitaria): CG (${cg.toFixed(2)} in) DEMASIADO ADELANTE. Límite: ${fwdLimit.toFixed(2)} in.`, 'warning'); if (cg > aftLimit) addStatusMessage(`ERROR (Cat. Utilitaria): CG (${cg.toFixed(2)} in) DEMASIADO ATRÁS. Límite: ${aftLimit.toFixed(2)} in.`, 'warning');}} else { addStatusMessage(`ADVERTENCIA: No se pudieron determinar los límites de CG Utilitario para el peso actual (${weight.toFixed(1)} lbs).`, 'warning');}} let inNormalLimits = false; if (inLimits) {  const { fwdLimit, aftLimit } = getCGLimitsForWeight(airplane.limits.cgEnvelopeNormal, weight); if (fwdLimit === null || aftLimit === null) { addStatusMessage(`ERROR: No se pudieron determinar los límites de CG Normal para el peso actual (${weight.toFixed(1)} lbs).`, 'error'); inLimits = false;  } else { if (cg < fwdLimit) { addStatusMessage(`ERROR (Cat. Normal): CG (${cg.toFixed(2)} in) DEMASIADO ADELANTE. Límite: ${fwdLimit.toFixed(2)} in.`, 'error'); inLimits = false; } else if (cg > aftLimit) { addStatusMessage(`ERROR (Cat. Normal): CG (${cg.toFixed(2)} in) DEMASIADO ATRÁS. Límite: ${aftLimit.toFixed(2)} in.`, 'error'); inLimits = false; } else { inNormalLimits = true; if (!inUtilityLimits) {  category = "Normal"; addStatusMessage(`CG (${cg.toFixed(2)} in) DENTRO de límites de Cat. Normal (${fwdLimit.toFixed(2)} - ${aftLimit.toFixed(2)} in).`, 'ok');}}}} operationCategorySpan.textContent = category; if (inLimits && (inNormalLimits || inUtilityLimits)) {  addStatusMessage(`AVIÓN DENTRO DE LÍMITES DE PESO Y BALANCE (Categoría ${category}).`, 'ok', true); } else { addStatusMessage("AVIÓN FUERA DE LÍMITES. NO DESPEGAR.", 'error', true);}}
    function getCGLimitsForWeight(cgEnvelope, currentWeight) { if (!cgEnvelope || cgEnvelope.length === 0) return { fwdLimit: null, aftLimit: null }; const sortedEnvelope = [...cgEnvelope].sort((a, b) => a.weight - b.weight); if (currentWeight < sortedEnvelope[0].weight) return { fwdLimit: sortedEnvelope[0].fwd_in, aftLimit: sortedEnvelope[0].aft_in }; if (currentWeight > sortedEnvelope[sortedEnvelope.length - 1].weight) return { fwdLimit: sortedEnvelope[sortedEnvelope.length - 1].fwd_in, aftLimit: sortedEnvelope[sortedEnvelope.length - 1].aft_in }; for (let i = 0; i < sortedEnvelope.length - 1; i++) { const p1 = sortedEnvelope[i]; const p2 = sortedEnvelope[i + 1]; if (currentWeight >= p1.weight && currentWeight <= p2.weight) { const weightRatio = (p2.weight - p1.weight === 0) ? 0 : (currentWeight - p1.weight) / (p2.weight - p1.weight); const fwdLimit = p1.fwd_in + weightRatio * (p2.fwd_in - p1.fwd_in); const aftLimit = p1.aft_in + weightRatio * (p2.aft_in - p1.aft_in); return { fwdLimit, aftLimit };}} if (currentWeight === sortedEnvelope[sortedEnvelope.length - 1].weight) { return { fwdLimit: sortedEnvelope[sortedEnvelope.length - 1].fwd_in, aftLimit: sortedEnvelope[sortedEnvelope.length - 1].aft_in };} return { fwdLimit: null, aftLimit: null };}
    function addStatusMessage(message, type, isSummary = false) { const p = document.createElement('p'); p.textContent = message; p.classList.add(`status-${type}`); if (isSummary) { p.style.fontWeight = 'bold'; p.style.fontSize = '1.1em';} statusMessagesDiv.appendChild(p);}
    function updateCgChart(airplane, calculatedWeight, calculatedMoment1000) { if (cgChart) { cgChart.destroy();} const normalEnvelopeData = airplane.limits.cgEnvelopeGraphNormal || []; const utilityEnvelopeData = airplane.limits.cgEnvelopeGraphUtility || []; const datasets = []; if (utilityEnvelopeData.length > 0) { datasets.push({ label: 'Categoría Utilitaria', data: utilityEnvelopeData, borderColor: 'rgba(255, 159, 64, 1)', backgroundColor: 'rgba(255, 159, 64, 0.2)', borderWidth: 2, fill: true, pointRadius: 0, tension: 0 });} if (normalEnvelopeData.length > 0) { datasets.push({ label: 'Categoría Normal', data: normalEnvelopeData, borderColor: 'rgba(75, 192, 192, 1)', backgroundColor: 'rgba(75, 192, 192, 0.2)', borderWidth: 2, fill: true, pointRadius: 0, tension: 0 });} datasets.push({ label: 'Punto Calculado', data: [{ x: calculatedMoment1000, y: calculatedWeight }], borderColor: 'rgba(255, 0, 0, 1)', backgroundColor: 'rgba(255, 0, 0, 1)', pointRadius: 6, pointHoverRadius: 8, type: 'scatter' }); cgChart = new Chart(cgEnvelopeChartCanvas, { type: 'line', data: { datasets: datasets }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { type: 'linear', position: 'bottom', title: { display: true, text: 'Momento Cargado / 1000 (pound-inches)' }, min: 40, max: 120 }, y: { title: { display: true, text: 'Peso de Aeronave Cargada (pounds)' }, min: 1500, max: 2400 }}, plugins: { legend: { position: 'top' }, tooltip: { callbacks: { label: function(context) { let label = context.dataset.label || ''; if (label) label += ': '; if (context.parsed.y !== null) label += `Peso ${context.parsed.y.toFixed(0)} lbs`; if (context.parsed.x !== null) label += `, Mom/1000 ${context.parsed.x.toFixed(1)}`; return label;}}}}}}); }

    // --- Event Listeners ---
    airplaneSelect.addEventListener('change', (e) => {
        displayAirplaneInputs(e.target.value);
    });

    calculateBtn.addEventListener('click', calculateWeightAndBalance);

    if (toggleChartBtn) {
        toggleChartBtn.addEventListener('click', () => {
            if (chartContainer.classList.contains('hidden')) {
                const airplaneId = airplaneSelect.value;
                // Solo actualiza y muestra el gráfico si hay un avión seleccionado y los resultados ya se han calculado (outputColumn está visible)
                if (airplaneId && outputColumn && !outputColumn.classList.contains('hidden')) { 
                    const airplane = airplanesData[airplaneId];
                    // Leer los valores totales directamente de los spans (ya que calculateWeightAndBalance ya los actualizó)
                    const currentTotalWeight = parseFloat(totalWeightLbsSpan.textContent) || 0;
                    const currentTotalMoment = parseFloat(totalMomentSpan.textContent) || 0;
                    
                    if (currentTotalWeight > 0) { // Solo intentar actualizar si hay peso
                         updateCgChart(airplane, currentTotalWeight, currentTotalMoment / 1000);
                         chartContainer.classList.remove('hidden');
                         chartContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    } else {
                        // Podrías añadir un mensaje si no hay peso para graficar
                        addStatusMessage("No hay datos de peso para mostrar el gráfico.", "warning");
                    }
                } else {
                    addStatusMessage("Primero selecciona un avión y calcula el peso y balance para ver el gráfico.", "warning");
                }
            } else {
                chartContainer.classList.add('hidden');
            }
        });
    }

    // --- Inicialización ---
    populateAirplaneSelect();
});