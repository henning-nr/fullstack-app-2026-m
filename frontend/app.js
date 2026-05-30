const API_BASE = `${window.location.protocol}//${window.location.hostname}:3000/api`;

const entityConfig = {
  tutors: {
    label: 'Tutores',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'contact', label: 'Contato', type: 'text' },
      { name: 'address', label: 'Endereço', type: 'text' },
      { name: 'phone', label: 'Telefone', type: 'text' },
    ],
  },
  pets: {
    label: 'Pets',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'species', label: 'Espécie', type: 'text', required: true },
      { name: 'breed', label: 'Raça', type: 'text' },
      { name: 'sex', label: 'Sexo', type: 'text' },
      { name: 'tutor_id', label: 'Tutor', type: 'select', required: true, source: 'tutors' },
    ],
  },
  services: {
    label: 'Serviços',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'price', label: 'Preço', type: 'number', step: '0.01', required: true },
    ],
  },
  products: {
    label: 'Produtos',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'price', label: 'Preço', type: 'number', step: '0.01', required: true },
      { name: 'stock', label: 'Estoque', type: 'number', required: true },
    ],
  },
  appointments: {
    label: 'Agendamentos',
    fields: [
      { name: 'tutor_id', label: 'Tutor', type: 'select', required: true, source: 'tutors' },
      { name: 'pet_id', label: 'Pet', type: 'select', required: true, source: 'pets' },
      { name: 'service_id', label: 'Serviço', type: 'select', source: 'services' },
      { name: 'scheduled_at', label: 'Data/Hora', type: 'datetime-local', required: true },
      { name: 'status', label: 'Status', type: 'text' },
    ],
  },
};

const state = {
  token: localStorage.getItem('token') || '',
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  activeEntity: 'tutors',
  editingId: null,
  data: {
    tutors: [],
    pets: [],
    services: [],
    products: [],
    appointments: [],
  },
};

const registerForm = document.querySelector('#register-form');
const loginForm = document.querySelector('#login-form');
const entityForm = document.querySelector('#entity-form');
const formTitle = document.querySelector('#form-title');
const formFields = document.querySelector('#form-fields');
const tableHead = document.querySelector('#table-head');
const tableBody = document.querySelector('#table-body');
const entityTabs = document.querySelector('#entity-tabs');
const feedback = document.querySelector('#feedback');
const sessionStatus = document.querySelector('#session-status');
const currentUser = document.querySelector('#current-user');
const appSection = document.querySelector('#app-section');
const cancelEditButton = document.querySelector('#cancel-edit');
const refreshButton = document.querySelector('#refresh-button');
const logoutButton = document.querySelector('#logout-button');

function showMessage(message, isError = false) {
  feedback.textContent = message;
  feedback.style.color = isError ? '#b42318' : '#1f6f43';
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(state.token ? { Authorization: 'Bearer ' + state.token } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (response.status === 204) {
    return null;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Erro inesperado.');
  }

  return data;
}

function persistSession(authResponse) {
  state.token = authResponse.token;
  state.user = authResponse.user;
  localStorage.setItem('token', state.token);
  localStorage.setItem('user', JSON.stringify(state.user));
}

function clearSession() {
  state.token = '';
  state.user = null;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

function formatValue(value) {
  if (value === null || value === undefined || value === '') {
    return '<span class="muted">-</span>';
  }

  return escapeHtml(value);
}

function setAuthenticatedView() {
  const isAuthenticated = Boolean(state.token);
  sessionStatus.textContent = isAuthenticated ? 'autenticado' : 'não autenticado';
  currentUser.textContent = state.user ? `${state.user.name} (${state.user.email})` : '';
  appSection.style.display = isAuthenticated ? 'block' : 'none';
}

function createInput(field, value = '') {
  if (field.type === 'textarea') {
    return `<textarea name="${field.name}" placeholder="${field.label}">${escapeHtml(value || '')}</textarea>`;
  }

  if (field.type === 'select') {
    const options = state.data[field.source].map((item) => {
      const label = escapeHtml(item.name || `#${item.id}`);
      const selected = String(item.id) === String(value || '') ? 'selected' : '';
      return `<option value="${item.id}" ${selected}>${label}</option>`;
    });

    const allowEmpty = field.required ? '' : '<option value="">Selecione</option>';
    return `<select name="${field.name}" ${field.required ? 'required' : ''}>${allowEmpty}${options.join('')}</select>`;
  }

  const attributes = [
    `name="${field.name}"`,
    `type="${field.type}"`,
    `placeholder="${field.label}"`,
    field.required ? 'required' : '',
    field.step ? `step="${field.step}"` : '',
    value !== undefined && value !== null ? `value="${escapeHtml(value)}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  return `<input ${attributes} />`;
}

function renderTabs() {
  entityTabs.innerHTML = Object.entries(entityConfig)
    .map(([entity, config]) => `
      <button type="button" class="tab ${entity === state.activeEntity ? 'active' : ''}" data-entity="${entity}">
        ${config.label}
      </button>
    `)
    .join('');
}

function renderForm(record = {}) {
  const config = entityConfig[state.activeEntity];
  formTitle.textContent = state.editingId ? `Editando ${config.label.slice(0, -1)}` : `Novo ${config.label.slice(0, -1)}`;

  // Renderiza o formulário dinamicamente para reaproveitar o CRUD em todas as entidades - [OpenAI]
  formFields.innerHTML = config.fields
    .map((field) => `
      <label>
        ${field.label}
        ${createInput(field, record[field.name])}
      </label>
    `)
    .join('');
}

function renderTable() {
  const config = entityConfig[state.activeEntity];
  const columns = ['id', ...config.fields.map((field) => field.name), 'actions'];

  tableHead.innerHTML = columns
    .map((column) => `<th>${column === 'actions' ? 'Ações' : column}</th>`)
    .join('');

  const rows = state.data[state.activeEntity];
  tableBody.innerHTML = rows.length
    ? rows.map((row) => `
        <tr>
          ${columns.map((column) => {
            if (column === 'actions') {
              return `
                <td>
                  <div class="action-buttons">
                    <button type="button" data-edit="${row.id}">Editar</button>
                    <button type="button" class="secondary" data-delete="${row.id}">Excluir</button>
                  </div>
                </td>
              `;
            }

            return `<td>${formatValue(row[column])}</td>`;
          }).join('')}
        </tr>
      `).join('')
    : '<tr><td colspan="100%">Nenhum registro cadastrado.</td></tr>';
}

async function loadEntity(entity) {
  state.data[entity] = await request(`/${entity}`);
}

async function loadDependencies() {
  const dependencies = new Set(
    entityConfig[state.activeEntity].fields
      .filter((field) => field.source)
      .map((field) => field.source),
  );

  await Promise.all([...dependencies].map(loadEntity));
}

async function refreshCurrentEntity() {
  if (!state.token) {
    return;
  }

  await loadDependencies();
  await loadEntity(state.activeEntity);
  renderForm();
  renderTable();
}

async function handleAuth(event, endpoint) {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const payload = Object.fromEntries(formData.entries());

  try {
    const authResponse = await request(endpoint, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    persistSession(authResponse);
    setAuthenticatedView();
    await refreshCurrentEntity();
    showMessage(endpoint.includes('register') ? 'Usuário criado com sucesso.' : 'Login realizado com sucesso.');
    event.currentTarget.reset();
  } catch (error) {
    showMessage(error.message, true);
  }
}

entityTabs.addEventListener('click', async (event) => {
  const button = event.target.closest('[data-entity]');

  if (!button) {
    return;
  }

  state.activeEntity = button.dataset.entity;
  state.editingId = null;
  renderTabs();

  try {
    await refreshCurrentEntity();
  } catch (error) {
    showMessage(error.message, true);
  }
});

entityForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const formData = new FormData(entityForm);
  const payload = Object.fromEntries(formData.entries());
  const config = entityConfig[state.activeEntity];

  for (const field of config.fields) {
    if (field.type === 'number' && payload[field.name] !== '') {
      payload[field.name] = Number(payload[field.name]);
    }
  }

  if (payload.service_id === '') {
    delete payload.service_id;
  }

  try {
    const path = state.editingId ? `/${state.activeEntity}/${state.editingId}` : `/${state.activeEntity}`;
    const method = state.editingId ? 'PUT' : 'POST';

    await request(path, {
      method,
      body: JSON.stringify(payload),
    });

    entityForm.reset();
    state.editingId = null;
    await refreshCurrentEntity();
    showMessage('Registro salvo com sucesso.');
  } catch (error) {
    showMessage(error.message, true);
  }
});

tableBody.addEventListener('click', async (event) => {
  const editId = event.target.dataset.edit;
  const deleteId = event.target.dataset.delete;

  if (editId) {
    state.editingId = Number(editId);
    const selectedRecord = state.data[state.activeEntity].find((item) => item.id === Number(editId));
    renderForm(selectedRecord);
    return;
  }

  if (deleteId) {
    try {
      await request(`/${state.activeEntity}/${deleteId}`, { method: 'DELETE' });
      await refreshCurrentEntity();
      showMessage('Registro excluído com sucesso.');
    } catch (error) {
      showMessage(error.message, true);
    }
  }
});

cancelEditButton.addEventListener('click', () => {
  state.editingId = null;
  entityForm.reset();
  renderForm();
});

refreshButton.addEventListener('click', async () => {
  try {
    await refreshCurrentEntity();
    showMessage('Dados atualizados.');
  } catch (error) {
    showMessage(error.message, true);
  }
});

logoutButton.addEventListener('click', () => {
  clearSession();
  setAuthenticatedView();
  renderForm();
  renderTable();
  showMessage('Sessão encerrada.');
});

registerForm.addEventListener('submit', (event) => handleAuth(event, '/auth/register'));
loginForm.addEventListener('submit', (event) => handleAuth(event, '/auth/login'));

async function bootstrap() {
  renderTabs();
  renderForm();
  renderTable();
  setAuthenticatedView();

  if (!state.token) {
    return;
  }

  try {
    const user = await request('/auth/me');
    state.user = user;
    localStorage.setItem('user', JSON.stringify(user));
    setAuthenticatedView();
    await refreshCurrentEntity();
  } catch (error) {
    clearSession();
    setAuthenticatedView();
    showMessage(error.message, true);
  }
}

bootstrap();
