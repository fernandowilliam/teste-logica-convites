let currentQuestionIndex = 0;
let score = 0;
let timer;
let timeLeft = 60;
let selectedOption = null;

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

btnStart.addEventListener('click', startTest);
btnNext.addEventListener('click', nextQuestion);

function startTest() {
    homeScreen.classList.remove('active');
    testScreen.classList.add('active');
    totalDisplay.innerText = window.allQuestions.length;
    loadQuestion();
}

function loadQuestion() {
    clearTimeout(timer);
    selectedOption = null;
    btnNext.disabled = true;
    timeLeft = 60;
    timerDisplay.innerText = timeLeft + 's';
    
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
        div.addEventListener('click', () => selectOption(div, opt.letter));
        optionsContainer.appendChild(div);
    });
    
    startTimer();
}

function selectOption(optionElement, letter) {
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
}
