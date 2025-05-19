document.addEventListener('DOMContentLoaded', () => {
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
    let cgChart = null;

    const LBS_TO_KG_FACTOR = 0.453592;
    const KG_TO_LBS_FACTOR = 1 / LBS_TO_KG_FACTOR;
    const GAL_TO_LTR_FACTOR = 3.78541;
    const LTR_TO_GAL_FACTOR = 1 / GAL_TO_LTR_FACTOR;

    const airplanesData = {
        "c172m_kua": {
            name: "Cessna 172M Skyhawk (CC-KUA)",
            emptyWeight_lbs: 1366.0,
            emptyMoment_lb_in: 53800.0,
            fuel_gallons_per_lbs: 1 / 6,
            stations: [
                // Usaremos tipos más genéricos y una bandera `is_oil` o `is_fuel` para casos especiales
                { name: "Aceite (8 Qts)", arm_in: -13.33, id: "oil", type: "single_weight", default_value: 15 },
                { name: "Piloto y Pas. Delantero", arm_in: 37.1, id: "front_pax", type: "paired_weight" },
                { name: "Pasajeros Traseros", arm_in: 73.0, id: "rear_pax", type: "paired_weight" },
                { name: "Combustible Usable", arm_in: 47.8, id: "fuel", type: "paired_fuel", max_gallons: 38 },
                { name: "Equipaje Área 1", arm_in: 90.9, id: "baggage1", type: "paired_weight", max_lbs: 120 },
                { name: "Equipaje Área 2", arm_in: 123.0, id: "baggage2", type: "paired_weight", max_lbs: 50 }
            ],
            limits: { // Copiando los límites corregidos de la interacción anterior
                maxRampWeight_lbs: 2307.5,
                maxTakeOffWeight_lbs: 2300,
                maxLandingWeight_lbs: 2300,
                cgEnvelopeGraphNormal: [
                    { x: 52.5, y: 1500 }, { x: 68.25, y: 1950 }, { x: 88.5, y: 2300 },
                    { x: 108.8, y: 2300 }, { x: 92.3, y: 1950 }, { x: 71.0, y: 1500 },
                    { x: 52.5, y: 1500 }
                ],
                cgEnvelopeNormal: [
                    { weight: 1500, fwd_in: 35.0, aft_in: 47.33 },
                    { weight: 1950, fwd_in: 35.0, aft_in: 47.33 },
                    { weight: 2300, fwd_in: 38.48, aft_in: 47.30 }
                ],
                maxUtilityWeight_lbs: 2000,
                cgEnvelopeGraphUtility: [
                    { x: 52.5, y: 1500 }, { x: 68.25, y: 1950 }, { x: 71.2, y: 2000 },
                    { x: 81.5, y: 2000 }, { x: 60.6, y: 1500 }, { x: 52.5, y: 1500 }
                ],
                cgEnvelopeUtility: [
                    { weight: 1500, fwd_in: 35.0, aft_in: 40.4 },
                    { weight: 1950, fwd_in: 35.0, aft_in: 40.72 },
                    { weight: 2000, fwd_in: 35.6, aft_in: 40.75 }
                ],
                maxCombinedBaggage_lbs: 120
            }
        },
        // ... otros aviones
    };

        function populateAirplaneSelect() {
        console.log("Populating airplane select..."); // LOG 1
        for (const id in airplanesData) {
            const option = document.createElement('option');
            option.value = id;
            option.textContent = airplanesData[id].name;
            airplaneSelect.appendChild(option);
        }
        console.log("Airplane select populated."); // LOG 2
    }

    function displayAirplaneInputs(airplaneId) {
        console.log("displayAirplaneInputs called with ID:", airplaneId); // LOG 3

        inputsContainer.innerHTML = '';
        itemizedResultsContainer.innerHTML = '';
        // ... (resto de la limpieza inicial) ...

        if (!airplaneId) {
            console.log("No airplaneId, hiding details."); // LOG 4
            // ... (ocultar divs) ...
            return;
        }

        const airplane = airplanesData[airplaneId];
        if (!airplane) {
            console.error("Airplane data not found for ID:", airplaneId); // LOG 5 - IMPORTANTE
            return;
        }
        console.log("Airplane data loaded:", airplane.name); // LOG 6
        airplaneNameTitle.textContent = airplane.name;
        emptyWeightLbsSpan.textContent = airplane.emptyWeight_lbs.toFixed(1);
        emptyWeightKgSpan.textContent = (airplane.emptyWeight_lbs * LBS_TO_KG_FACTOR).toFixed(1);
        emptyMomentSpan.textContent = airplane.emptyMoment_lb_in.toFixed(1);
        const emptyCgVal = airplane.emptyWeight_lbs !== 0 ? (airplane.emptyMoment_lb_in / airplane.emptyWeight_lbs).toFixed(2) : "N/A";
        emptyCgSpan.textContent = emptyCgVal;


        const fieldset = document.createElement('fieldset');
        const legend = document.createElement('legend');
        legend.textContent = 'Pesos en Estaciones';
        fieldset.appendChild(legend);

        const allInputs = [];

        airplane.stations.forEach(station => {
            const group = document.createElement('div');
            group.classList.add('input-group');
            
            const label = document.createElement('label');
            label.textContent = `${station.name}:`;
            group.appendChild(label);

            const armInfo = document.createElement('span');
            armInfo.classList.add('arm-info');
            armInfo.textContent = `(Arm: ${station.arm_in.toFixed(1)} in)`;

            if (station.type === 'single_weight') {
                const input = document.createElement('input');
                input.type = 'number';
                input.id = `input-${station.id}`; // Usado para aceite, que es solo lbs
                input.dataset.arm = station.arm_in;
                input.classList.add('single-input', 'focusable-input');
                if (station.default_value !== undefined) input.value = station.default_value;
                input.placeholder = `Peso (lbs)`;
                input.min = "0";
                allInputs.push(input);
                group.appendChild(input);
            } else if (station.type === 'paired_weight') {
                const pairDiv = document.createElement('div');
                pairDiv.classList.add('input-pair-container');

                const inputLbs = document.createElement('input');
                inputLbs.type = 'number';
                inputLbs.id = `input-${station.id}-lbs`;
                inputLbs.dataset.arm = station.arm_in;
                inputLbs.placeholder = station.max_lbs ? `Max ${station.max_lbs} lbs` : `Peso (lbs)`;
                if(station.max_lbs) inputLbs.max = station.max_lbs;
                inputLbs.min = "0";
                inputLbs.classList.add('focusable-input');
                allInputs.push(inputLbs);

                const inputKg = document.createElement('input');
                inputKg.type = 'number';
                inputKg.id = `input-${station.id}-kg`;
                const maxKg = station.max_lbs ? (station.max_lbs * LBS_TO_KG_FACTOR).toFixed(1) : null;
                inputKg.placeholder = maxKg ? `Max ${maxKg} kg` : `Peso (kg)`;
                if(maxKg) inputKg.max = maxKg;
                inputKg.min = "0";
                inputKg.classList.add('focusable-input');
                allInputs.push(inputKg);
                
                inputLbs.addEventListener('input', () => {
                    const lbsVal = parseFloat(inputLbs.value);
                    if (lbsVal >= 0) {
                        inputKg.value = (lbsVal * LBS_TO_KG_FACTOR).toFixed(1);
                        if(station.max_lbs && lbsVal > station.max_lbs) {
                            inputLbs.value = station.max_lbs;
                            inputKg.value = (station.max_lbs * LBS_TO_KG_FACTOR).toFixed(1);
                        }
                    } else {
                        inputKg.value = '';
                    }
                });
                inputKg.addEventListener('input', () => {
                    const kgVal = parseFloat(inputKg.value);
                    if (kgVal >= 0) {
                        const correspLbs = kgVal * KG_TO_LBS_FACTOR;
                        inputLbs.value = correspLbs.toFixed(1);
                        if(station.max_lbs && correspLbs > station.max_lbs) {
                            inputLbs.value = station.max_lbs.toFixed(1);
                            inputKg.value = (station.max_lbs * LBS_TO_KG_FACTOR).toFixed(1);
                        }
                    } else {
                        inputLbs.value = '';
                    }
                });
                
                pairDiv.appendChild(inputLbs);
                pairDiv.appendChild(inputKg);
                group.appendChild(pairDiv);
            } else if (station.type === 'paired_fuel') {
                const pairDiv = document.createElement('div');
                pairDiv.classList.add('input-pair-container');

                const inputGal = document.createElement('input');
                inputGal.type = 'number';
                inputGal.id = `input-${station.id}-gal`;
                inputGal.dataset.arm = station.arm_in;
                inputGal.placeholder = station.max_gallons ? `0 - ${station.max_gallons} gal` : `Galones`;
                if (station.max_gallons) inputGal.max = station.max_gallons;
                inputGal.min = "0";
                inputGal.classList.add('focusable-input');
                allInputs.push(inputGal);

                const inputLtr = document.createElement('input');
                inputLtr.type = 'number';
                inputLtr.id = `input-${station.id}-ltr`;
                const maxLiters = station.max_gallons ? (station.max_gallons * GAL_TO_LTR_FACTOR).toFixed(1) : null;
                inputLtr.placeholder = maxLiters ? `0 - ${maxLiters} Ltr` : `Litros`;
                if (maxLiters) inputLtr.max = maxLiters;
                inputLtr.min = "0";
                inputLtr.classList.add('focusable-input');
                allInputs.push(inputLtr);

                inputGal.addEventListener('input', () => {
                    const galVal = parseFloat(inputGal.value);
                    if (galVal >= 0) {
                        inputLtr.value = (galVal * GAL_TO_LTR_FACTOR).toFixed(1);
                        if (station.max_gallons && galVal > station.max_gallons) {
                            inputGal.value = station.max_gallons;
                            inputLtr.value = (station.max_gallons * GAL_TO_LTR_FACTOR).toFixed(1);
                        }
                    } else {
                        inputLtr.value = '';
                    }
                });
                inputLtr.addEventListener('input', () => {
                    const ltrVal = parseFloat(inputLtr.value);
                     if (ltrVal >= 0) {
                        const correspondingGal = ltrVal * LTR_TO_GAL_FACTOR;
                        inputGal.value = correspondingGal.toFixed(1);
                        if (station.max_gallons && correspondingGal > station.max_gallons) {
                            inputGal.value = station.max_gallons.toFixed(1);
                            inputLtr.value = (station.max_gallons * GAL_TO_LTR_FACTOR).toFixed(1);
                        }
                    } else {
                        inputGal.value = '';
                    }
                });
                
                pairDiv.appendChild(inputGal);
                pairDiv.appendChild(inputLtr);
                group.appendChild(pairDiv);
            }
            
            group.appendChild(armInfo);
            fieldset.appendChild(group); 
        });
        
        console.log("Finished creating inputs. Number of allInputs:", allInputs.length); // LOG 7
        setupInputNavigation(allInputs);   
        inputsContainer.appendChild(fieldset);

        airplaneDetailsDiv.classList.remove('hidden');
        inputsContainer.classList.remove('hidden');
        calculateBtn.classList.remove('hidden');
         console.log("Inputs should now be visible."); // LOG 8 (Este es el que preguntabas dónde iba)
    }

    function setupInputNavigation(inputs) {
        inputs.forEach((input, index) => {
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || (e.key === 'Tab' && !e.shiftKey && index < inputs.length - 1)) {
                    e.preventDefault();
                    inputs[index + 1]?.focus();
                }
            });
        });
    }

    function calculateWeightAndBalance() {
        const airplaneId = airplaneSelect.value;
        if (!airplaneId) return;

        const airplane = airplanesData[airplaneId];
        let currentTotalWeight = airplane.emptyWeight_lbs;
        let currentTotalMoment = airplane.emptyMoment_lb_in;
        let zeroFuelWeight = airplane.emptyWeight_lbs;
        let zeroFuelMoment = airplane.emptyMoment_lb_in;
        
        let fuelWeightLbs = 0; // Renombrado para claridad
        let fuelMoment = 0;

        statusMessagesDiv.innerHTML = '';
        itemizedResultsContainer.innerHTML = '<h4>Desglose de Carga:</h4>'; 

        const emptyItemP = document.createElement('p');
        emptyItemP.innerHTML = `<strong>Peso Vacío:</strong> ${airplane.emptyWeight_lbs.toFixed(1)} lbs, <strong>Momento:</strong> ${airplane.emptyMoment_lb_in.toFixed(1)} lb-in`;
        itemizedResultsContainer.appendChild(emptyItemP);

        if (airplane.limits.maxCombinedBaggage_lbs) {
            const baggage1LbsInput = document.getElementById('input-baggage1-lbs'); // Asume que el ID es 'baggage1'
            const baggage2LbsInput = document.getElementById('input-baggage2-lbs'); // Asume que el ID es 'baggage2'
            if (baggage1LbsInput && baggage2LbsInput) {
                const baggage1Weight = parseFloat(baggage1LbsInput.value) || 0;
                const baggage2Weight = parseFloat(baggage2LbsInput.value) || 0;
                if (baggage1Weight + baggage2Weight > airplane.limits.maxCombinedBaggage_lbs) {
                    addStatusMessage(`Advertencia: Límite de equipaje combinado (${airplane.limits.maxCombinedBaggage_lbs} lbs) excedido. Total: ${(baggage1Weight + baggage2Weight).toFixed(1)} lbs`, 'warning');
                }
            }
        }

        airplane.stations.forEach(station => {
            let valueEntered; 
            
            if (station.type === 'single_weight') {
                valueEntered = parseFloat(document.getElementById(`input-${station.id}`).value) || 0; // Este es el peso en lbs
            } else if (station.type === 'paired_fuel') {
                valueEntered = parseFloat(document.getElementById(`input-${station.id}-gal`).value) || 0; // Esto son GALONES
            } else if (station.type === 'paired_weight') {
                valueEntered = parseFloat(document.getElementById(`input-${station.id}-lbs`).value) || 0; // Esto es LBS
            } else {
                valueEntered = 0;
            }

            if (valueEntered < 0) valueEntered = 0;

            let itemWeightLbs = 0;
            let itemMoment = 0;
            let displayValue = valueEntered; // Para mostrar en el resultado del item

            if (station.type === 'paired_fuel') {
                const gallons = valueEntered;
                itemWeightLbs = gallons / airplane.fuel_gallons_per_lbs;
                if (station.max_gallons && gallons > station.max_gallons) { // Re-validar aquí por si acaso
                    // itemWeightLbs = station.max_gallons / airplane.fuel_gallons_per_lbs;
                    // displayValue = station.max_gallons;
                    // No es necesario, la corrección se hace en el input. Solo informativo
                }
                itemMoment = itemWeightLbs * station.arm_in;
                fuelWeightLbs += itemWeightLbs;
                fuelMoment += itemMoment;
            } else { // 'single_weight' o 'paired_weight'
                itemWeightLbs = valueEntered; 
                if (station.max_lbs && itemWeightLbs > station.max_lbs) {
                   itemWeightLbs = station.max_lbs;
                   // displayValue = station.max_lbs;
                }
                itemMoment = itemWeightLbs * station.arm_in;
                zeroFuelWeight += itemWeightLbs;
                zeroFuelMoment += itemMoment;
            }
            
            const itemP = document.createElement('p');
            if (station.type === 'paired_fuel') {
                 itemP.innerHTML = `<strong>${station.name} (${displayValue.toFixed(1)} gal):</strong> ${itemWeightLbs.toFixed(1)} lbs, <strong>Momento:</strong> ${itemMoment.toFixed(1)} lb-in`;
            } else {
                 itemP.innerHTML = `<strong>${station.name}:</strong> ${itemWeightLbs.toFixed(1)} lbs, <strong>Momento:</strong> ${itemMoment.toFixed(1)} lb-in`;
            }
            itemizedResultsContainer.appendChild(itemP);
        });
        
        currentTotalWeight = zeroFuelWeight + fuelWeightLbs;
        currentTotalMoment = zeroFuelMoment + fuelMoment;

        const calculatedCG = (currentTotalWeight > 0) ? currentTotalMoment / currentTotalWeight : 0;

        totalZfwLbsSpan.textContent = zeroFuelWeight.toFixed(1);
        totalZfwKgSpan.textContent = (zeroFuelWeight * LBS_TO_KG_FACTOR).toFixed(1);
        totalWeightLbsSpan.textContent = currentTotalWeight.toFixed(1);
        totalWeightKgSpan.textContent = (currentTotalWeight * LBS_TO_KG_FACTOR).toFixed(1);
        totalMomentSpan.textContent = currentTotalMoment.toFixed(1);
        calculatedCgSpan.textContent = calculatedCG.toFixed(2);

        checkLimitsAndCategory(airplane, currentTotalWeight, calculatedCG, currentTotalMoment);

        itemizedResultsContainer.classList.remove('hidden');
        totalResultsContainer.classList.remove('hidden');
        updateCgChart(airplane, currentTotalWeight, currentTotalMoment / 1000);
        chartContainer.classList.remove('hidden');
    }
    function checkLimitsAndCategory(airplane, weight, cg, moment) { // 'moment' aquí es el momento total, no moment/1000
    let inLimits = true; // Asumir que está en límites hasta que se pruebe lo contrario
    let category = "Fuera de Límites"; // Categoría por defecto

    statusMessagesDiv.innerHTML = ''; // Limpiar mensajes de estado previos antes de añadir nuevos

    // Chequeo de Peso Máximo de Despegue
    if (weight > airplane.limits.maxTakeOffWeight_lbs) {
        addStatusMessage(`ERROR: Peso Total (${weight.toFixed(1)} lbs) excede el Máximo de Despegue (${airplane.limits.maxTakeOffWeight_lbs} lbs).`, 'error');
        inLimits = false;
    } else {
        addStatusMessage(`Peso Total (${weight.toFixed(1)} lbs) DENTRO del Máximo de Despegue (${airplane.limits.maxTakeOffWeight_lbs} lbs).`, 'ok');
    }
    
    // Chequeo de Peso Máximo en Rampa (informativo)
    if (airplane.limits.maxRampWeight_lbs && weight > airplane.limits.maxRampWeight_lbs) {
         addStatusMessage(`ADVERTENCIA: Peso Total (${weight.toFixed(1)} lbs) excede el Máximo en Rampa (${airplane.limits.maxRampWeight_lbs} lbs).`, 'warning');
    }

    // Determinar categoría y verificar límites de CG
    let inUtilityLimits = false;
    if (airplane.limits.cgEnvelopeUtility && weight <= airplane.limits.maxUtilityWeight_lbs) {
        const { fwdLimit, aftLimit } = getCGLimitsForWeight(airplane.limits.cgEnvelopeUtility, weight);
        if (fwdLimit !== null && aftLimit !== null) {
            if (cg >= fwdLimit && cg <= aftLimit) {
                inUtilityLimits = true;
                category = "Utilitaria";
                addStatusMessage(`CG (${cg.toFixed(2)} in) DENTRO de límites de Cat. Utilitaria (${fwdLimit.toFixed(2)} - ${aftLimit.toFixed(2)} in).`, 'ok');
            } else {
                 // Sigue estando fuera de Utilitaria, incluso si el peso es correcto
                 if (cg < fwdLimit) addStatusMessage(`ERROR (Cat. Utilitaria): CG (${cg.toFixed(2)} in) DEMASIADO ADELANTE. Límite: ${fwdLimit.toFixed(2)} in.`, 'warning');
                 if (cg > aftLimit) addStatusMessage(`ERROR (Cat. Utilitaria): CG (${cg.toFixed(2)} in) DEMASIADO ATRÁS. Límite: ${aftLimit.toFixed(2)} in.`, 'warning');
            }
        } else {
            addStatusMessage(`ADVERTENCIA: No se pudieron determinar los límites de CG Utilitario para el peso actual (${weight.toFixed(1)} lbs).`, 'warning');
        }
    }

    let inNormalLimits = false;
    // Solo verificar CG Normal si el peso total está dentro de los límites generales de despegue
    if (inLimits) { 
        const { fwdLimit, aftLimit } = getCGLimitsForWeight(airplane.limits.cgEnvelopeNormal, weight);
        if (fwdLimit === null || aftLimit === null) {
            addStatusMessage(`ERROR: No se pudieron determinar los límites de CG Normal para el peso actual (${weight.toFixed(1)} lbs). Puede estar fuera del rango del envelope.`, 'error');
            inLimits = false; // Considerar esto como fuera de límites si no se puede determinar
        } else {
            if (cg < fwdLimit) {
                addStatusMessage(`ERROR (Cat. Normal): CG (${cg.toFixed(2)} in) DEMASIADO ADELANTE. Límite: ${fwdLimit.toFixed(2)} in.`, 'error');
                inLimits = false;
            } else if (cg > aftLimit) {
                addStatusMessage(`ERROR (Cat. Normal): CG (${cg.toFixed(2)} in) DEMASIADO ATRÁS. Límite: ${aftLimit.toFixed(2)} in.`, 'error');
                inLimits = false;
            } else {
                inNormalLimits = true;
                if (!inUtilityLimits) { // Si no es Utilitaria pero sí Normal
                     category = "Normal";
                     addStatusMessage(`CG (${cg.toFixed(2)} in) DENTRO de límites de Cat. Normal (${fwdLimit.toFixed(2)} - ${aftLimit.toFixed(2)} in).`, 'ok');
                } else {
                    // Ya es Utilitaria, pero también cumple Normal (lo cual es esperado)
                    // Podemos añadir un mensaje si es útil, o dejarlo como está.
                    // addStatusMessage(`CG también DENTRO de límites de Cat. Normal (${fwdLimit.toFixed(2)} - ${aftLimit.toFixed(2)} in).`, 'ok');
                }
            }
        }
    }
    
    operationCategorySpan.textContent = category;

    // Mensaje final de resumen
    if (inLimits && (inNormalLimits || inUtilityLimits)) { // Debe estar dentro del peso y dentro de alguna categoría de CG válida
        addStatusMessage(`AVIÓN DENTRO DE LÍMITES DE PESO Y BALANCE (Categoría ${category}).`, 'ok', true);
    } else {
        // Si 'inLimits' es false por peso, o si es true pero ni inNormalLimits ni inUtilityLimits son true.
        addStatusMessage("AVIÓN FUERA DE LÍMITES. NO DESPEGAR.", 'error', true);
    }
}
    function getCGLimitsForWeight(cgEnvelope, currentWeight) {
        if (!cgEnvelope || cgEnvelope.length === 0) return { fwdLimit: null, aftLimit: null };
        const sortedEnvelope = [...cgEnvelope].sort((a, b) => a.weight - b.weight);

        if (currentWeight < sortedEnvelope[0].weight) return { fwdLimit: sortedEnvelope[0].fwd_in, aftLimit: sortedEnvelope[0].aft_in };
        if (currentWeight > sortedEnvelope[sortedEnvelope.length - 1].weight) return { fwdLimit: sortedEnvelope[sortedEnvelope.length - 1].fwd_in, aftLimit: sortedEnvelope[sortedEnvelope.length - 1].aft_in };

        for (let i = 0; i < sortedEnvelope.length - 1; i++) {
            const p1 = sortedEnvelope[i];
            const p2 = sortedEnvelope[i + 1];
            if (currentWeight >= p1.weight && currentWeight <= p2.weight) {
                const weightRatio = (p2.weight - p1.weight === 0) ? 0 : (currentWeight - p1.weight) / (p2.weight - p1.weight);
                const fwdLimit = p1.fwd_in + weightRatio * (p2.fwd_in - p1.fwd_in);
                const aftLimit = p1.aft_in + weightRatio * (p2.aft_in - p1.aft_in);
                return { fwdLimit, aftLimit };
            }
        }
        if (currentWeight === sortedEnvelope[sortedEnvelope.length - 1].weight) {
            return {
                fwdLimit: sortedEnvelope[sortedEnvelope.length - 1].fwd_in,
                aftLimit: sortedEnvelope[sortedEnvelope.length - 1].aft_in
            };
        }
        return { fwdLimit: null, aftLimit: null };
    }

    function addStatusMessage(message, type, isSummary = false) {
        const p = document.createElement('p');
        p.textContent = message;
        p.classList.add(`status-${type}`);
        if (isSummary) {
            p.style.fontWeight = 'bold';
            p.style.fontSize = '1.1em';
        }
        statusMessagesDiv.appendChild(p);
    }

    function updateCgChart(airplane, calculatedWeight, calculatedMoment1000) {
        if (cgChart) {
            cgChart.destroy();
        }

        const normalEnvelopeData = airplane.limits.cgEnvelopeGraphNormal || [];
        const utilityEnvelopeData = airplane.limits.cgEnvelopeGraphUtility || [];
        
        const datasets = [];

        if (utilityEnvelopeData.length > 0) {
            datasets.push({
                label: 'Categoría Utilitaria',
                data: utilityEnvelopeData,
                borderColor: 'rgba(255, 159, 64, 1)',
                backgroundColor: 'rgba(255, 159, 64, 0.2)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                tension: 0
            });
        }
        if (normalEnvelopeData.length > 0) {
            datasets.push({
                label: 'Categoría Normal',
                data: normalEnvelopeData,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderWidth: 2,
                fill: true,
                pointRadius: 0,
                tension: 0
            });
        }
        
        datasets.push({
            label: 'Punto Calculado',
            data: [{ x: calculatedMoment1000, y: calculatedWeight }],
            borderColor: 'rgba(255, 0, 0, 1)',
            backgroundColor: 'rgba(255, 0, 0, 1)',
            pointRadius: 6,
            pointHoverRadius: 8,
            type: 'scatter'
        });

        cgChart = new Chart(cgEnvelopeChartCanvas, {
            type: 'line',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        title: { display: true, text: 'Momento Cargado / 1000 (pound-inches)' },
                        min: 40, max: 120  
                    },
                    y: {
                        title: { display: true, text: 'Peso de Aeronave Cargada (pounds)' },
                        min: 1400, max: 2400
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) label += ': ';
                                if (context.parsed.y !== null) label += `Peso ${context.parsed.y.toFixed(0)} lbs`;
                                if (context.parsed.x !== null) label += `, Mom/1000 ${context.parsed.x.toFixed(1)}`;
                                return label;
                            }
                        }
                    }
                }
            }
        });
    }


    airplaneSelect.addEventListener('change', (e) => {
        displayAirplaneInputs(e.target.value);
    });

    calculateBtn.addEventListener('click', calculateWeightAndBalance);

    populateAirplaneSelect();
});