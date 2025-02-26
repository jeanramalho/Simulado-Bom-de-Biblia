const API_KEY = 'xau_xvY8LTcrCJCDy1iciGptJV6gPu4Nv1P26';
const BASE_URL = 'https://jean-ramalho-s-workspace-3rn0k5.us-east-1.xata.sh/db/bom-de-biblia:main';

const QUESTIONS_QUERY_ENDPOINT = `${BASE_URL}/tables/questions/query`;
const QUESTION_DATA_ENDPOINT = `${BASE_URL}/tables/questions/data`;
const ANSWERS_QUERY_ENDPOINT = `${BASE_URL}/tables/answers/query`;

let currentQuestion = null;
let currentAnswers = [];

// Carrega a lista de questões
async function fetchQuestionsList() {
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            columns: ["xata_id", "created_by", "question"],
            page: { size: 15 }
        })
    };

    try {
        const response = await fetch(QUESTIONS_QUERY_ENDPOINT, options);
        const data = await response.json();
        console.log("Questões carregadas:", data);

        const records = data.records || []; // Verifica se há registros
        renderQuestionList(records);
    } catch (error) {
        console.error("Erro ao buscar questões:", error);
    }
}

// Renderiza a lista de questões na sidebar
function renderQuestionList(questions) {
    const listContainer = document.getElementById('question-list');
    listContainer.innerHTML = '';

    questions.forEach(q => {
        console.log("Questão recebida:", q); // Verificar a estrutura do objeto

        const item = document.createElement('div');
        item.classList.add('question-item');
        item.textContent = q.question.substring(0, 50) + (q.question.length > 50 ? '...' : '');
        
        // Certificar-se de que xata_id está correto
        if (!q.xata_id) {
            console.error("Erro: Questão sem xata_id:", q);
            return;
        }

        item.addEventListener('click', () => {
            console.log("Questão clicada, ID:", q.xata_id);
            loadQuestionDetail(q.xata_id);
        });

        listContainer.appendChild(item);
    });
}

// Carrega os detalhes de uma questão e suas alternativas
async function loadQuestionDetail(questionId) {
    if (!questionId) {
        console.error("Erro: questionId indefinido.");
        return;
    }

    try {
        // Buscar detalhes da questão
        const questionResponse = await fetch(`${QUESTION_DATA_ENDPOINT}/${questionId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!questionResponse.ok) {
            throw new Error(`Erro ao buscar questão: ${questionResponse.statusText}`);
        }
        
        const questionData = await questionResponse.json();
        currentQuestion = questionData;
        console.log("Detalhes da questão carregados:", currentQuestion);

        // Buscar as alternativas da questão
        const answersOptions = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                columns: ["xata_id", "answer", "is_correct"],
                filter: { question_id: questionId }, // Filtro correto
                page: { size: 10 }
            })
        };

        const answersResponse = await fetch(ANSWERS_QUERY_ENDPOINT, answersOptions);
        if (!answersResponse.ok) {
            throw new Error(`Erro ao buscar respostas: ${answersResponse.statusText}`);
        }
        
        const answersData = await answersResponse.json();
        console.log("Respostas carregadas:", answersData);

        currentAnswers = answersData.records || []; // Garante que seja um array

        renderQuestionDetail(currentQuestion, currentAnswers);
    } catch (error) {
        console.error("Erro ao carregar detalhes da questão:", error);
    }
}

// Renderiza a questão e suas alternativas na tela
function renderQuestionDetail(question, answers) {
    const detailContainer = document.getElementById('question-detail');
    detailContainer.innerHTML = '';

    const questionTextEl = document.createElement('div');
    questionTextEl.classList.add('question-text');
    questionTextEl.textContent = question.question;
    detailContainer.appendChild(questionTextEl);

    const alternativesList = document.createElement('ul');
    alternativesList.classList.add('alternatives');

    if (answers.length === 0) {
        const noAnswers = document.createElement('p');
        noAnswers.textContent = "Nenhuma alternativa cadastrada para esta questão.";
        detailContainer.appendChild(noAnswers);
    } else {
        answers.forEach(ans => {
            const li = document.createElement('li');
            li.classList.add('alternative');
            li.textContent = ans.answer;
            if (ans.is_correct) {
                li.classList.add('correct');
            }
            alternativesList.appendChild(li);
        });
    }

    detailContainer.appendChild(alternativesList);
}

// Inicializa a lista de questões
fetchQuestionsList();
