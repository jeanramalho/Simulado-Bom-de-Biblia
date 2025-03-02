// Constantes da API
const API_KEY = 'xau_xvY8LTcrCJCDy1iciGptJV6gPu4Nv1P26';
const BASE_URL = 'https://jean-ramalho-s-workspace-3rn0k5.us-east-1.xata.sh/db/bom-de-biblia:main';
const USERS_QUERY_ENDPOINT = `${BASE_URL}/tables/users/query`;

// Função para alternar a visibilidade da senha
document.getElementById('toggle-password').addEventListener('click', () => {
  const pwdInput = document.getElementById('password');
  if (pwdInput.type === 'password') {
    pwdInput.type = 'text';
  } else {
    pwdInput.type = 'password';
  }
});

// Evento do formulário de login
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const usernameInput = document.getElementById('username').value.trim();
  const passwordInput = document.getElementById('password').value;
  const errorDiv = document.getElementById('login-error');
  errorDiv.textContent = "";

  // Cria a query para buscar o usuário com o username informado
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      columns: ["xata_id", "adm", "nome", "password", "username"],
      filter: { username: usernameInput },
      page: { size: 1 }
    })
  };

  try {
    const response = await fetch(USERS_QUERY_ENDPOINT, options);
    const data = await response.json();
    const user = data.records && data.records[0];
    if (!user) {
      errorDiv.textContent = "Usuário não encontrado.";
      return;
    }
    // Verifica se a senha confere (supondo senha em texto plano)
    if (user.password !== passwordInput) {
      errorDiv.textContent = "Senha incorreta.";
      return;
    }
    // Se tudo estiver certo, salva a sessão no localStorage
    localStorage.setItem("userSession", JSON.stringify(user));
    // Redireciona para a página inicial
    window.location.href = "pages/home/index.html";
  } catch (error) {
    console.error(error);
    errorDiv.textContent = "Erro ao realizar login. Tente novamente.";
  }
});
