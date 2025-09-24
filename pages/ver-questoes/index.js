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

// Variáveis para paginação
let allQuestions = [];
let currentPage = 1;
const QUESTIONS_PER_PAGE = 20;
let totalPages = 1;

// --- Eventos do Modal ---

// Fecha o modal quando clicar no X ou fora dele
document.getElementById('close-modal').addEventListener('click', closeModal);
document.getElementById('question-modal').addEventListener('click', (e) => {
  if (e.target.id === 'question-modal') {
    closeModal();
  }
});

// Fecha o modal com ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeModal();
  }
});

// Atualiza a paginação quando a janela é redimensionada
window.addEventListener('resize', () => {
  if (allQuestions.length > 0) {
    renderPagination();
  }
});

// --- Funções para o Sistema de Cards e Paginação ---

// Cria um card para uma questão
function createQuestionCard(question) {
  const card = document.createElement('div');
  card.className = 'question-card bg-gray-700 p-4 rounded-lg border border-gray-600';
  
  // Trunca o texto da questão para caber no card
  const truncatedQuestion = question.question.length > 100 
    ? question.question.substring(0, 100) + '...' 
    : question.question;
  
  card.innerHTML = `
    <div class="mb-2">
      <span class="text-xs text-gray-400">Criado por:</span>
      <span class="text-sm text-purple-400 ml-1">${question.created_by}</span>
    </div>
    <p class="text-sm text-gray-200 mb-3">${truncatedQuestion}</p>
    <div class="text-xs text-gray-400 text-right">Clique para ver detalhes</div>
  `;
  
  card.addEventListener('click', () => {
    loadQuestionDetail(question.id);
  });
  
  return card;
}

// Renderiza os cards da página atual
function renderQuestionCards() {
  const grid = document.getElementById('questions-grid');
  grid.innerHTML = '';
  
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE;
  const endIndex = startIndex + QUESTIONS_PER_PAGE;
  const questionsToShow = allQuestions.slice(startIndex, endIndex);
  
  questionsToShow.forEach(question => {
    if (!question.id) {
      console.error("Erro: Questão sem id:", question);
      return;
    }
    
    const card = createQuestionCard(question);
    grid.appendChild(card);
  });
}

// Renderiza a paginação
function renderPagination() {
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';
  
  if (totalPages <= 1) return;
  
  // Botão anterior
  const prevBtn = document.createElement('button');
  prevBtn.textContent = '‹';
  prevBtn.className = `pagination-btn px-3 py-2 rounded ${currentPage === 1 ? 'disabled bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'}`;
  prevBtn.disabled = currentPage === 1;
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderQuestionCards();
      renderPagination();
      updateQuestionCount();
    }
  });
  pagination.appendChild(prevBtn);
  
  // Números das páginas (mostra menos páginas em mobile)
  const isMobile = window.innerWidth < 768;
  const maxPagesToShow = isMobile ? 3 : 5;
  const halfPages = Math.floor(maxPagesToShow / 2);
  const startPage = Math.max(1, currentPage - halfPages);
  const endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  
  for (let i = startPage; i <= endPage; i++) {
    const pageBtn = document.createElement('button');
    pageBtn.textContent = i;
    pageBtn.className = `pagination-btn px-3 py-2 rounded ${i === currentPage ? 'bg-purple-800' : 'bg-purple-600 hover:bg-purple-700'}`;
    pageBtn.addEventListener('click', () => {
      currentPage = i;
      renderQuestionCards();
      renderPagination();
      updateQuestionCount();
    });
    pagination.appendChild(pageBtn);
  }
  
  // Botão próximo
  const nextBtn = document.createElement('button');
  nextBtn.textContent = '›';
  nextBtn.className = `pagination-btn px-3 py-2 rounded ${currentPage === totalPages ? 'disabled bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'}`;
  nextBtn.disabled = currentPage === totalPages;
  nextBtn.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderQuestionCards();
      renderPagination();
      updateQuestionCount();
    }
  });
  pagination.appendChild(nextBtn);
}

// Atualiza o contador de questões
function updateQuestionCount() {
  const countElement = document.getElementById('question-count');
  const startIndex = (currentPage - 1) * QUESTIONS_PER_PAGE + 1;
  const endIndex = Math.min(currentPage * QUESTIONS_PER_PAGE, allQuestions.length);
  
  countElement.textContent = `Mostrando ${startIndex}-${endIndex} de ${allQuestions.length} questões`;
}

// Abre o modal com os detalhes da questão
function openModal() {
  document.getElementById('question-modal').classList.remove('hidden');
  document.body.style.overflow = 'hidden'; // Previne scroll do body
}

// Fecha o modal
function closeModal() {
  document.getElementById('question-modal').classList.add('hidden');
  document.body.style.overflow = 'auto'; // Restaura scroll do body
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
      page: { size: 1000 } // Busca todas as questões de uma vez
    })
  };

  try {
    const response = await fetch(QUESTIONS_QUERY_ENDPOINT, options);
    const data = await response.json();
    console.log("Questões carregadas:", data);
    allQuestions = data.records || [];
    
    // Calcula o número total de páginas
    totalPages = Math.ceil(allQuestions.length / QUESTIONS_PER_PAGE);
    
    // Renderiza os cards e a paginação
    renderQuestionCards();
    renderPagination();
    updateQuestionCount();
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

    // Renderiza os detalhes da questão e alternativas no modal
    renderQuestionDetailInModal(currentQuestion, currentAnswers);
    openModal();
  } catch (error) {
    console.error("Erro ao carregar detalhes da questão:", error);
  }
}

// --- Função para Renderizar os Detalhes da Questão no Modal ---
function renderQuestionDetailInModal(question, answers) {
  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = '';

  // Exibe o "criado por" alinhado à direita
  const creatorDiv = document.createElement('div');
  creatorDiv.className = 'text-right mb-4';
  creatorDiv.innerHTML = `<span class="text-sm text-gray-400">criado por:</span><br><span class="font-medium text-purple-400">${question.created_by}</span>`;
  modalContent.appendChild(creatorDiv);

  // Exibe o texto da questão
  const questionTextEl = document.createElement('div');
  questionTextEl.className = 'text-lg font-semibold mb-6 text-gray-200';
  questionTextEl.textContent = question.question;
  modalContent.appendChild(questionTextEl);

  // Exibe as alternativas da questão
  const alternativesList = document.createElement('ul');
  alternativesList.className = 'list-none p-0 space-y-3 mb-6';
  if (answers.length === 0) {
    const noAnswers = document.createElement('p');
    noAnswers.className = 'text-gray-400 text-center py-4';
    noAnswers.textContent = "Nenhuma alternativa cadastrada para esta questão.";
    alternativesList.appendChild(noAnswers);
  } else {
    answers.forEach((ans, index) => {
      const li = document.createElement('li');
      li.className = 'p-4 rounded-lg border';
      if (ans.is_correct) {
        li.classList.add('bg-purple-600', 'text-white', 'border-purple-500');
      } else {
        li.classList.add('bg-gray-700', 'border-gray-600', 'text-gray-200');
      }
      
      // Adiciona letra da alternativa (A, B, C, D...)
      const letter = String.fromCharCode(65 + index);
      li.innerHTML = `<span class="font-bold mr-2">${letter})</span>${ans.answer}`;
      alternativesList.appendChild(li);
    });
  }
  modalContent.appendChild(alternativesList);

  // Cria os botões de ação: Deletar e Editar
  const buttonsDiv = document.createElement('div');
  buttonsDiv.className = 'flex gap-3 justify-end';
  
  const deleteButton = document.createElement('button');
  deleteButton.className = 'bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors';
  deleteButton.textContent = 'Deletar';
  deleteButton.onclick = () => {
    if (confirm('Tem certeza que deseja excluir esta questão?')) {
      deleteQuestion(question.id);
      closeModal();
    }
  };

  const editButton = document.createElement('button');
  editButton.className = 'bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors';
  editButton.textContent = 'Editar';
  editButton.onclick = () => {
    closeModal();
    enterEditModeInModal(question, answers);
  };

  buttonsDiv.appendChild(editButton);
  buttonsDiv.appendChild(deleteButton);
  modalContent.appendChild(buttonsDiv);
}

// --- Função para Renderizar os Detalhes da Questão e Suas Alternativas (versão antiga para compatibilidade) ---
function renderQuestionDetail(question, answers) {
  const detailContainer = document.getElementById('question-detail');
  if (!detailContainer) return; // Se não existir o container, não faz nada
  
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

// --- Função para Entrar no Modo de Edição da Questão no Modal ---
function enterEditModeInModal(question, answers) {
  const modalContent = document.getElementById('modal-content');
  modalContent.innerHTML = `
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">Questão:</label>
      <textarea class="edit-question w-full p-3 bg-gray-700 text-white rounded border border-gray-600" rows="4">${question.question}</textarea>
    </div>
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-300 mb-2">Alternativas:</label>
      <div class="alternatives-edit space-y-3"></div>
    </div>
    <div class="flex gap-3 justify-end">
      <button class="cancel bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded transition-colors">Cancelar</button>
      <button class="save bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition-colors">Salvar</button>
    </div>
  `;

  const alternativesEdit = modalContent.querySelector('.alternatives-edit');
  
  answers.forEach(answer => {
    const answerDiv = document.createElement('div');
    answerDiv.className = 'edit-answer flex items-center gap-3 p-3 bg-gray-700 rounded border border-gray-600';
    answerDiv.dataset.answerId = answer.id;
    answerDiv.innerHTML = `
      <input type="text" value="${answer.answer}" class="flex-1 p-2 bg-gray-600 text-white rounded border border-gray-500">
      <label class="flex items-center gap-1 text-white">
        <input type="checkbox" ${answer.is_correct ? 'checked' : ''} class="form-checkbox text-purple-600">
        <span class="text-sm">Correta</span>
      </label>
      <button class="delete-answer text-red-400 text-2xl hover:text-red-300">&times;</button>
    `;
    answerDiv.querySelector('.delete-answer').onclick = () => answerDiv.remove();
    alternativesEdit.appendChild(answerDiv);
  });

  modalContent.querySelector('.save').onclick = saveEdits;
  modalContent.querySelector('.cancel').onclick = () => 
    renderQuestionDetailInModal(currentQuestion, currentAnswers);
}

// --- Função para Entrar no Modo de Edição da Questão (versão antiga para compatibilidade) ---
function enterEditMode() {
  const detailContainer = document.getElementById('question-detail');
  if (!detailContainer) return; // Se não existir o container, não faz nada
  
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
    
    // Recarrega os detalhes da questão atualizada no modal
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
      
      // Remove a questão da lista local e atualiza a exibição
      allQuestions = allQuestions.filter(q => q.id !== questionId);
      totalPages = Math.ceil(allQuestions.length / QUESTIONS_PER_PAGE);
      
      // Ajusta a página atual se necessário
      if (currentPage > totalPages && totalPages > 0) {
        currentPage = totalPages;
      }
      
      // Atualiza a exibição
      renderQuestionCards();
      renderPagination();
      updateQuestionCount();
      
      // Fecha o modal se estiver aberto
      closeModal();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  }
}

// Inicializa a lista de questões ao carregar a página
fetchQuestionsList();
