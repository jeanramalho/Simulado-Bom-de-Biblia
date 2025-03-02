// Constantes para a API (conforme utilizadas nas outras páginas)
const API_KEY = 'xau_xvY8LTcrCJCDy1iciGptJV6gPu4Nv1P26';
const BASE_URL = 'https://jean-ramalho-s-workspace-3rn0k5.us-east-1.xata.sh/db/bom-de-biblia:main';
const QUESTIONS_QUERY_ENDPOINT = `${BASE_URL}/tables/questions/query`;
const QUESTION_DATA_ENDPOINT = `${BASE_URL}/tables/questions/data`;
const ANSWERS_QUERY_ENDPOINT = `${BASE_URL}/tables/answers/query`;

// Variáveis globais para o simulado
let allQuestions = [];       // Armazena todas as questões carregadas
let simuladoQuestions = [];  // Questões selecionadas para o simulado
let currentSimuladoIndex = 0;
let score = 0;
let currentAnswers = [];     // Alternativas da questão atual

// --- Toggle da Sidebar ---
document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('active');
});

// --- Função para buscar todas as questões da API ---
async function fetchAllQuestions() {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    // Busca até 100 questões; ajuste se necessário
    body: JSON.stringify({
      columns: ["id", "question", "created_by"],
      page: { size: 100 }
    })
  };

  try {
    const response = await fetch(QUESTIONS_QUERY_ENDPOINT, options);
    const data = await response.json();
    allQuestions = data.records || [];
    console.log("Todas as questões carregadas:", allQuestions);
  } catch (error) {
    console.error("Erro ao buscar todas as questões:", error);
  }
}

// Busca as questões ao carregar a página
fetchAllQuestions();

// --- Função auxiliar para embaralhar um array (algoritmo de Fisher-Yates) ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Evento do botão "Criar Simulado" ---
document.getElementById('criar-simulado-btn').addEventListener('click', () => {
  // Lê a quantidade selecionada (5 ou 10 questões)
  const qty = parseInt(document.querySelector('input[name="simulado-qty"]:checked').value);
  if (allQuestions.length === 0) {
    alert("Nenhuma questão disponível para o simulado.");
    return;
  }
  let selected = [];
  // Se houver questões suficientes, seleciona sem repetição
  if (qty <= allQuestions.length) {
    selected = shuffleArray([...allQuestions]).slice(0, qty);
  } else {
    // Se não houver, utiliza todas as questões e repete aleatoriamente para completar
    selected = [...allQuestions];
    while (selected.length < qty) {
      const randomQuestion = allQuestions[Math.floor(Math.random() * allQuestions.length)];
      selected.push(randomQuestion);
    }
  }
  simuladoQuestions = selected;
  currentSimuladoIndex = 0;
  score = 0;
  // Oculta a tela de seleção e exibe o quiz
  document.getElementById('simulado-selection').classList.add('hidden');
  document.getElementById('simulado-quiz').classList.remove('hidden');
  // Carrega a primeira pergunta do simulado
  loadSimuladoQuestion(simuladoQuestions[currentSimuladoIndex]);
});

// --- Função para carregar uma pergunta do simulado e suas alternativas ---
async function loadSimuladoQuestion(question) {
  const contentDiv = document.getElementById('simulado-content');
  contentDiv.innerHTML = ''; // Limpa o conteúdo anterior

  // Exibe o texto da pergunta
  const questionEl = document.createElement('div');
  questionEl.className = 'text-xl font-semibold mb-4';
  questionEl.textContent = question.question;
  contentDiv.appendChild(questionEl);

  // Prepara a requisição para buscar as alternativas da questão
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      columns: ["id", "answer", "is_correct"],
      filter: { question_id: question.id },
      page: { size: 10 }
    })
  };

  try {
    const response = await fetch(ANSWERS_QUERY_ENDPOINT, options);
    const data = await response.json();
    currentAnswers = data.records || [];
    // Embaralha as alternativas para aleatorizar a ordem
    currentAnswers = shuffleArray([...currentAnswers]);

    // Cria um formulário com alternativas (radio buttons)
    const form = document.createElement('form');
    currentAnswers.forEach(alt => {
      const label = document.createElement('label');
      label.className = 'flex items-center mb-2 cursor-pointer';
      const radio = document.createElement('input');
      radio.type = 'radio';
      radio.name = 'simulado-answer';
      radio.value = alt.id;
      radio.className = 'form-radio text-purple-600 mr-2';
      label.appendChild(radio);
      const span = document.createElement('span');
      span.textContent = alt.answer;
      label.appendChild(span);
      form.appendChild(label);
    });
    contentDiv.appendChild(form);

    // Atualiza o texto do botão se for a última pergunta
    const responderBtn = document.getElementById('responder-btn');
    responderBtn.textContent = currentSimuladoIndex === simuladoQuestions.length - 1
      ? 'Finalizar Simulado'
      : 'Responder';
  } catch (error) {
    console.error("Erro ao buscar alternativas:", error);
  }
}

// --- Evento do botão "Responder" ---
document.getElementById('responder-btn').addEventListener('click', () => {
  const selected = document.querySelector('input[name="simulado-answer"]:checked');
  if (!selected) {
    alert("Selecione uma alternativa.");
    return;
  }
  const selectedId = selected.value;
  // Encontra a alternativa escolhida
  const chosen = currentAnswers.find(alt => alt.id == selectedId);
  if (chosen && chosen.is_correct) {
    score++;
  }
  currentSimuladoIndex++;
  // Se houver próxima pergunta, carrega-a; senão, finaliza o simulado
  if (currentSimuladoIndex < simuladoQuestions.length) {
    loadSimuladoQuestion(simuladoQuestions[currentSimuladoIndex]);
  } else {
    document.getElementById('simulado-quiz').classList.add('hidden');
    document.getElementById('final-score').textContent = `Você acertou ${score} de ${simuladoQuestions.length} questões.`;
    document.getElementById('simulado-final').classList.remove('hidden');
  }
});

// --- Evento do botão "Criar um novo simulado" ---
document.getElementById('novo-simulado-btn').addEventListener('click', () => {
  // Retorna à tela inicial do simulado
  document.getElementById('simulado-final').classList.add('hidden');
  document.getElementById('simulado-selection').classList.remove('hidden');
});
