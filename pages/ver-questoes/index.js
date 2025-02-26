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
            columns: ["id", "created_by", "question"], // Alterado xata_id para id
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

// Renderiza a lista de questões na sidebar
function renderQuestionList(questions) {
    const listContainer = document.getElementById('question-list');
    listContainer.innerHTML = '';

    questions.forEach(q => {
        console.log("Questão recebida:", q); // Verifica a estrutura do objeto

        const item = document.createElement('div');
        item.classList.add('question-item');
        item.textContent = q.question.substring(0, 50) + (q.question.length > 50 ? '...' : '');
        
        if (!q.id) { // Alterado de xata_id para id
            console.error("Erro: Questão sem id:", q);
            return;
        }

        item.addEventListener('click', () => {
            console.log("Questão clicada, ID:", q.id);
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
                filter: { question_id: questionId }, // Certificando que está filtrando corretamente
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

            // Botões de ação
            const buttonsDiv = document.createElement('div');
            buttonsDiv.className = 'buttons';
        
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete';
            deleteButton.textContent = 'Deletar';
            deleteButton.onclick = () => deleteQuestion(question.id);
        
            const editButton = document.createElement('button');
            editButton.className = 'edit';
            editButton.textContent = 'Editar';
            editButton.onclick = enterEditMode;
        
            buttonsDiv.appendChild(deleteButton);
            buttonsDiv.appendChild(editButton);
            detailContainer.appendChild(buttonsDiv);

    detailContainer.appendChild(alternativesList);
}







// Inicializa a lista de questões
fetchQuestionsList();

function enterEditMode() {
    const detailContainer = document.getElementById('question-detail');
    detailContainer.innerHTML = `
        <textarea class="edit-question">${currentQuestion.question}</textarea>
        <div class="alternatives-edit"></div>
        <div class="buttons">
            <button class="save">Salvar</button>
            <button class="cancel">Cancelar</button>
        </div>
    `;

    const alternativesEdit = detailContainer.querySelector('.alternatives-edit');
    
    currentAnswers.forEach(answer => {
        const answerDiv = document.createElement('div');
        answerDiv.className = 'edit-answer';
        answerDiv.innerHTML = `
            <input type="text" value="${answer.answer}">
            <label>
                <input type="checkbox" ${answer.is_correct ? 'checked' : ''}>
                Correta
            </label>
            <button class="delete-answer">×</button>
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