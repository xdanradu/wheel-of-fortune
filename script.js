const canvas = document.getElementById('wheel');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spin-btn');
const resultDiv = document.getElementById('result');
const nameInput = document.getElementById('name-input');
const addBtn = document.getElementById('add-btn');
const nameList = document.getElementById('name-list');
const arrowContainer = document.querySelector('.arrow-container');
const stats = document.querySelector('.stats');

let names = [
    "Alice", "Bob", "Charlie", "David",
    "Eve", "Frank", "Grace", "Heidi"
];

function updateStats() {
    stats.innerHTML = `${names.length} participants, ${Math.trunc((1 / names.length) * 100)}% chance to win`;
}
updateStats();

const colors = [
    "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0",
    "#9966FF", "#FF9F40", "#E7E9ED", "#76D7C4"
];

let startAngle = 0;
let arc = Math.PI / (names.length / 2);
let spinTimeout = null;

let spinAngleStart = 10;
let spinTime = 0;
let spinTimeTotal = 0;
let accelerationTime = 0;
let startTime = null;
let lastFrameTime = null;

let currentRotation = 0;
let hoveredNameIndex = -1;

function drawRouletteWheel() {
    if (canvas.getContext) {
        const outsideRadius = 200;
        const textRadius = 160;
        const insideRadius = 50;

        ctx.clearRect(0, 0, 500, 500);

        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;

        ctx.font = 'bold 26px Helvetica, Arial';

        for (let i = 0; i < names.length; i++) {
            const angle = startAngle + i * arc;

            // Draw segment
            ctx.fillStyle = colors[i % colors.length];
            ctx.beginPath();
            ctx.arc(250, 250, outsideRadius, angle, angle + arc, false);
            ctx.arc(250, 250, insideRadius, angle + arc, angle, true);
            ctx.stroke();
            ctx.fill();

            // Draw text
            ctx.save();
            ctx.shadowColor = "rgba(0,0,0,0.5)";
            ctx.shadowBlur = 4;
            ctx.fillStyle = "white";
            ctx.translate(250 + Math.cos(angle + arc / 2) * textRadius,
                250 + Math.sin(angle + arc / 2) * textRadius);
            ctx.rotate(angle + arc / 2 + Math.PI / 2);
            const text = names[i];
            ctx.fillText(text, -ctx.measureText(text).width / 2, 0);
            ctx.restore();

            // Draw X button
            if (i === hoveredNameIndex) {
                ctx.save();
                ctx.translate(250 + Math.cos(angle + arc / 2) * 185,
                    250 + Math.sin(angle + arc / 2) * 185);
                ctx.rotate(angle + arc / 2 + Math.PI / 2);

                ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
                ctx.beginPath();
                ctx.arc(0, 0, 10, 0, 2 * Math.PI);
                ctx.fill();

                ctx.strokeStyle = "#333";
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(-4, -4);
                ctx.lineTo(4, 4);
                ctx.moveTo(4, -4);
                ctx.lineTo(-4, 4);
                ctx.stroke();
                ctx.restore();
            }
        }

        // Draw Arrow (Static on canvas if needed, but we used CSS for the pointer)
        // But let's draw a center circle for aesthetics
        ctx.fillStyle = "white";
        ctx.beginPath();
        ctx.arc(250, 250, insideRadius - 5, 0, 2 * Math.PI);
        ctx.fill();

        // Center decoration
        ctx.fillStyle = "#333";
        ctx.beginPath();
        ctx.arc(250, 250, 10, 0, 2 * Math.PI);
        ctx.fill();
    }

    // Rotate arrow container in opposite direction
    if (arrowContainer) {
        arrowContainer.style.transform = `rotate(${-startAngle * 180 / Math.PI}deg)`;
    }
}


function rotateWheel(timestamp) {
    if (!startTime) startTime = timestamp;
    if (!lastFrameTime) lastFrameTime = timestamp;

    const deltaTime = timestamp - lastFrameTime;
    lastFrameTime = timestamp;

    spinTime = timestamp - startTime;

    if (spinTime >= spinTimeTotal) {
        stopRotateWheel();
        return;
    }

    let spinAngle;
    if (spinTime < accelerationTime) {
        spinAngle = easeIn(spinTime, 0, spinAngleStart, accelerationTime);
    } else {
        const decelerationTime = spinTime - accelerationTime;
        const decelerationTotal = spinTimeTotal - accelerationTime;
        spinAngle = spinAngleStart - easeOut(decelerationTime, 0, spinAngleStart, decelerationTotal);
    }

    // Normalize speed to time (assuming 15ms baseline)
    const frameScale = deltaTime / 15;
    startAngle += (spinAngle * frameScale * Math.PI / 180);
    drawRouletteWheel();
    spinTimeout = requestAnimationFrame(rotateWheel);
}

function stopRotateWheel() {
    cancelAnimationFrame(spinTimeout);

    // Calculate winner based on relative rotation
    // Wheel rotates by startAngle, Arrow rotates by -startAngle
    // Relative angle is 2 * startAngle
    const degrees = 2 * startAngle * 180 / Math.PI + 90;
    const arcd = arc * 180 / Math.PI;
    const index = Math.floor((360 - degrees % 360) % 360 / arcd);

    ctx.save();
    ctx.font = 'bold 30px Helvetica, Arial';
    const text = names[index];

    // Highlight the winner on the wheel? Maybe just show text below.
    resultDiv.textContent = `Winner: ${text}`;
    resultDiv.classList.add('show');
    resultDiv.classList.remove('hidden');

    spinBtn.disabled = false;
    ctx.restore();
}

function easeIn(t, b, c, d) {
    t /= d;
    return c * t * t * t + b;
}

function easeOut(t, b, c, d) {
    t /= d;
    t--;
    return c * (t * t * t * t * t + 1) + b;
}

function spin() {
    if (names.length === 0) {
        alert("Please add at least one name to the wheel!");
        return;
    }
    spinBtn.disabled = true;
    resultDiv.classList.remove('show');
    resultDiv.classList.add('hidden');

    spinAngleStart = Math.random() * 10 + 10; // 10 to 20 degrees per 15ms
    spinTime = 0;
    startTime = null;
    lastFrameTime = null;
    accelerationTime = 3000; // 3 seconds acceleration
    spinTimeTotal = 12000; // 15 seconds total
    requestAnimationFrame(rotateWheel);
}

function updateWheel() {
    arc = Math.PI / (names.length / 2);
    drawRouletteWheel();
}


function addName() {
    const name = nameInput.value.trim();
    if (name) {
        names.push(name);
        nameInput.value = '';
        updateWheel();
    }
    updateStats();
}

function removeName(index) {
    names.splice(index, 1);
    updateWheel();
    updateStats();
}


// Expose removeName to global scope for onclick
window.removeName = removeName;

spinBtn.addEventListener('click', spin);
addBtn.addEventListener('click', addName);
nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addName();
    }
});

// Canvas click handler for X buttons
canvas.addEventListener('click', (e) => {
    if (spinBtn.disabled) return; // Don't allow clicking while spinning

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = 250;
    const centerY = 250;
    const closeButtonRadius = 185;
    const buttonSize = 15; // Hit area radius

    for (let i = 0; i < names.length; i++) {
        const angle = startAngle + i * arc + arc / 2;
        const btnX = centerX + Math.cos(angle) * closeButtonRadius;
        const btnY = centerY + Math.sin(angle) * closeButtonRadius;

        const dist = Math.sqrt((x - btnX) ** 2 + (y - btnY) ** 2);
        if (dist < buttonSize) {
            removeName(i);
            return;
        }
    }
});

// Change cursor on hover over X buttons
canvas.addEventListener('mousemove', (e) => {
    if (spinBtn.disabled) {
        canvas.style.cursor = 'default';
        return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = 250;
    const centerY = 250;
    const closeButtonRadius = 185;
    const buttonSize = 15;

    let newHoveredIndex = -1;
    for (let i = 0; i < names.length; i++) {
        const angle = startAngle + i * arc + arc / 2;
        const btnX = centerX + Math.cos(angle) * closeButtonRadius;
        const btnY = centerY + Math.sin(angle) * closeButtonRadius;

        const dist = Math.sqrt((x - btnX) ** 2 + (y - btnY) ** 2);
        if (dist < buttonSize) {
            newHoveredIndex = i;
            break;
        }
    }

    canvas.style.cursor = newHoveredIndex !== -1 ? 'pointer' : 'default';

    if (newHoveredIndex !== hoveredNameIndex) {
        hoveredNameIndex = newHoveredIndex;
        drawRouletteWheel();
    }
});

canvas.addEventListener('mouseleave', () => {
    if (hoveredNameIndex !== -1) {
        hoveredNameIndex = -1;
        drawRouletteWheel();
    }
});

// Initial draw
updateWheel();
