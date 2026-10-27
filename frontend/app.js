const form = document.querySelector('#usuario-form');
const formTitle = document.querySelector('#form-title');
const submitButton = document.querySelector('#submit-button');
const cancelEditButton = document.querySelector('#cancel-edit');
const messageBox = document.querySelector('#mensaje');
const usersBody = document.querySelector('#usuarios-body');
const recordCount = document.querySelector('#record-count');
const searchForm = document.querySelector('#buscar-form');
const searchInput = document.querySelector('#buscar-id');

let editingId = null;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers }
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Ocurrió un error inesperado.');
  return data;
}

function showMessage(text, isError = false) {
  messageBox.textContent = text;
  messageBox.classList.toggle('error', isError);
  messageBox.hidden = false;
}

function createCell(text, className = '') {
  const cell = document.createElement('td');
  cell.textContent = text;
  if (className) cell.className = className;
  return cell;
}

function renderUsers(users) {
  usersBody.replaceChildren();
  recordCount.textContent = `${users.length} ${users.length === 1 ? 'registro' : 'registros'}`;

  if (users.length === 0) {
    const row = document.createElement('tr');
    row.className = 'empty-row';
    const cell = createCell('No hay usuarios para mostrar.');
    cell.colSpan = 5;
    row.append(cell);
    usersBody.append(row);
    return;
  }

  for (const user of users) {
    const row = document.createElement('tr');
    row.append(
      createCell(String(user.usu_id), 'id-cell'),
      createCell(user.usu_usuario),
      createCell(user.usu_nombre),
      createCell(user.usu_apellido)
    );

    const actions = document.createElement('td');
    actions.className = 'actions-cell';

    const editButton = document.createElement('button');
    editButton.type = 'button';
    editButton.className = 'button button-quiet';
    editButton.textContent = 'Editar';
    editButton.setAttribute('aria-label', `Editar usuario ${user.usu_usuario}`);
    editButton.addEventListener('click', () => beginEdit(user));

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.className = 'button button-danger';
    deleteButton.textContent = 'Eliminar';
    deleteButton.setAttribute('aria-label', `Eliminar usuario ${user.usu_usuario}`);
    deleteButton.addEventListener('click', () => deleteUser(user));

    actions.append(editButton, deleteButton);
    row.append(actions);
    usersBody.append(row);
  }
}

async function loadUsers() {
  try {
    const users = await request('/api/usuarios');
    renderUsers(users);
  } catch (error) {
    showMessage(error.message, true);
  }
}

function resetForm() {
  editingId = null;
  form.reset();
  formTitle.textContent = 'Nuevo usuario';
  submitButton.textContent = 'Registrar usuario';
  cancelEditButton.hidden = true;
}

function beginEdit(user) {
  editingId = user.usu_id;
  form.elements.usu_usuario.value = user.usu_usuario;
  form.elements.usu_nombre.value = user.usu_nombre;
  form.elements.usu_apellido.value = user.usu_apellido;
  formTitle.textContent = `Editar usuario #${user.usu_id}`;
  submitButton.textContent = 'Guardar cambios';
  cancelEditButton.hidden = false;
  form.elements.usu_usuario.focus();
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const usuario = Object.fromEntries(new FormData(form).entries());
  const url = editingId === null ? '/api/usuarios' : `/api/usuarios/${editingId}`;
  const method = editingId === null ? 'POST' : 'PUT';

  submitButton.disabled = true;
  try {
    await request(url, { method, body: JSON.stringify(usuario) });
    showMessage(editingId === null ? 'Usuario registrado correctamente.' : 'Usuario actualizado correctamente.');
    resetForm();
    searchInput.value = '';
    await loadUsers();
  } catch (error) {
    showMessage(error.message, true);
  } finally {
    submitButton.disabled = false;
  }
});

cancelEditButton.addEventListener('click', resetForm);

searchForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const id = searchInput.value.trim();
  if (!id || !Number.isSafeInteger(Number(id)) || Number(id) < 1) {
    showMessage('Ingresá un ID entero positivo para buscar.', true);
    searchInput.focus();
    return;
  }

  try {
    const user = await request(`/api/usuarios/${encodeURIComponent(id)}`);
    renderUsers([user]);
    showMessage(`Se encontró el usuario con ID ${user.usu_id}.`);
  } catch (error) {
    renderUsers([]);
    showMessage(error.message, true);
  }
});

document.querySelector('#ver-todos').addEventListener('click', async () => {
  searchInput.value = '';
  await loadUsers();
});

async function deleteUser(user) {
  const confirmed = window.confirm(`¿Eliminar al usuario "${user.usu_usuario}" (ID ${user.usu_id})?`);
  if (!confirmed) return;

  try {
    await request(`/api/usuarios/${user.usu_id}`, { method: 'DELETE' });
    if (editingId === user.usu_id) resetForm();
    searchInput.value = '';
    await loadUsers();
    showMessage('Usuario eliminado correctamente.');
  } catch (error) {
    showMessage(error.message, true);
  }
}

loadUsers();