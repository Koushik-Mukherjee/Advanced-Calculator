document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded. Initializing calculator app.');

    const themeToggleCheckbox = document.getElementById('theme-toggle-checkbox');
    const body = document.body;
    const navLinks = document.querySelectorAll('.nav-link');
    const calculatorSections = document.querySelectorAll('.calculator-section');
    const currentPageTitle = document.getElementById('current-page-title');
    const historyList = document.getElementById('history-list');
    const clearHistoryBtn = document.getElementById('clear-history');

    // --- History Management ---
    let calculationHistory = JSON.parse(localStorage.getItem('calculationHistory')) || [];

    function renderHistory() {
        historyList.innerHTML = ''; // Clear the list first
        if (calculationHistory.length === 0) {
            historyList.innerHTML = '<li class="history-item">No history yet.</li>';
            return;
        }
        // Render in reverse chronological order
        [...calculationHistory].reverse().forEach((item, index) => {
            // Use the original index from the main array for deletion
            const originalIndex = calculationHistory.length - 1 - index;
            const li = document.createElement('li');
            li.classList.add('history-item');
            li.innerHTML = `
                <span>${item}</span>
                <button class="delete-btn" data-index="${originalIndex}"><i class="fas fa-trash-alt"></i></button>
            `;
            historyList.appendChild(li);
        });
    }

    function addHistory(calculation) {
        if (calculationHistory.length >= 20) {
            calculationHistory.shift(); // Keep history size manageable, remove oldest
        }
        calculationHistory.push(calculation);
        localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
        // Only render if the user is on the history page to avoid unnecessary DOM manipulation
        if (document.getElementById('history-section').classList.contains('active')) {
            renderHistory();
        }
    }

    function clearHistory() {
        if (confirm('Are you sure you want to clear all history?')) {
            calculationHistory = [];
            localStorage.removeItem('calculationHistory');
            renderHistory();
        }
    }

    function deleteHistoryItem(index) {
        calculationHistory.splice(index, 1);
        localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
        renderHistory();
    }

    clearHistoryBtn.addEventListener('click', clearHistory);
    historyList.addEventListener('click', (e) => {
        if (e.target.closest('.delete-btn')) {
            const index = e.target.closest('.delete-btn').dataset.index;
            deleteHistoryItem(index);
        }
    });

    // --- Theme Toggling ---
    const currentTheme = localStorage.getItem('theme');
    if (currentTheme === 'dark') {
        body.classList.add('dark-mode');
        themeToggleCheckbox.checked = true;
    }

    themeToggleCheckbox.addEventListener('change', () => {
        if (themeToggleCheckbox.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // --- Navigation and Section Switching ---
    function showSection(sectionId) {
        calculatorSections.forEach(section => {
            section.classList.remove('active');
        });
        const activeSection = document.getElementById(sectionId);
        if (activeSection) {
            activeSection.classList.add('active');
        }
        const navLinkText = document.querySelector(`.nav-link[data-section="${sectionId}"]`).textContent;
        currentPageTitle.textContent = navLinkText;

        if (sectionId === 'history-section') {
            renderHistory();
        }
    }

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            navLinks.forEach(nav => nav.classList.remove('active'));
            link.classList.add('active');
            const sectionId = link.dataset.section;
            showSection(sectionId);
        });
    });

    showSection('normal-calculator');

    // --- Normal Calculator Logic ---
    const normalDisplay = document.getElementById('normal-display');
    let normalCurrentInput = '0';
    let normalPreviousInput = '';
    let normalOperator = null;
    let normalResetDisplay = false;

    function processNormalInput(value) {
        if (value === 'C') {
            normalCurrentInput = '0';
            normalPreviousInput = '';
            normalOperator = null;
            normalResetDisplay = false;
        } else if (value === 'backspace') {
            normalCurrentInput = normalCurrentInput.slice(0, -1);
            if (normalCurrentInput === '') normalCurrentInput = '0';
        } else if (['+', '-', '*', '/', '%'].includes(value)) {
            if (normalOperator && !normalResetDisplay) {
                normalCurrentInput = evaluateNormalExpression();
            }
            normalPreviousInput = normalCurrentInput;
            normalOperator = value;
            normalResetDisplay = true;
        } else if (value === '=') {
            if (normalOperator) {
                const expression = `${normalPreviousInput} ${normalOperator} ${normalCurrentInput}`;
                const result = evaluateNormalExpression();
                addHistory(`${expression} = ${result}`);
                normalCurrentInput = result;
                normalOperator = null;
                normalPreviousInput = '';
                normalResetDisplay = true;
            }
        } else {
            if (normalCurrentInput === '0' || normalResetDisplay) {
                normalCurrentInput = value;
                normalResetDisplay = false;
            } else {
                normalCurrentInput += value;
            }
        }
        normalDisplay.textContent = normalCurrentInput;
    }

    document.getElementById('normal-calculator').addEventListener('click', (e) => {
        const target = e.target;
        if (!target.classList.contains('calculator-button')) return;
        processNormalInput(target.dataset.value);
    });

    function evaluateNormalExpression() {
        let result;
        const prev = parseFloat(normalPreviousInput);
        const current = parseFloat(normalCurrentInput);

        if (isNaN(prev) || isNaN(current)) return 'Error';

        switch (normalOperator) {
            case '+': result = prev + current; break;
            case '-': result = prev - current; break;
            case '*': result = prev * current; break;
            case '/': 
                if (current === 0) return 'Error: Div by zero';
                result = prev / current; 
                break;
            case '%': result = prev % current; break;
            default: return normalCurrentInput;
        }
        return result.toString();
    }

    // --- Scientific Calculator Logic ---
    const scientificDisplay = document.getElementById('scientific-display');
    let scientificExpression = '0';
    let scientificResetDisplay = false;

    function processScientificInput(value) {
        if (value === 'C') {
            scientificExpression = '0';
            scientificResetDisplay = false;
        } else if (value === 'backspace') {
            scientificExpression = scientificExpression.slice(0, -1);
            if (scientificExpression === '') scientificExpression = '0';
        } else if (value === '=') {
            try {
                let expr = scientificExpression.replace(/π/g, 'Math.PI')
                                              .replace(/sin/g, 'Math.sin')
                                              .replace(/cos/g, 'Math.cos')
                                              .replace(/tan/g, 'Math.tan')
                                              .replace(/sqrt/g, 'Math.sqrt')
                                              .replace(/log/g, 'Math.log10') 
                                              .replace(/ln/g, 'Math.log')   
                                              .replace(/\^/g, '**');

                expr = expr.replace(/(\d)([a-zA-Z(])/g, '$1*$2');
                expr = expr.replace(/(\))(\d)/g, '$1*$2');
                expr = expr.replace(/(\))([a-zA-Z])/g, '$1*$2');
                
                const result = eval(expr);
                addHistory(`${scientificExpression} = ${result}`);
                scientificExpression = result.toString();
            } catch (error) {
                scientificExpression = 'Error';
            }
            scientificResetDisplay = true;
        } else if (['sin', 'cos', 'tan', 'sqrt', 'log', 'ln'].includes(value)) {
            if (scientificExpression === '0' || scientificResetDisplay) {
                scientificExpression = value + '(';
                scientificResetDisplay = false;
            } else {
                scientificExpression += value + '(';
            }
        } else if (value === 'pi') {
            if (scientificExpression === '0' || scientificResetDisplay) {
                scientificExpression = 'π';
                scientificResetDisplay = false;
            } else {
                scientificExpression += 'π';
            }
        } else {
            if (scientificExpression === '0' || scientificResetDisplay) {
                scientificExpression = value;
                scientificResetDisplay = false;
            } else {
                scientificExpression += value;
            }
        }
        scientificDisplay.textContent = scientificExpression;
    }

    document.getElementById('scientific-calculator').addEventListener('click', (e) => {
        const target = e.target;
        if (!target.classList.contains('calculator-button')) return;
        processScientificInput(target.dataset.value);
    });

    // --- Global Keyboard Input Handler ---
    document.addEventListener('keydown', (e) => {
        const activeSection = document.querySelector('.calculator-section.active');
        if (!activeSection) return;

        const key = e.key;
        let processedKey = null;

        if (activeSection.id === 'normal-calculator') {
            if (/[0-9]/.test(key)) {
                processedKey = key;
            } else if (['+', '-', '*', '/'].includes(key)) {
                processedKey = key;
            } else if (key === '.') {
                processedKey = '.';
            } else if (key === 'Enter') {
                processedKey = '=';
                e.preventDefault();
            } else if (key === 'Backspace') {
                processedKey = 'backspace';
            } else if (key === 'Escape' || key === 'Delete') {
                processedKey = 'C';
            } else if (key === '%') {
                processedKey = '%';
            }

            if (processedKey) {
                processNormalInput(processedKey);
            }
        } else if (activeSection.id === 'scientific-calculator') {
            if (/[0-9]/.test(key)) {
                processedKey = key;
            } else if (['+', '-', '*', '/', '(', ')', '^'].includes(key)) {
                processedKey = key;
            } else if (key === '.') {
                processedKey = '.';
            } else if (key === 'Enter') {
                processedKey = '=';
                e.preventDefault();
            } else if (key === 'Backspace') {
                processedKey = 'backspace';
            } else if (key === 'Escape' || key === 'Delete') {
                processedKey = 'C';
            }

            if (processedKey) {
                processScientificInput(processedKey);
            }
        }
    });


    // --- Age Calculator Logic ---
    document.getElementById('calculate-age').addEventListener('click', () => {
        const dobInput = document.getElementById('dob');
        const dob = new Date(dobInput.value);
        const today = new Date();
        const ageResult = document.getElementById('age-result');

        if (isNaN(dob.getTime())) {
            ageResult.textContent = 'Please enter a valid date of birth.';
            return;
        }

        let ageYears = today.getFullYear() - dob.getFullYear();
        let ageMonths = today.getMonth() - dob.getMonth();
        let ageDays = today.getDate() - dob.getDate();

        if (ageDays < 0) {
            ageMonths--;
            ageDays += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
        }
        if (ageMonths < 0) {
            ageYears--;
            ageMonths += 12;
        }
        
        const resultText = `You are ${ageYears} years, ${ageMonths} months, and ${ageDays} days old.`;
        ageResult.textContent = resultText;
        addHistory(`Age: ${dobInput.value} -> ${resultText}`);
    });

    // --- Area Calculator Logic ---
    const areaShapeSelect = document.getElementById('area-shape');
    const areaInputsDiv = document.getElementById('area-inputs');
    const calculateAreaBtn = document.getElementById('calculate-area');
    const areaResultDiv = document.getElementById('area-result');

    function renderAreaInputs() {
        const shape = areaShapeSelect.value;
        areaInputsDiv.innerHTML = '';
        switch (shape) {
            case 'square':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="square-side">Side Length:</label><input type="number" id="square-side" placeholder="Enter side length" class="w-full"></div>`;
                break;
            case 'rectangle':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="rectangle-length">Length:</label><input type="number" id="rectangle-length" placeholder="Enter length" class="w-full"></div><div class="input-group"><label for="rectangle-width">Width:</label><input type="number" id="rectangle-width" placeholder="Enter width" class="w-full"></div>`;
                break;
            case 'circle':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="circle-radius">Radius:</label><input type="number" id="circle-radius" placeholder="Enter radius" class="w-full"></div>`;
                break;
            case 'triangle':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="triangle-base">Base:</label><input type="number" id="triangle-base" placeholder="Enter base" class="w-full"></div><div class="input-group"><label for="triangle-height">Height:</label><input type="number" id="triangle-height" placeholder="Enter height" class="w-full"></div>`;
                break;
            case 'trapezoid':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="trapezoid-base1">Base 1:</label><input type="number" id="trapezoid-base1" placeholder="Enter base 1" class="w-full"></div><div class="input-group"><label for="trapezoid-base2">Base 2:</label><input type="number" id="trapezoid-base2" placeholder="Enter base 2" class="w-full"></div><div class="input-group"><label for="trapezoid-height">Height:</label><input type="number" id="trapezoid-height" placeholder="Enter height" class="w-full"></div>`;
                break;
            case 'ellipse':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="ellipse-major-axis">Major Axis (a):</label><input type="number" id="ellipse-major-axis" placeholder="Enter major axis" class="w-full"></div><div class="input-group"><label for="ellipse-minor-axis">Minor Axis (b):</label><input type="number" id="ellipse-minor-axis" placeholder="Enter minor axis" class="w-full"></div>`;
                break;
            case 'rhombus':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="rhombus-diagonal1">Diagonal 1 (d1):</label><input type="number" id="rhombus-diagonal1" placeholder="Enter diagonal 1" class="w-full"></div><div class="input-group"><label for="rhombus-diagonal2">Diagonal 2 (d2):</label><input type="number" id="rhombus-diagonal2" placeholder="Enter diagonal 2" class="w-full"></div>`;
                break;
            case 'parallelogram':
                areaInputsDiv.innerHTML = `<div class="input-group"><label for="parallelogram-base">Base:</label><input type="number" id="parallelogram-base" placeholder="Enter base" class="w-full"></div><div class="input-group"><label for="parallelogram-height">Height:</label><input type="number" id="parallelogram-height" placeholder="Enter height" class="w-full"></div>`;
                break;
        }
    }

    areaShapeSelect.addEventListener('change', renderAreaInputs);
    renderAreaInputs(); // Initial render

    calculateAreaBtn.addEventListener('click', () => {
        const shape = areaShapeSelect.value;
        let result;
        let calculationStr;
        
        switch (shape) {
            case 'square':
                const side = parseFloat(document.getElementById('square-side').value);
                if (isNaN(side) || side < 0) { areaResultDiv.textContent = 'Please enter a valid positive side length.'; return; }
                result = side * side;
                calculationStr = `Area of square with side ${side} = ${result.toFixed(2)}`;
                break;
            case 'rectangle':
                const length = parseFloat(document.getElementById('rectangle-length').value);
                const width = parseFloat(document.getElementById('rectangle-width').value);
                if (isNaN(length) || isNaN(width) || length < 0 || width < 0) { areaResultDiv.textContent = 'Please enter valid positive length and width.'; return; }
                result = length * width;
                calculationStr = `Area of rectangle with length ${length} and width ${width} = ${result.toFixed(2)}`;
                break;
            case 'circle':
                const radius = parseFloat(document.getElementById('circle-radius').value);
                if (isNaN(radius) || radius < 0) { areaResultDiv.textContent = 'Please enter a valid positive radius.'; return; }
                result = Math.PI * radius * radius;
                calculationStr = `Area of circle with radius ${radius} = ${result.toFixed(2)}`;
                break;
            case 'triangle':
                const base = parseFloat(document.getElementById('triangle-base').value);
                const height = parseFloat(document.getElementById('triangle-height').value);
                if (isNaN(base) || isNaN(height) || base < 0 || height < 0) { areaResultDiv.textContent = 'Please enter valid positive base and height.'; return; }
                result = 0.5 * base * height;
                calculationStr = `Area of triangle with base ${base} and height ${height} = ${result.toFixed(2)}`;
                break;
            case 'trapezoid':
                const base1 = parseFloat(document.getElementById('trapezoid-base1').value);
                const base2 = parseFloat(document.getElementById('trapezoid-base2').value);
                const trapezoidHeight = parseFloat(document.getElementById('trapezoid-height').value);
                if (isNaN(base1) || isNaN(base2) || isNaN(trapezoidHeight) || base1 < 0 || base2 < 0 || trapezoidHeight < 0) { areaResultDiv.textContent = 'Please enter valid positive bases and height.'; return; }
                result = 0.5 * (base1 + base2) * trapezoidHeight;
                calculationStr = `Area of trapezoid with bases ${base1}, ${base2} and height ${trapezoidHeight} = ${result.toFixed(2)}`;
                break;
            case 'ellipse':
                const majorAxis = parseFloat(document.getElementById('ellipse-major-axis').value);
                const minorAxis = parseFloat(document.getElementById('ellipse-minor-axis').value);
                if (isNaN(majorAxis) || isNaN(minorAxis) || majorAxis < 0 || minorAxis < 0) { areaResultDiv.textContent = 'Please enter valid positive major and minor axes.'; return; }
                result = Math.PI * majorAxis * minorAxis;
                calculationStr = `Area of ellipse with axes ${majorAxis}, ${minorAxis} = ${result.toFixed(2)}`;
                break;
            case 'rhombus':
                const diagonal1 = parseFloat(document.getElementById('rhombus-diagonal1').value);
                const diagonal2 = parseFloat(document.getElementById('rhombus-diagonal2').value);
                if (isNaN(diagonal1) || isNaN(diagonal2) || diagonal1 < 0 || diagonal2 < 0) { areaResultDiv.textContent = 'Please enter valid positive diagonals.'; return; }
                result = 0.5 * diagonal1 * diagonal2;
                calculationStr = `Area of rhombus with diagonals ${diagonal1}, ${diagonal2} = ${result.toFixed(2)}`;
                break;
            case 'parallelogram':
                const parallelogramBase = parseFloat(document.getElementById('parallelogram-base').value);
                const parallelogramHeight = parseFloat(document.getElementById('parallelogram-height').value);
                if (isNaN(parallelogramBase) || isNaN(parallelogramHeight) || parallelogramBase < 0 || parallelogramHeight < 0) { areaResultDiv.textContent = 'Please enter valid positive base and height.'; return; }
                result = parallelogramBase * parallelogramHeight;
                calculationStr = `Area of parallelogram with base ${parallelogramBase} and height ${parallelogramHeight} = ${result.toFixed(2)}`;
                break;
        }
        areaResultDiv.textContent = `Area: ${result.toFixed(2)}`;
        addHistory(calculationStr);
    });

    // --- BMI Calculator Logic ---
    document.getElementById('calculate-bmi').addEventListener('click', () => {
        const weight = parseFloat(document.getElementById('weight').value);
        const heightCm = parseFloat(document.getElementById('height').value);
        const bmiResult = document.getElementById('bmi-result');

        if (isNaN(weight) || isNaN(heightCm) || weight <= 0 || heightCm <= 0) {
            bmiResult.textContent = 'Please enter valid positive weight and height.';
            return;
        }

        const heightM = heightCm / 100;
        const bmi = weight / (heightM * heightM);
        let category = '';

        if (bmi < 18.5) {
            category = 'Underweight';
        } else if (bmi >= 18.5 && bmi < 24.9) {
            category = 'Normal weight';
        } else if (bmi >= 25 && bmi < 29.9) {
            category = 'Overweight';
        } else {
            category = 'Obese';
        }

        const resultText = `BMI: ${bmi.toFixed(2)} (${category})`;
        bmiResult.textContent = resultText;
        addHistory(`BMI: Weight ${weight}kg, Height ${heightCm}cm -> ${resultText}`);
    });

    // --- Data Converter Logic ---
    document.getElementById('convert-data').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('data-value').value);
        const fromUnit = document.getElementById('data-from-unit').value;
        const toUnit = document.getElementById('data-to-unit').value;
        const dataResult = document.getElementById('data-result');

        if (isNaN(value)) {
            dataResult.textContent = 'Please enter a valid number.';
            return;
        }

        const units = {
            'bit': 1,
            'byte': 8,
            'kb': 1024 * 8,
            'mb': 1024 ** 2 * 8,
            'gb': 1024 ** 3 * 8,
            'tb': 1024 ** 4 * 8,
            'pb': 1024 ** 5 * 8,
            'eb': 1024 ** 6 * 8,
            'zb': 1024 ** 7 * 8,
            'yb': 1024 ** 8 * 8,
        };
        
        const valueInBits = value * units[fromUnit];
        const convertedValue = valueInBits / units[toUnit];
        
        const resultText = `${value} ${fromUnit.toUpperCase()} = ${convertedValue.toPrecision(6)} ${toUnit.toUpperCase()}`;
        dataResult.textContent = resultText;
        addHistory(`Data: ${resultText}`);
    });

    // --- Date Calculator Logic ---
    document.getElementById('calculate-date-diff').addEventListener('click', () => {
        const date1Input = document.getElementById('date1').value;
        const date2Input = document.getElementById('date2').value;
        const dateDiffResult = document.getElementById('date-diff-result');

        const d1 = new Date(date1Input);
        const d2 = new Date(date2Input);

        if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
            dateDiffResult.textContent = 'Please enter valid dates.';
            return;
        }

        const diffTime = Math.abs(d2.getTime() - d1.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        const resultText = `Difference: ${diffDays} days`;
        dateDiffResult.textContent = resultText;
        addHistory(`Date Diff: ${date1Input} to ${date2Input} -> ${resultText}`);
    });

    // --- Discount Calculator Logic ---
    document.getElementById('calculate-discount').addEventListener('click', () => {
        const originalPrice = parseFloat(document.getElementById('original-price').value);
        const discountPercentage = parseFloat(document.getElementById('discount-percentage').value);
        const discountResult = document.getElementById('discount-result');

        if (isNaN(originalPrice) || isNaN(discountPercentage) || originalPrice < 0 || discountPercentage < 0) {
            discountResult.textContent = 'Please enter valid positive numbers.';
            return;
        }

        const discountAmount = originalPrice * (discountPercentage / 100);
        const finalPrice = originalPrice - discountAmount;
        
        const resultText = `Discount: Rs.${discountAmount.toFixed(2)}, Final Price: Rs.${finalPrice.toFixed(2)}`;
        discountResult.textContent = resultText;
        addHistory(`Discount: ${originalPrice} @ ${discountPercentage}% -> ${resultText}`);
    });

    // --- Length Converter Logic ---
    document.getElementById('convert-length').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('length-value').value);
        const fromUnit = document.getElementById('length-from-unit').value;
        const toUnit = document.getElementById('length-to-unit').value;
        const lengthResult = document.getElementById('length-result');

        if (isNaN(value)) {
            lengthResult.textContent = 'Please enter a valid number.';
            return;
        }

        const units = {
            'nm': 1e-9, 'um': 1e-6, 'mm': 1e-3, 'cm': 1e-2, 'm': 1, 'km': 1e3,
            'inch': 0.0254, 'ft': 0.3048, 'yd': 0.9144, 'mile': 1609.34, 'naut_mile': 1852
        };

        const valueInMeters = value * units[fromUnit];
        const convertedValue = valueInMeters / units[toUnit];
        
        const resultText = `${value} ${fromUnit} = ${convertedValue.toPrecision(6)} ${toUnit}`;
        lengthResult.textContent = resultText;
        addHistory(`Length: ${resultText}`);
    });

    // --- Mass Converter Logic ---
    document.getElementById('convert-mass').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('mass-value').value);
        const fromUnit = document.getElementById('mass-from-unit').value;
        const toUnit = document.getElementById('mass-to-unit').value;
        const massResult = document.getElementById('mass-result');

        if (isNaN(value)) {
            massResult.textContent = 'Please enter a valid number.';
            return;
        }

        const units = {
            'mcg': 1e-6, 'mg': 1e-3, 'g': 1, 'kg': 1e3, 'tonne': 1e6,
            'oz': 28.3495, 'lb': 453.592, 'stone': 6350.29, 'ton_us': 907185, 'ton_uk': 1016047
        };

        const valueInGrams = value * units[fromUnit];
        const convertedValue = valueInGrams / units[toUnit];

        const resultText = `${value} ${fromUnit} = ${convertedValue.toPrecision(6)} ${toUnit}`;
        massResult.textContent = resultText;
        addHistory(`Mass: ${resultText}`);
    });

    // --- Numeral System Converter Logic ---
    document.getElementById('convert-numeral').addEventListener('click', () => {
        const valueStr = document.getElementById('numeral-value').value;
        const fromBase = parseInt(document.getElementById('numeral-from-base').value);
        const toBase = parseInt(document.getElementById('numeral-to-base').value);
        const numeralResult = document.getElementById('numeral-result');

        try {
            const decimalValue = parseInt(valueStr, fromBase);
            if (isNaN(decimalValue)) {
                numeralResult.textContent = 'Invalid input for the selected base.';
                return;
            }
            const convertedValue = decimalValue.toString(toBase).toUpperCase();
            const resultText = `${valueStr} (Base ${fromBase}) = ${convertedValue} (Base ${toBase})`;
            numeralResult.textContent = resultText;
            addHistory(`Numeral: ${resultText}`);
        } catch (error) {
            numeralResult.textContent = 'Error during conversion. Check input.';
        }
    });

    // --- Speed Converter Logic ---
    document.getElementById('convert-speed').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('speed-value').value);
        const fromUnit = document.getElementById('speed-from-unit').value;
        const toUnit = document.getElementById('speed-to-unit').value;
        const speedResult = document.getElementById('speed-result');

        if (isNaN(value)) {
            speedResult.textContent = 'Please enter a valid number.';
            return;
        }

        const units = {
            'mps': 1, 'kph': 1000 / 3600, 'mph': 1609.34 / 3600, 'fps': 0.3048,
            'knot': 0.514444, 'mach': 343, 'c': 299792458
        };

        const valueInMps = value * units[fromUnit];
        const convertedValue = valueInMps / units[toUnit];
        
        const resultText = `${value} ${fromUnit} = ${convertedValue.toPrecision(6)} ${toUnit}`;
        speedResult.textContent = resultText;
        addHistory(`Speed: ${resultText}`);
    });

    // --- Temperature Converter Logic ---
    document.getElementById('convert-temperature').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('temp-value').value);
        const fromUnit = document.getElementById('temp-from-unit').value;
        const toUnit = document.getElementById('temp-to-unit').value;
        const tempResult = document.getElementById('temperature-result');

        if (isNaN(value)) {
            tempResult.textContent = 'Please enter a valid number.';
            return;
        }

        let valueInCelsius;
        switch (fromUnit) {
            case 'celsius': valueInCelsius = value; break;
            case 'fahrenheit': valueInCelsius = (value - 32) * 5 / 9; break;
            case 'kelvin': valueInCelsius = value - 273.15; break;
            case 'rankine': valueInCelsius = (value - 491.67) * 5 / 9; break;
            case 'reaumur': valueInCelsius = value * 5 / 4; break;
            default: valueInCelsius = 0;
        }

        let convertedValue;
        switch (toUnit) {
            case 'celsius': convertedValue = valueInCelsius; break;
            case 'fahrenheit': convertedValue = (valueInCelsius * 9 / 5) + 32; break;
            case 'kelvin': convertedValue = valueInCelsius + 273.15; break;
            case 'rankine': convertedValue = (valueInCelsius + 273.15) * 9 / 5; break;
            case 'reaumur': convertedValue = valueInCelsius * 4 / 5; break;
            default: convertedValue = 0;
        }
        
        const resultText = `${value} ${fromUnit === 'celsius' ? '°C' : fromUnit === 'fahrenheit' ? '°F' : fromUnit === 'kelvin' ? 'K' : fromUnit === 'rankine' ? '°R' : '°Ré'} = ${convertedValue.toFixed(2)} ${toUnit === 'celsius' ? '°C' : toUnit === 'fahrenheit' ? '°F' : toUnit === 'kelvin' ? 'K' : toUnit === 'rankine' ? '°R' : '°Ré'}`;
        tempResult.textContent = resultText;
        addHistory(`Temp: ${resultText}`);
    });

    // --- Time Converter Logic ---
    document.getElementById('convert-time').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('time-value').value);
        const fromUnit = document.getElementById('time-from-unit').value;
        const toUnit = document.getElementById('time-to-unit').value;
        const timeResult = document.getElementById('time-result');

        if (isNaN(value)) {
            timeResult.textContent = 'Please enter a valid number.';
            return;
        }
        
        const units = {
            'nanoseconds': 1e-9, 'microseconds': 1e-6, 'milliseconds': 1e-3, 'seconds': 1,
            'minutes': 60, 'hours': 3600, 'days': 86400, 'weeks': 604800,
            'months': 2629743.83, 'years': 31556926, 'decades': 315569260, 'centuries': 3155692600
        };
        
        const valueInSeconds = value * units[fromUnit];
        const convertedValue = valueInSeconds / units[toUnit];
        
        const resultText = `${value} ${fromUnit} = ${convertedValue.toPrecision(6)} ${toUnit}`;
        timeResult.textContent = resultText;
        addHistory(`Time: ${resultText}`);
    });

    // --- Volume Converter Logic ---
    document.getElementById('convert-volume').addEventListener('click', () => {
        const value = parseFloat(document.getElementById('volume-value').value);
        const fromUnit = document.getElementById('volume-from-unit').value;
        const toUnit = document.getElementById('volume-to-unit').value;
        const volumeResult = document.getElementById('volume-result');

        if (isNaN(value)) {
            volumeResult.textContent = 'Please enter a valid number.';
            return;
        }
        
        const units = {
            'cm3': 1e-3, 'ml': 1e-3, 'l': 1, 'm3': 1e3, 'km3': 1e12,
            'in3': 0.0163871, 'ft3': 28.3168, 'yd3': 764.555,
            'gal_us_liq': 3.78541, 'gal_uk': 4.54609, 'qt_us_liq': 0.946353,
            'pt_us_liq': 0.473176, 'cup_us': 0.236588, 'fl_oz_us': 0.0295735,
            'barrel_us': 158.987
        };

        const valueInLiters = value * units[fromUnit];
        const convertedValue = valueInLiters / units[toUnit];

        const resultText = `${value} ${fromUnit} = ${convertedValue.toPrecision(6)} ${toUnit}`;
        volumeResult.textContent = resultText;
        addHistory(`Volume: ${resultText}`);
    });

    // --- GST Calculator Logic ---
    document.getElementById('add-gst').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('gst-amount').value);
        const rate = parseFloat(document.getElementById('gst-rate').value);
        const gstResult = document.getElementById('gst-result');

        if (isNaN(amount) || isNaN(rate) || amount < 0 || rate < 0) {
            gstResult.textContent = 'Please enter valid positive numbers.';
            return;
        }

        const gstAmount = amount * (rate / 100);
        const totalAmount = amount + gstAmount;
        const resultText = `GST Amount: Rs.${gstAmount.toFixed(2)}, Total with GST: Rs.${totalAmount.toFixed(2)}`;
        gstResult.textContent = resultText;
        addHistory(`GST (Add): ${amount} @ ${rate}% -> ${resultText}`);
    });

    document.getElementById('remove-gst').addEventListener('click', () => {
        const amount = parseFloat(document.getElementById('gst-amount').value);
        const rate = parseFloat(document.getElementById('gst-rate').value);
        const gstResult = document.getElementById('gst-result');

        if (isNaN(amount) || isNaN(rate) || amount < 0 || rate < 0) {
            gstResult.textContent = 'Please enter valid positive numbers.';
            return;
        }

        const originalAmount = amount / (1 + (rate / 100));
        const gstAmount = amount - originalAmount;
        const resultText = `Original Amount: Rs.${originalAmount.toFixed(2)}, GST Removed: Rs.${gstAmount.toFixed(2)}`;
        gstResult.textContent = resultText;
        addHistory(`GST (Remove): ${amount} @ ${rate}% -> ${resultText}`);
    });

    // --- Currency Converter Logic (Placeholder) ---
    document.getElementById('convert-currency').addEventListener('click', async () => {
        const amount = parseFloat(document.getElementById('currency-value').value);
        const fromCurrency = document.getElementById('currency-from').value;
        const toCurrency = document.getElementById('currency-to').value;
        const currencyResult = document.getElementById('currency-result');

        if (isNaN(amount) || amount <= 0) {
            currencyResult.textContent = 'Please enter a valid positive amount.';
            return;
        }

        currencyResult.textContent = 'Fetching real-time rates... (This is a placeholder)';

        const dummyRates = {
            'USD': { 'EUR': 0.92, 'GBP': 0.79, 'JPY': 158.00, 'CAD': 1.37, 'AUD': 1.51, 'INR': 83.50, 'USD': 1 },
            'EUR': { 'USD': 1.08, 'GBP': 0.86, 'JPY': 171.00, 'CAD': 1.49, 'AUD': 1.64, 'INR': 90.50, 'EUR': 1 },
            'GBP': { 'USD': 1.26, 'EUR': 1.16, 'JPY': 200.00, 'CAD': 1.75, 'AUD': 1.93, 'INR': 106.00, 'GBP': 1 },
            'JPY': { 'USD': 0.0063, 'EUR': 0.0058, 'GBP': 0.005, 'CAD': 0.0086, 'AUD': 0.0095, 'INR': 0.528, 'JPY': 1 },
            'CAD': { 'USD': 0.73, 'EUR': 0.67, 'GBP': 0.57, 'JPY': 116.00, 'AUD': 1.10, 'INR': 61.00, 'CAD': 1 },
            'AUD': { 'USD': 0.66, 'EUR': 0.61, 'GBP': 0.52, 'JPY': 105.00, 'CAD': 0.91, 'INR': 55.50, 'AUD': 1 },
            'INR': { 'USD': 0.012, 'EUR': 0.011, 'GBP': 0.0094, 'JPY': 1.90, 'CAD': 0.016, 'AUD': 0.018, 'INR': 1 }
        };


        if (dummyRates[fromCurrency] && dummyRates[fromCurrency][toCurrency]) {
            const rate = dummyRates[fromCurrency][toCurrency];
            const convertedAmount = amount * rate;
            const resultText = `${amount} ${fromCurrency} = ${convertedAmount.toFixed(2)} ${toCurrency}`;
            currencyResult.textContent = resultText;
            addHistory(`Currency: ${resultText}`);
        } else {
            currencyResult.textContent = 'Conversion not available for these currencies (dummy data).';
        }
    });

    // --- Investment Calculator Logic ---
    document.getElementById('calculate-investment').addEventListener('click', () => {
        const principal = parseFloat(document.getElementById('principal-amount').value);
        const annualRate = parseFloat(document.getElementById('annual-rate').value);
        const years = parseFloat(document.getElementById('investment-period').value);
        const compoundingFrequency = parseInt(document.getElementById('compounding-frequency').value);
        const investmentResult = document.getElementById('investment-result');

        if (isNaN(principal) || isNaN(annualRate) || isNaN(years) || principal < 0 || annualRate < 0 || years < 0) {
            investmentResult.textContent = 'Please enter valid positive numbers for all fields.';
            return;
        }

        const rate = annualRate / 100;
        const totalAmount = principal * Math.pow((1 + (rate / compoundingFrequency)), (compoundingFrequency * years));
        const interestEarned = totalAmount - principal;
        
        const resultText = `Future Value: Rs.${totalAmount.toFixed(2)}, Interest Earned: Rs.${interestEarned.toFixed(2)}`;
        investmentResult.textContent = resultText;
        addHistory(`Investment: Principal ${principal}, Rate ${annualRate}%, Years ${years} -> ${resultText}`);
    });

    // --- Loan Calculator Logic ---
    document.getElementById('calculate-loan').addEventListener('click', () => {
        const loanAmount = parseFloat(document.getElementById('loan-amount').value);
        const annualInterestRate = parseFloat(document.getElementById('loan-interest-rate').value);
        const loanTermMonths = parseFloat(document.getElementById('loan-term').value);
        const loanResult = document.getElementById('loan-result');

        if (isNaN(loanAmount) || isNaN(annualInterestRate) || isNaN(loanTermMonths) || loanAmount <= 0 || annualInterestRate < 0 || loanTermMonths <= 0) {
            loanResult.textContent = 'Please enter valid positive numbers for all fields.';
            return;
        }

        const monthlyInterestRate = (annualInterestRate / 100) / 12;

        let emi;
        if (monthlyInterestRate === 0) {
            emi = loanAmount / loanTermMonths;
        } else {
            emi = loanAmount * monthlyInterestRate * Math.pow((1 + monthlyInterestRate), loanTermMonths) / (Math.pow((1 + monthlyInterestRate), loanTermMonths) - 1);
        }

        const totalPayment = emi * loanTermMonths;
        const totalInterest = totalPayment - loanAmount;
        
        const resultText = `Monthly EMI: Rs.${emi.toFixed(2)}, Total Payment: Rs.${totalPayment.toFixed(2)}, Total Interest: Rs.${totalInterest.toFixed(2)}`;
        loanResult.textContent = resultText;
        addHistory(`Loan: Amount ${loanAmount}, Rate ${annualInterestRate}%, Term ${loanTermMonths} months -> ${resultText}`);
    });
});