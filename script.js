let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 60;
let selectedOption = null;
let timeSpentPerQuestion = [];
let testStartTime = null;
let questionStartTime = null;

const homeScreen = document.getElementById('home-screen');
const testScreen = document.getElementById('test-screen');
const resultScreen = document.getElementById('result-screen');
const btnStart = document.getElementById('btn-start');
const btnNext = document.getElementById('btn-next');
const questionCounter = document.getElementById('question-counter');
const timerDisplay = document.getElementById('timer');
const questionText = document.getElementById('question-text');
const optionsContainer = document.getElementById('options-container');
const scoreDisplay = document.getElementById('score');
const totalDisplay = document.getElementById('total');

let userName = "";

// --- ANTI-CHEAT TELEMETRY ---
let acTelemetry = {
    mouseMoves: [],
    blurCount: 0,
    blurTotalTime: 0,
    honeypotTriggered: false,
    untrustedEvents: 0,
    webdriver: navigator.webdriver || false,
    viewportAnomaly: (window.outerWidth && (window.innerWidth > window.outerWidth))
};
let lastBlurTimestamp = 0;

window.addEventListener('blur', () => {
    acTelemetry.blurCount++;
    lastBlurTimestamp = Date.now();
});

window.addEventListener('focus', () => {
    if (lastBlurTimestamp > 0) {
        acTelemetry.blurTotalTime += (Date.now() - lastBlurTimestamp);
        lastBlurTimestamp = 0;
    }
});

document.addEventListener('mousemove', (e) => {
    // Sub-sample mouse moves to avoid memory overflow (1 in 10)
    if (Math.random() < 0.1) {
        acTelemetry.mouseMoves.push({ x: e.clientX, y: e.clientY, t: Date.now() });
    }
});

document.addEventListener('DOMContentLoaded', () => {
    const hpBtn = document.getElementById('honeypot-btn');
    if (hpBtn) {
        hpBtn.addEventListener('click', () => {
            acTelemetry.honeypotTriggered = true;
        });
    }
});
// ----------------------------

const userNameInput = document.getElementById('user-name');
userNameInput.addEventListener('input', (e) => {
    btnStart.disabled = e.target.value.trim().length === 0;
});

btnStart.addEventListener('click', (e) => {
    if (!e.isTrusted) acTelemetry.untrustedEvents++;
    startTest();
});
btnNext.addEventListener('click', (e) => {
    if (!e.isTrusted) acTelemetry.untrustedEvents++;
    nextQuestion();
});

function startTest() {
    userName = userNameInput.value.trim();
    homeScreen.classList.remove('active');
    testScreen.classList.add('active');
    totalDisplay.innerText = window.allQuestions.length;
    testStartTime = new Date();
    loadQuestion();
}

function loadQuestion() {
    clearTimeout(timer);
    selectedOption = null;
    btnNext.disabled = true;
    timeLeft = 60;
    timerDisplay.innerText = timeLeft + 's';
    questionStartTime = new Date();
    
    if (currentQuestionIndex >= window.allQuestions.length) {
        showResult();
        return;
    }
    
    const currentQ = window.allQuestions[currentQuestionIndex];
    questionCounter.innerText = `Questão ${currentQuestionIndex + 1} / ${window.allQuestions.length}`;
    
    // Some texts have newlines that we want to keep
    questionText.innerText = currentQ.question.trim();
    
    optionsContainer.innerHTML = '';
    
    currentQ.options.forEach((opt, index) => {
        const div = document.createElement('div');
        div.className = 'option';
        div.innerHTML = `<strong>(${opt.letter})</strong>&nbsp;&nbsp;<span>${opt.text}</span>`;
        div.addEventListener('click', (e) => selectOption(e, div, opt.letter));
        optionsContainer.appendChild(div);
    });
    
    startTimer();
}

function selectOption(e, optionElement, letter) {
    if (e && !e.isTrusted) {
        acTelemetry.untrustedEvents++;
    }

    const allOptions = document.querySelectorAll('.option');
    allOptions.forEach(opt => opt.classList.remove('selected'));
    
    optionElement.classList.add('selected');
    selectedOption = letter;
    btnNext.disabled = false;
}

function startTimer() {
    timer = setInterval(() => {
        timeLeft--;
        timerDisplay.innerText = timeLeft + 's';
        
        if (timeLeft <= 0) {
            clearInterval(timer);
            // Time is up, move to next automatically
            nextQuestion();
        }
    }, 1000);
}

function nextQuestion() {
    clearInterval(timer);
    const currentQ = window.allQuestions[currentQuestionIndex];
    
    // Calculate time spent
    const now = new Date();
    const timeSpent = Math.floor((now - questionStartTime) / 1000);
    timeSpentPerQuestion.push({
        questionNumber: currentQuestionIndex + 1,
        timeSpent: timeSpent > 60 ? 60 : timeSpent // cap at 60s
    });
    
    if (selectedOption === currentQ.correct) {
        score++;
    }
    
    currentQuestionIndex++;
    loadQuestion();
}

function showResult() {
    testScreen.classList.remove('active');
    resultScreen.classList.add('active');
    scoreDisplay.innerText = score;
    
    const now = new Date();
    const totalTimeSeconds = Math.floor((now - testStartTime) / 1000);
    const minutes = Math.floor(totalTimeSeconds / 60);
    const seconds = totalTimeSeconds % 60;
    
    document.getElementById('total-time').innerText = `${minutes}m ${seconds}s`;
    
    const timeList = document.getElementById('time-list');
    timeList.innerHTML = '';
    
    timeSpentPerQuestion.forEach(q => {
        const li = document.createElement('li');
        li.innerText = `Questão ${q.questionNumber}: ${q.timeSpent}s`;
        timeList.appendChild(li);
    });
    
    // Calculate Bot Probability
    let botScore = 0;
    
    // 1. Honeypot check (instant flag)
    if (acTelemetry.honeypotTriggered) botScore += 50;
    
    // 2. Untrusted events
    if (acTelemetry.untrustedEvents > 0) botScore += 40;
    
    // 3. Webdriver presence
    if (acTelemetry.webdriver) botScore += 50;
    
    // 4. Time heuristics (faster than humanly possible reading)
    const tooFastAnswers = timeSpentPerQuestion.filter(q => q.timeSpent < 2).length;
    if (tooFastAnswers > 5) botScore += 30; // More than 5 questions answered in <2s
    
    // 5. Blur anomalies (lost focus a lot)
    if (acTelemetry.blurCount > 10 || acTelemetry.blurTotalTime > 60000) botScore += 20;
    
    // 6. Viewport Anomaly
    if (acTelemetry.viewportAnomaly) botScore += 15;
    
    // 7. Mouse movement heuristcs (Robots usually have 0 mouse moves or linear)
    if (acTelemetry.mouseMoves.length === 0 && !('ontouchstart' in window)) {
        // No mouse movement on a non-touch device is very suspicious for a 60-question test
        botScore += 25;
    }
    
    const finalBotProbability = Math.min(100, botScore);

    // Ranking Logic
    const rankingKey = 'logicTestRanking';
    let rankings = JSON.parse(localStorage.getItem(rankingKey) || '[]');
    rankings.push({
        name: userName,
        score: score,
        time: `${minutes}m ${seconds}s`,
        botProb: finalBotProbability
    });
    // Sort by score descending, then by bot probability ascending
    rankings.sort((a, b) => {
        if (b.score === a.score) {
            return (a.botProb || 0) - (b.botProb || 0); // lower bot prob is better
        }
        return b.score - a.score;
    });
    localStorage.setItem(rankingKey, JSON.stringify(rankings));
    
    const rankingList = document.getElementById('ranking-list');
    rankingList.innerHTML = '';
    rankings.forEach(r => {
        const li = document.createElement('li');
        const prob = r.botProb !== undefined ? r.botProb : 0;
        
        let botLabel = '';
        if (prob >= 70) botLabel = ' <span style="color:red; font-weight:bold;">[🤖 BOT DETECTADO]</span>';
        else if (prob > 30) botLabel = ' <span style="color:orange;">[⚠️ Suspeito]</span>';
        else botLabel = ' <span style="color:green;">[✅ Humano]</span>';
        
        li.innerHTML = `<strong>${r.name}</strong> - ${r.score} acertos (${r.time}) | Prob. Bot: ${prob}% ${botLabel}`;
        rankingList.appendChild(li);
    });
}
