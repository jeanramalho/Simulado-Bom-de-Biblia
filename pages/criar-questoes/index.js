const API_KEY = 'xau_xvY8LTcrCJCDy1iciGptJV6gPu4Nv1P26';
const BASE_URL = 'https://jean-ramalho-s-workspace-3rn0k5.us-east-1.xata.sh/db/bom-de-biblia:main';
const QUESTIONS_ENDPOINT = `${BASE_URL}/tables/questions/data`;
const ANSWERS_ENDPOINT = `${BASE_URL}/tables/answers/data`;

document.getElementById('question-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const questionText = document.getElementById('question').value.trim();
  const createdBy = document.getElementById('created_by').value.trim();

  // Coleta os valores das alternativas
  const alternatives = [];
  for (let i = 1; i <= 4; i++) {
    const answerText = document.getElementById('answer' + i).value.trim();
    const isCorrect = document.getElementById('correct' + i).checked;
    alternatives.push({ answer: answerText, is_correct: isCorrect });
  }

  // Filtra apenas alternativas não vazias
  const validAlternatives = alternatives.filter(alt => alt.answer !== '');
  
  // Validações
  if (validAlternatives.length < 2) {
    alert("É necessário pelo menos 2 alternativas válidas.");
    return;
  }

  const correctCount = validAlternatives.filter(alt => alt.is_correct).length;
  if (correctCount !== 1) {
    alert("Selecione exatamente uma alternativa correta.");
    return;
  }

  try {
    console.log("Iniciando criação da questão...");
    console.log("Alternativas válidas:", validAlternatives);
    
    // Cria a questão na tabela "questions"
    const questionResponse = await fetch(QUESTIONS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        question: questionText,
        created_by: createdBy
      })
    });

    if (!questionResponse.ok) {
      const errorText = await questionResponse.text();
      throw new Error('Erro ao salvar a questão: ' + errorText);
    }

    const questionData = await questionResponse.json();
    const questionId = questionData.id;
    if (!questionId) {
      throw new Error("Não foi possível obter o ID da questão.");
    }
    console.log("Questão criada com ID:", questionId);

    // Cria cada alternativa válida na tabela "answers"
    console.log(`Criando ${validAlternatives.length} alternativas...`);
    for (const alt of validAlternatives) {
      console.log("Salvando alternativa:", alt);
      
      const answerResponse = await fetch(ANSWERS_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        body: JSON.stringify({
          question_id: questionId,
          answer: alt.answer,
          is_correct: alt.is_correct
        })
      });

      if (!answerResponse.ok) {
        const errorText = await answerResponse.text();
        throw new Error('Erro ao salvar as respostas: ' + errorText);
      }
      
      console.log("Alternativa salva com sucesso");
    }

    alert(`Questão salva com sucesso! ${validAlternatives.length} alternativa(s) criada(s).`);
    document.getElementById('question-form').reset();
  } catch (error) {
    console.error(error);
    alert('Ocorreu um erro ao salvar a questão e respostas.');
  }
});

// Toggle do menu sidebar via botão hamburguer
document.getElementById('menu-btn').addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('active');
});
