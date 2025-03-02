// Constantes da API
const API_KEY = 'xau_xvY8LTcrCJCDy1iciGptJV6gPu4Nv1P26';
const BASE_URL = 'https://jean-ramalho-s-workspace-3rn0k5.us-east-1.xata.sh/db/bom-de-biblia:main';
const USERS_QUERY_ENDPOINT = `${BASE_URL}/tables/users/query`;
const USERS_DATA_ENDPOINT = `${BASE_URL}/tables/users/data`;

// Função para verificar sessão e permissão (apenas admin pode acessar)
function checkAdminSession() {
  const session = localStorage.getItem("userSession");
  if (!session) {
    window.location.href = "../../index.html";
  }
  const user = JSON.parse(session);
  if (user.adm !== true) {
    window.location.href = "../home/index.html";
  }
  return user;
}

document.addEventListener("DOMContentLoaded", () => {
  const user = checkAdminSession();
  
  // Preenche o header com informações do usuário
  document.getElementById("user-info").classList.remove("hidden");
  document.getElementById("user-name").textContent = user.nome;
  document.getElementById("user-name").classList.remove("hidden");

  const avatar = document.getElementById("avatar");
  const userName = document.getElementById("user-name"); // Elemento do nome de usuário
  const userDropdown = document.getElementById("user-dropdown");

  // Função para alternar a visibilidade do dropdown
  const toggleDropdown = (event) => {
    event.stopPropagation(); // Evita que o clique no avatar/nome feche o menu imediatamente
    userDropdown.classList.toggle("hidden");
  };

  // Evento para abrir/fechar dropdown ao clicar no avatar ou no nome de usuário
  avatar.addEventListener("click", toggleDropdown);
  userName.addEventListener("click", toggleDropdown); // Adicionando evento no nome de usuário também

  // Fecha o dropdown ao clicar fora dele
  document.addEventListener("click", (event) => {
    if (!avatar.contains(event.target) && !userName.contains(event.target) && !userDropdown.contains(event.target)) {
      userDropdown.classList.add("hidden");
    }
  });

  // Evento de logout
  document.getElementById("logout-option").addEventListener("click", () => {
    localStorage.removeItem("userSession");
    window.location.href = "../../index.html";
  });

  // Toggle da sidebar
  document.getElementById('menu-btn').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('active');
  });

  // Carrega a lista de usuários
  loadUsers();

  // Evento do formulário para criar/editar usuário
  document.getElementById("user-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const nome = document.getElementById("nome").value.trim();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value;
    const adm = document.querySelector('input[name="adm"]:checked').value === "true";
    const errorDiv = document.getElementById("user-form-error");
    errorDiv.textContent = "";

    // Se estiver editando, haverá um atributo data-user-id no formulário
    const formEl = e.target;
    const userId = formEl.getAttribute("data-user-id");

    // Não enviar senha se estiver vazia durante edição
    const payload = { nome, username, adm };
    if (password) {
      payload.password = password;
    }

    try {
      if (userId) {
        // Atualização: PATCH
        const options = {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        };
        await fetch(`${USERS_DATA_ENDPOINT}/${userId}?columns=id`, options);
      } else {
        // Criação: POST (senha é obrigatória para novo usuário)
        if (!password) {
          errorDiv.textContent = "Senha é obrigatória para novos usuários.";
          return;
        }
        
        const options = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        };
        await fetch(`${USERS_DATA_ENDPOINT}?columns=id`, options);
      }

      // Limpa o formulário e recarrega a lista
      formEl.reset();
      formEl.removeAttribute("data-user-id");
      document.getElementById("form-title").textContent = "Novo Usuário";
      loadUsers();
    } catch (error) {
      console.error(error);
      errorDiv.textContent = "Erro ao salvar o usuário.";
    }
  });
});

// Função para carregar os usuários e renderizar a lista
async function loadUsers() {
  const options = {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      columns: ["xata_id", "adm", "nome", "password", "username"],
      page: { size: 50 }
    })
  };

  try {
    const response = await fetch(USERS_QUERY_ENDPOINT, options);
    const data = await response.json();
    renderUsersList(data.records || []);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
  }
}

// Função para verificar se a tela é mobile (largura < 768px)
function isMobileView() {
  return window.innerWidth < 768;
}

// Função para renderizar os usuários em uma tabela
function renderUsersList(users) {
  const container = document.getElementById("users-list");
  container.innerHTML = "";

  if (users.length === 0) {
    container.textContent = "Nenhum usuário cadastrado.";
    return;
  }

  const table = document.createElement("table");
  table.className = "w-full border-collapse text-sm md:text-base"; // Texto menor em dispositivos móveis
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr class="bg-gray-700">
      <th class="p-1 md:p-2 border border-gray-600">Nome</th>
      <th class="p-1 md:p-2 border border-gray-600">Username</th>
      <th class="p-1 md:p-2 border border-gray-600">Admin</th>
      <th class="p-1 md:p-2 border border-gray-600">Ações</th>
    </tr>
  `;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");
  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.className = "bg-gray-800";
    
    // Definir ícones SVG para editar e deletar (usados na versão mobile)
    const editSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>`;
    
    const deleteSvg = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>`;
    
    // Opções de ações diferentes para mobile e desktop
    const mobileActions = `
      <button data-id="${u.id || u.xata_id}" class="edit-btn text-blue-500 p-1 mr-1">${editSvg}</button>
      <button data-id="${u.id || u.xata_id}" class="delete-btn text-red-500 p-1">${deleteSvg}</button>
    `;
    
    const desktopActions = `
      <button data-id="${u.id || u.xata_id}" class="edit-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2">Editar</button>
      <button data-id="${u.id || u.xata_id}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Deletar</button>
    `;
    
    // Determinar qual conjunto de ações usar
    const actions = isMobileView() ? mobileActions : desktopActions;
    
    tr.innerHTML = `
      <td class="p-1 md:p-2 border border-gray-600">${u.nome || ''}</td>
      <td class="p-1 md:p-2 border border-gray-600">${u.username || ''}</td>
      <td class="p-1 md:p-2 border border-gray-600">${u.adm ? "Sim" : "Não"}</td>
      <td class="p-1 md:p-2 border border-gray-600">
        ${actions}
      </td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);

  // Adiciona eventos para botões de editar e deletar
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const userId = this.getAttribute("data-id");
      loadUserForEdit(userId);
    });
  });
  
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", function() {
      const userId = this.getAttribute("data-id");
      deleteUser(userId);
    });
  });
}

// Função para carregar os dados de um usuário no formulário para edição
async function loadUserForEdit(userId) {
  try {
    const options = {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    // Corrigido o endpoint para buscar o usuário específico
    const response = await fetch(`${USERS_DATA_ENDPOINT}/${userId}`, options);
    
    if (!response.ok) {
      throw new Error(`Erro ao carregar usuário: ${response.status} ${response.statusText}`);
    }
    
    const user = await response.json();
    console.log("Dados do usuário recebidos:", user);
    
    // Preenche os campos do formulário com os dados do usuário
    document.getElementById("nome").value = user.nome || '';
    document.getElementById("username").value = user.username || '';
    document.getElementById("password").value = ''; // Deixa o campo de senha vazio
    
    // Seleciona o radio button correto
    const admValue = user.adm === true ? "true" : "false";
    const radioSelector = `input[name="adm"][value="${admValue}"]`;
    const radioButton = document.querySelector(radioSelector);
    
    if (radioButton) {
      radioButton.checked = true;
    }
    
    document.getElementById("form-title").textContent = "Editar Usuário";
    document.getElementById("user-form").setAttribute("data-user-id", userId);
    
    // Rola para o formulário
    document.getElementById("user-form").scrollIntoView({ behavior: 'smooth' });
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
    alert(`Erro ao carregar dados do usuário para edição: ${error.message}`);
  }
}

// Função para deletar um usuário
async function deleteUser(userId) {
  if (confirm("Tem certeza que deseja excluir este usuário?")) {
    try {
      const options = {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await fetch(`${USERS_DATA_ENDPOINT}/${userId}`, options);
      
      if (!response.ok) {
        throw new Error(`Erro ao deletar usuário: ${response.status} ${response.statusText}`);
      }
      
      alert("Usuário excluído com sucesso!");
      loadUsers(); // Recarrega a lista
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      alert(`Erro ao deletar usuário: ${error.message}`);
    }
  }
}