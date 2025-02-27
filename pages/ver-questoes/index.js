const API_KEY = 'xau_xvY8LTcrCJCDy1iciGptJV6gPu4Nv1P26';
const BASE_URL = 'https://jean-ramalho-s-workspace-3rn0k5.us-east-1.xata.sh/db/bom-de-biblia:main';

const QUESTIONS_QUERY_ENDPOINT = `${BASE_URL}/tables/questions/query`;
const QUESTION_DATA_ENDPOINT = `${BASE_URL}/tables/questions/data`;
const ANSWERS_QUERY_ENDPOINT = `${BASE_URL}/tables/answers/query`;
const ANSWERS_DATA_ENDPOINT = `${BASE_URL}/tables/answers/data`; // Necessário para salvar edições

let currentQuestion = null;
let currentAnswers = [];

// Toggle do menu hamburguer
document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('active');
});

// Carrega a lista de questões
async function fetchQuestionsList() {
    const options = {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            columns: ["id", "created_by", "question"],
            page: { size: 15 }
        })
    };

    try {
        const response = await fetch(QUESTIONS_QUERY_ENDPOINT, options);
        const data = await response.json();
        console.log("Questões carregadas:", data);

        const records = data.records || [];
        renderQuestionList(records);
    } catch (error) {
        console.error("Erro ao buscar questões:", error);
    }
}

// Renderiza a lista de questões na sidebar com visual aprimorada
function renderQuestionList(questions) {
    const listContainer = document.getElementById('question-list');
    listContainer.innerHTML = '';

    questions.forEach(q => {
        if (!q.id) {
            console.error("Erro: Questão sem id:", q);
            return;
        }
        const item = document.createElement('div');
        item.className = 'bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600 transition-colors';
        item.textContent = q.question.substring(0, 50) + (q.question.length > 50 ? '...' : '');
        
        item.addEventListener('click', () => {
            loadQuestionDetail(q.id);
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
                columns: ["id", "answer", "is_correct"],
                filter: { question_id: questionId },
                page: { size: 10 }
            })
        };

        const answersResponse = await fetch(ANSWERS_QUERY_ENDPOINT, answersOptions);
        if (!answersResponse.ok) {
            throw new Error(`Erro ao buscar respostas: ${answersResponse.statusText}`);
        }
        
        const answersData = await answersResponse.json();
        console.log("Respostas carregadas:", answersData);

        currentAnswers = answersData.records || [];

        renderQuestionDetail(currentQuestion, currentAnswers);
    } catch (error) {
        console.error("Erro ao carregar detalhes da questão:", error);
    }
}

// Renderiza a questão e suas alternativas com visual aprimorada
function renderQuestionDetail(question, answers) {
    const detailContainer = document.getElementById('question-detail');
    detailContainer.innerHTML = '';

    // Bloco de "criado por:" alinhado à direita
    const creatorDiv = document.createElement('div');
    creatorDiv.className = 'text-right mb-2';
    creatorDiv.innerHTML = `<span class="text-sm text-gray-400">criado por:</span><br><span class="font-medium">${question.created_by}</span>`;
    detailContainer.appendChild(creatorDiv);

    // Texto da questão
    const questionTextEl = document.createElement('div');
    questionTextEl.className = 'text-xl font-semibold mb-4';
    questionTextEl.textContent = question.question;
    detailContainer.appendChild(questionTextEl);

    // Lista de alternativas
    const alternativesList = document.createElement('ul');
    alternativesList.className = 'list-none p-0 space-y-2';
    if (answers.length === 0) {
        const noAnswers = document.createElement('p');
        noAnswers.textContent = "Nenhuma alternativa cadastrada para esta questão.";
        alternativesList.appendChild(noAnswers);
    } else {
        answers.forEach(ans => {
            const li = document.createElement('li');
            li.className = 'p-3 rounded';
            if (ans.is_correct) {
                li.classList.add('bg-purple-600', 'text-white');
            } else {
                li.classList.add('bg-gray-700');
            }
            li.textContent = ans.answer;
            alternativesList.appendChild(li);
        });
    }
    detailContainer.appendChild(alternativesList);

    // Botões de ação (deletar e editar) abaixo das alternativas
    const buttonsDiv = document.createElement('div');
    buttonsDiv.className = 'flex gap-3 mt-4';
    
    const deleteButton = document.createElement('button');
    deleteButton.className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded';
    deleteButton.textContent = 'Deletar';
    deleteButton.onclick = () => deleteQuestion(question.id);

    const editButton = document.createElement('button');
    editButton.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded';
    editButton.textContent = 'Editar';
    editButton.onclick = enterEditMode;

    buttonsDiv.appendChild(deleteButton);
    buttonsDiv.appendChild(editButton);
    detailContainer.appendChild(buttonsDiv);
}


// Inicializa a lista de questões
fetchQuestionsList();

function enterEditMode() {
    const detailContainer = document.getElementById('question-detail');
    detailContainer.innerHTML = `
        <textarea class="edit-question w-full p-3 bg-gray-700 text-white rounded mb-4" rows="4">${currentQuestion.question}</textarea>
        <div class="alternatives-edit space-y-3 mb-4"></div>
        <div class="flex gap-3">
            <button class="save bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">Salvar</button>
            <button class="cancel bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded">Cancelar</button>
        </div>
    `;

    const alternativesEdit = detailContainer.querySelector('.alternatives-edit');
    
    currentAnswers.forEach(answer => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'edit-answer flex items-center gap-3 p-3 bg-gray-700 rounded';
        answerDiv.dataset.answerId = answer.id;
        answerDiv.innerHTML = `
            <input type="text" value="${answer.answer}" class="flex-1 p-2 bg-gray-600 text-white rounded">
            <label class="flex items-center gap-1 text-white">
                <input type="checkbox" ${answer.is_correct ? 'checked' : ''} class="form-checkbox">
                Correta
            </label>
            <button class="delete-answer text-red-400 text-2xl">&times;</button>
        `;
        answerDiv.querySelector('.delete-answer').onclick = () => answerDiv.remove();
        alternativesEdit.appendChild(answerDiv);
    });

    detailContainer.querySelector('.save').onclick = saveEdits;
    detailContainer.querySelector('.cancel').onclick = () => 
        renderQuestionDetail(currentQuestion, currentAnswers);
}

async function saveEdits() {
    try {
        // Atualizar questão
        await fetch(`${QUESTION_DATA_ENDPOINT}/${currentQuestion.id}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: document.querySelector('.edit-question').value
            })
        });

        // Atualizar respostas
        const answers = Array.from(document.querySelectorAll('.edit-answer')).map(div => ({
            id: div.dataset.answerId,
            answer: div.querySelector('input[type="text"]').value,
            is_correct: div.querySelector('input[type="checkbox"]').checked
        }));

        for (const answer of answers) {
            await fetch(`${ANSWERS_DATA_ENDPOINT}/${answer.id}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    answer: answer.answer,
                    is_correct: answer.is_correct
                })
            });
        }

        loadQuestionDetail(currentQuestion.id);
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}

async function deleteQuestion(questionId) {
    if (confirm('Tem certeza que deseja excluir esta questão?')) {
        try {
            const response = await fetch(`${QUESTION_DATA_ENDPOINT}/${questionId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                fetchQuestionsList();
                document.getElementById('question-detail').innerHTML = '<p>Selecione uma questão na lista para ver os detalhes.</p>';
            }
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    }
}
