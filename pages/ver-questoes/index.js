// Chave da API e URL base do banco de dados Xata
const API_KEY = 'xau_xvY8LTcrCJCDy1iciGptJV6gPu4Nv1P26';
const BASE_URL = 'https://jean-ramalho-s-workspace-3rn0k5.us-east-1.xata.sh/db/bom-de-biblia:main';

// Endpoints para consulta e manipulação de questões e respostas
const QUESTIONS_QUERY_ENDPOINT = `${BASE_URL}/tables/questions/query`;
const QUESTION_DATA_ENDPOINT = `${BASE_URL}/tables/questions/data`;
const ANSWERS_QUERY_ENDPOINT = `${BASE_URL}/tables/answers/query`;
const ANSWERS_DATA_ENDPOINT = `${BASE_URL}/tables/answers/data`; // Usado para salvar edições

// Variáveis para armazenar a questão e as alternativas atualmente selecionadas
let currentQuestion = null;
let currentAnswers = [];

// Variável para controlar se o dropdown mobile está aberto
let mobileDropdownOpen = false;

// --- Eventos e Funções do Dropdown Mobile ---

// Alterna a exibição do dropdown mobile quando o botão é clicado
document.getElementById('mobile-dropdown-btn').addEventListener('click', () => {
  const mobileList = document.getElementById('mobile-question-list');
  mobileDropdownOpen = !mobileDropdownOpen;
  mobileList.classList.toggle('hidden');
});

// --- Funções Auxiliares para Renderização da Lista de Questões ---

// Cria um item (div) representando uma questão para ambas as versões
function createQuestionItem(q) {
  const item = document.createElement('div');
  item.className = 'bg-gray-700 p-3 rounded cursor-pointer hover:bg-gray-600 transition-colors';
  // Exibe os primeiros 50 caracteres da questão
  item.textContent = q.question.substring(0, 50) + (q.question.length > 50 ? '...' : '');
  item.addEventListener('click', () => {
    loadQuestionDetail(q.id);
    // Se estiver em mobile, fecha o dropdown após selecionar
    if (window.innerWidth < 768) {
      document.getElementById('mobile-question-list').classList.add('hidden');
      mobileDropdownOpen = false;
    }
  });
  return item;
}

// Renderiza a lista de questões nas duas versões: desktop e mobile
function renderQuestionList(questions) {
  const desktopList = document.getElementById('question-list');
  const mobileList = document.getElementById('mobile-question-list');
  
  // Limpa os containers para evitar duplicação
  desktopList.innerHTML = '';
  mobileList.innerHTML = '';

  questions.forEach(q => {
    if (!q.id) {
      console.error("Erro: Questão sem id:", q);
      return;
    }
    
    // Cria e adiciona o item para desktop
    const desktopItem = createQuestionItem(q);
    desktopList.appendChild(desktopItem);

    // Cria e adiciona o item para mobile
    const mobileItem = createQuestionItem(q);
    mobileList.appendChild(mobileItem);
  });
}

// --- Toggle do Menu Hamburguer (Sidebar Desktop) ---
document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('active');
});

// --- Função para Buscar a Lista de Questões do Banco de Dados ---
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

// --- Função para Carregar os Detalhes de uma Questão e Suas Alternativas ---
async function loadQuestionDetail(questionId) {
  if (!questionId) {
    console.error("Erro: questionId indefinido.");
    return;
  }

  try {
    // Busca os detalhes da questão
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

    // Busca as alternativas da questão
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

    // Renderiza os detalhes da questão e alternativas
    renderQuestionDetail(currentQuestion, currentAnswers);
  } catch (error) {
    console.error("Erro ao carregar detalhes da questão:", error);
  }
}

// --- Função para Renderizar os Detalhes da Questão e Suas Alternativas ---
function renderQuestionDetail(question, answers) {
  const detailContainer = document.getElementById('question-detail');
  detailContainer.innerHTML = '';

  // Exibe o "criado por" alinhado à direita
  const creatorDiv = document.createElement('div');
  creatorDiv.className = 'text-right mb-2';
  creatorDiv.innerHTML = `<span class="text-sm text-gray-400">criado por:</span><br><span class="font-medium">${question.created_by}</span>`;
  detailContainer.appendChild(creatorDiv);

  // Exibe o texto da questão
  const questionTextEl = document.createElement('div');
  questionTextEl.className = 'text-xl font-semibold mb-4';
  questionTextEl.textContent = question.question;
  detailContainer.appendChild(questionTextEl);

  // Exibe as alternativas da questão
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

  // Cria os botões de ação: Deletar e Editar
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

// --- Função para Entrar no Modo de Edição da Questão ---
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

// --- Função para Salvar as Edições da Questão e Alternativas ---
async function saveEdits() {
  console.log("saveEdits chamado");
  try {
    // Obtém o texto atualizado da questão
    const updatedQuestionText = document.querySelector('.edit-question').value;
    console.log("Texto da questão atualizado:", updatedQuestionText);
    
    // Atualiza a questão via PATCH
    const questionResponse = await fetch(`${QUESTION_DATA_ENDPOINT}/${currentQuestion.id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: updatedQuestionText })
    });
    if (!questionResponse.ok) {
      const errorText = await questionResponse.text();
      throw new Error(`Erro ao atualizar questão: ${errorText}`);
    }
    console.log("Questão atualizada com sucesso");
    
    // Atualiza cada uma das alternativas
    const answers = Array.from(document.querySelectorAll('.edit-answer')).map(div => ({
      id: div.dataset.answerId,
      answer: div.querySelector('input[type="text"]').value,
      is_correct: div.querySelector('input[type="checkbox"]').checked
    }));
    console.log("Respostas para atualizar:", answers);
    
    for (const answer of answers) {
      const answerResponse = await fetch(`${ANSWERS_DATA_ENDPOINT}/${answer.id}`, {
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
      if (!answerResponse.ok) {
        const errorText = await answerResponse.text();
        throw new Error(`Erro ao atualizar resposta ${answer.id}: ${errorText}`);
      }
      console.log(`Resposta ${answer.id} atualizada`);
    }
    
    // Recarrega os detalhes da questão atualizada
    loadQuestionDetail(currentQuestion.id);
  } catch (error) {
    console.error('Erro ao salvar:', error);
  }
}

// --- Função para Deletar uma Questão e Suas Respostas Associadas ---
async function deleteQuestion(questionId) {
  console.log('deleteQuestion called with id:', questionId);
  if (confirm('Tem certeza que deseja excluir esta questão?')) {
    try {
      // Primeiro: buscar as respostas associadas à questão
      const answersOptions = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          columns: ["id"],
          filter: { question_id: questionId },
          page: { size: 50 }
        })
      };

      const answersResponse = await fetch(ANSWERS_QUERY_ENDPOINT, answersOptions);
      if (!answersResponse.ok) {
        throw new Error(`Erro ao buscar respostas: ${answersResponse.statusText}`);
      }
      const answersData = await answersResponse.json();
      const answersRecords = answersData.records || [];
      
      // Segundo: excluir cada resposta associada
      for (const answer of answersRecords) {
        const deleteAnswerResponse = await fetch(`${ANSWERS_DATA_ENDPOINT}/${answer.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${API_KEY}`
          }
        });
        if (!deleteAnswerResponse.ok) {
          const errorText = await deleteAnswerResponse.text();
          throw new Error(`Erro ao deletar resposta ${answer.id}: ${errorText}`);
        }
      }
      
      // Terceiro: excluir a questão
      const deleteQuestionResponse = await fetch(`${QUESTION_DATA_ENDPOINT}/${questionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_KEY}`
        }
      });
      if (!deleteQuestionResponse.ok) {
        const errorText = await deleteQuestionResponse.text();
        throw new Error(`Erro ao deletar questão: ${deleteQuestionResponse.statusText}: ${errorText}`);
      }
      
      // Atualiza a lista de questões e limpa o quadro de detalhes
      fetchQuestionsList();
      document.getElementById('question-detail').innerHTML = '<p>Selecione uma questão na lista para ver os detalhes.</p>';
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  }
}

// Inicializa a lista de questões ao carregar a página
fetchQuestionsList();
