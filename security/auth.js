// Verifica a sessão do usuário ao carregar a página
function checkSession() {
    const session = localStorage.getItem("userSession");
    if (!session) {
      window.location.href = "../../index.html"; // Redireciona para o login se não estiver logado
    }
    return JSON.parse(session);
  }
  
  // Adiciona o avatar e nome do usuário no header (agora alinhado à esquerda)
  function addUserDropdown(user) {
    const header = document.querySelector("header");
    if (!header) return; // Se a página não tem <header>, não faz nada
  
    // Container do usuário (agora no canto esquerdo)
    const userContainer = document.createElement("div");
    userContainer.id = "user-info";
    userContainer.className = "absolute left-5 top-5 flex items-center space-x-2";
  
    // Avatar do usuário (ícone SVG)
    const avatar = document.createElement("div");
    avatar.id = "avatar";
    avatar.className = "w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center cursor-pointer relative";
  
    avatar.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-white" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
      </svg>
    `;
  
    // Nome do usuário
    const userName = document.createElement("div");
    userName.id = "user-name";
    userName.textContent = user.nome;
    userName.className = "cursor-pointer text-white";
  
    // Dropdown do menu do usuário
    const dropdown = document.createElement("div");
    dropdown.id = "user-dropdown";
    dropdown.className = "absolute left-0 mt-10 w-40 bg-gray-800 border border-gray-600 rounded shadow-lg hidden";
  
    let dropdownContent = `
      <ul>
        ${user.adm ? '<li id="admin-option" class="px-4 py-2 hover:bg-gray-700 cursor-pointer">Gerenciar Usuários</li>' : ""}
        <li id="logout-option" class="px-4 py-2 hover:bg-gray-700 cursor-pointer">Sair</li>
      </ul>
    `;
  
    dropdown.innerHTML = dropdownContent;
    avatar.appendChild(dropdown);
  
    // Adiciona os elementos no header
    userContainer.appendChild(avatar);
    userContainer.appendChild(userName);
    header.appendChild(userContainer);
  
    // Evento para abrir/fechar dropdown ao clicar no avatar ou nome
    function toggleDropdown(event) {
      event.stopPropagation(); // Impede que o clique feche imediatamente ao abrir
      dropdown.classList.toggle("hidden");
    }
    avatar.addEventListener("click", toggleDropdown);
    userName.addEventListener("click", toggleDropdown);
  
    // Evento para fechar dropdown ao clicar fora dele
    document.addEventListener("click", (event) => {
      if (!userContainer.contains(event.target)) {
        dropdown.classList.add("hidden");
      }
    });
  
    // Evento de logout
    document.getElementById("logout-option").addEventListener("click", () => {
      localStorage.removeItem("userSession");
      window.location.href = "../../index.html";
    });
  
    // Se for admin, adiciona evento para Gerenciar Usuários
    if (user.adm) {
      document.getElementById("admin-option").addEventListener("click", () => {
        window.location.href = "../admin/index.html";
      });
    }
  }
  
  // Execução automática ao carregar a página
  document.addEventListener("DOMContentLoaded", () => {
    const user = checkSession(); // Verifica se há sessão ativa
    addUserDropdown(user); // Adiciona o avatar e menu do usuário no header
  });
  