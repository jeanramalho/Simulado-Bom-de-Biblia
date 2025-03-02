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
  // Preenche o header com informações do usuário (mesmo padrão da Home)
  document.getElementById("user-info").classList.remove("hidden");
  document.getElementById("user-name").textContent = user.nome;
  document.getElementById("user-name").classList.remove("hidden");

  const avatar = document.getElementById("avatar");
  const userDropdown = document.getElementById("user-dropdown");
  avatar.addEventListener("click", () => {
    userDropdown.classList.toggle("hidden");
  });
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
    
    const payload = { nome, username, password, adm };
    
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
        const response = await fetch(`${USERS_DATA_ENDPOINT}/${userId}?columns=id`, options);
        const data = await response.json();
        console.log("Usuário atualizado:", data);
      } else {
        // Criação: POST
        const options = {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        };
        const response = await fetch(USERS_DATA_ENDPOINT + "?columns=id", options);
        const data = await response.json();
        console.log("Usuário criado:", data);
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
    const users = data.records || [];
    renderUsersList(users);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
  }
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
  table.className = "w-full border-collapse";
  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr class="bg-gray-700">
      <th class="p-2 border border-gray-600">Nome</th>
      <th class="p-2 border border-gray-600">Username</th>
      <th class="p-2 border border-gray-600">Admin</th>
      <th class="p-2 border border-gray-600">Ações</th>
    </tr>
  `;
  table.appendChild(thead);
  
  const tbody = document.createElement("tbody");
  users.forEach(u => {
    const tr = document.createElement("tr");
    tr.className = "bg-gray-800";
    tr.innerHTML = `
      <td class="p-2 border border-gray-600">${u.nome}</td>
      <td class="p-2 border border-gray-600">${u.username}</td>
      <td class="p-2 border border-gray-600">${u.adm ? "Sim" : "Não"}</td>
      <td class="p-2 border border-gray-600">
        <button data-id="${u.xata_id}" class="edit-btn bg-blue-500 hover:bg-blue-600 text-white px-2 py-1 rounded mr-2">Editar</button>
        <button data-id="${u.xata_id}" class="delete-btn bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded">Deletar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
  
  // Adiciona eventos para botões de editar e deletar
  document.querySelectorAll(".edit-btn").forEach(btn => {
    btn.addEventListener("click", () => loadUserForEdit(btn.getAttribute("data-id")));
  });
  document.querySelectorAll(".delete-btn").forEach(btn => {
    btn.addEventListener("click", () => deleteUser(btn.getAttribute("data-id")));
  });
}

// Função para carregar os dados de um usuário no formulário para edição
async function loadUserForEdit(userId) {
  const options = {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  try {
    const response = await fetch(`${USERS_DATA_ENDPOINT}/${userId}`, options);
    const user = await response.json();
    document.getElementById("nome").value = user.nome;
    document.getElementById("username").value = user.username;
    document.getElementById("password").value = user.password;
    // Marca a opção de admin
    const admInputs = document.querySelectorAll('input[name="adm"]');
    admInputs.forEach(input => {
      input.checked = (input.value === String(user.adm));
    });
    // Altera o título do formulário e guarda o id no atributo data-user-id
    document.getElementById("form-title").textContent = "Editar Usuário";
    document.getElementById("user-form").setAttribute("data-user-id", user.xata_id);
  } catch (error) {
    console.error("Erro ao carregar usuário:", error);
  }
}

// Função para deletar um usuário
async function deleteUser(userId) {
  if (!confirm("Tem certeza que deseja deletar este usuário?")) return;
  const options = {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    }
  };
  try {
    const response = await fetch(`${USERS_DATA_ENDPOINT}/${userId}?columns=id`, options);
    const data = await response.json();
    console.log("Usuário deletado:", data);
    loadUsers();
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
  }
}
