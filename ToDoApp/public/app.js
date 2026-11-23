// Frontend App Logic
const API_BASE = '/api/todos';

// State
let todos = [];
let currentFilter = 'all';

// DOM Elements
const todoForm = document.getElementById('todo-form');
const todoInput = document.getElementById('todo-input');
const todoList = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const emptyTitle = document.getElementById('empty-title');
const emptyDesc = document.getElementById('empty-desc');
const taskBadge = document.getElementById('task-badge');
const currentDateEl = document.getElementById('current-date');
const filterTabs = document.querySelectorAll('.filter-tab');
const countAll = document.getElementById('count-all');
const countActive = document.getElementById('count-active');
const countCompleted = document.getElementById('count-completed');
const btnClearCompleted = document.getElementById('btn-clear-completed');
const toastEl = document.getElementById('toast');

// Initialize date display
function displayCurrentDate() {
  const options = { weekday: 'long', month: 'short', day: 'numeric' };
  const today = new Date().toLocaleDateString(undefined, options);
  currentDateEl.textContent = today;
}

// Show Toast Message
let toastTimeout;
function showToast(message) {
  clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimeout = setTimeout(() => {
    toastEl.classList.remove('show');
  }, 2500);
}

// Fetch all todos from server
async function fetchTodos() {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error('Failed to load tasks');
    todos = await res.json();
    render();
  } catch (err) {
    showToast('Error loading tasks: ' + err.message);
  }
}

// Add a new task
async function addTodo(title) {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title })
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Failed to add task');
    }
    const newTodo = await res.json();
    todos.unshift(newTodo);
    render();
    showToast('Task added');
  } catch (err) {
    showToast(err.message);
  }
}

// Toggle completion status
async function toggleTodo(id) {
  const todo = todos.find(t => t.id === id);
  if (!todo) return;

  const targetState = !todo.completed;
  
  // Optimistic update
  todo.completed = targetState;
  render();

  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ completed: targetState })
    });
    if (!res.ok) throw new Error('Could not update status');
    showToast(targetState ? 'Marked complete' : 'Marked active');
  } catch (err) {
    // Revert on failure
    todo.completed = !targetState;
    render();
    showToast(err.message);
  }
}

// Delete task
async function deleteTodo(id) {
  const itemEl = document.querySelector(`[data-id="${id}"]`);
  if (itemEl) {
    itemEl.classList.add('deleting');
  }

  setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      todos = todos.filter(t => t.id !== id);
      render();
      showToast('Task deleted');
    } catch (err) {
      if (itemEl) itemEl.classList.remove('deleting');
      showToast(err.message);
    }
  }, 180);
}

// Clear all completed tasks
async function clearCompleted() {
  const completedCount = todos.filter(t => t.completed).length;
  if (completedCount === 0) return;

  try {
    const res = await fetch(`${API_BASE}/clear-completed`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to clear completed tasks');
    todos = todos.filter(t => !t.completed);
    render();
    showToast(`Cleared ${completedCount} completed task${completedCount > 1 ? 's' : ''}`);
  } catch (err) {
    showToast(err.message);
  }
}

// Render DOM
function render() {
  // Compute counts
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;

  // Update counter badges
  countAll.textContent = total;
  countActive.textContent = active;
  countCompleted.textContent = completed;
  taskBadge.textContent = `${active} active`;

  // Toggle "Clear completed" button
  btnClearCompleted.style.display = completed > 0 ? 'inline-block' : 'none';

  // Filter items
  const filtered = todos.filter(todo => {
    if (currentFilter === 'active') return !todo.completed;
    if (currentFilter === 'completed') return todo.completed;
    return true;
  });

  // Render list or empty state
  todoList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.style.display = 'flex';
    if (currentFilter === 'active') {
      emptyTitle.textContent = 'No active tasks';
      emptyDesc.textContent = total > 0 ? 'All tasks are completed. Great work!' : 'Add a task to get started.';
    } else if (currentFilter === 'completed') {
      emptyTitle.textContent = 'No completed tasks yet';
      emptyDesc.textContent = 'Check off tasks as you finish them.';
    } else {
      emptyTitle.textContent = 'All caught up!';
      emptyDesc.textContent = 'No tasks to show. Add a task above to get started.';
    }
  } else {
    emptyState.style.display = 'none';

    filtered.forEach(todo => {
      const li = document.createElement('li');
      li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
      li.dataset.id = todo.id;

      li.innerHTML = `
        <div class="todo-left">
          <button class="btn-toggle" aria-label="${todo.completed ? 'Mark incomplete' : 'Mark complete'}">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <span class="todo-text">${escapeHtml(todo.title)}</span>
        </div>
        <button class="btn-delete" aria-label="Delete task" title="Delete">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
          </svg>
        </button>
      `;

      // Event listeners
      const toggleBtn = li.querySelector('.btn-toggle');
      toggleBtn.addEventListener('click', () => toggleTodo(todo.id));

      const deleteBtn = li.querySelector('.btn-delete');
      deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

      todoList.appendChild(li);
    });
  }
}

// Utility: Prevent XSS
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Event Listeners
todoForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = todoInput.value.trim();
  if (text) {
    addTodo(text);
    todoInput.value = '';
    todoInput.focus();
  }
});

filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    currentFilter = tab.dataset.filter;
    render();
  });
});

btnClearCompleted.addEventListener('click', clearCompleted);

// Initialize on page load
displayCurrentDate();
fetchTodos();
