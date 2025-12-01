document.addEventListener('DOMContentLoaded', function() {
    // Элементы DOM
    const addTaskForm = document.getElementById('addTaskForm');
    const tasksList = document.getElementById('tasksList');
    const emptyState = document.getElementById('emptyState');
    const taskCount = document.getElementById('taskCount');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const notification = document.getElementById('notification');
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Переменные состояния
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    
    // Инициализация приложения
    initApp();
    
    // Инициализация приложения
    function initApp() {
        updateTaskCount();
        renderTasks();
        setupEventListeners();
        
        // Добавление демо-задач при первом запуске
        if (tasks.length === 0) {
            addDemoTasks();
        }
    }
    
    // Настройка обработчиков событий
    function setupEventListeners() {
        // Обработчик отправки формы
        addTaskForm.addEventListener('submit', handleAddTask);
        
        // Очистка всех задач
        clearAllBtn.addEventListener('click', handleClearAll);
        
        // Фильтрация задач
        filterButtons.forEach(button => {
            button.addEventListener('click', handleFilterChange);
        });
    }
    
    // Обработчик добавления задачи
    function handleAddTask(e) {
        e.preventDefault();
        
        const title = document.getElementById('taskTitle').value.trim();
        const description = document.getElementById('taskDescription').value.trim();
        const priority = document.getElementById('taskPriority').value;
        
        if (!title) {
            showNotification('Введите название задачи!', true);
            return;
        }
        
        // Создание новой задачи
        const newTask = {
            id: Date.now(),
            title: title,
            description: description,
            priority: priority,
            completed: false,
            date: new Date().toLocaleDateString('ru-RU')
        };
        
        // Добавление задачи в массив
        tasks.unshift(newTask);
        
        // Сохранение в localStorage
        saveTasks();
        
        // Обновление интерфейса
        renderTasks();
        updateTaskCount();
        
        // Показ уведомления
        showNotification('Задача успешно добавлена!');
        
        // Очистка формы
        addTaskForm.reset();
        document.getElementById('taskPriority').value = 'medium';
    }
    
    // Обработчик очистки всех задач
    function handleClearAll() {
        if (tasks.length === 0) return;
        
        if (confirm('Вы уверены, что хотите удалить все задачи?')) {
            tasks = [];
            saveTasks();
            renderTasks();
            updateTaskCount();
            showNotification('Все задачи удалены!');
        }
    }
    
    // Обработчик изменения фильтра
    function handleFilterChange() {
        // Обновление активной кнопки
        filterButtons.forEach(btn => btn.classList.remove('active'));
        this.classList.add('active');
        
        // Установка фильтра
        currentFilter = this.dataset.filter;
        
        // Рендеринг задач с учетом фильтра
        renderTasks();
    }
    
    // Функция рендеринга задач
    function renderTasks() {
        // Очистка списка
        tasksList.innerHTML = '';
        
        // Фильтрация задач
        let filteredTasks = tasks;
        if (currentFilter === 'active') {
            filteredTasks = tasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = tasks.filter(task => task.completed);
        }
        
        // Проверка на пустой список
        if (filteredTasks.length === 0) {
            tasksList.appendChild(emptyState);
            emptyState.style.display = 'block';
            return;
        }
        
        emptyState.style.display = 'none';
        
        // Рендеринг задач
        filteredTasks.forEach(task => {
            const taskElement = createTaskElement(task);
            tasksList.appendChild(taskElement);
        });
    }
    
    // Создание элемента задачи
    function createTaskElement(task) {
        const taskCard = document.createElement('div');
        taskCard.className = `task-card ${task.priority} ${task.completed ? 'completed' : ''} fade-in`;
        taskCard.dataset.id = task.id;
        
        // Определение приоритета
        let priorityText, priorityClass;
        switch (task.priority) {
            case 'low':
                priorityText = 'Низкий';
                priorityClass = 'priority-low';
                break;
            case 'medium':
                priorityText = 'Средний';
                priorityClass = 'priority-medium';
                break;
            case 'high':
                priorityText = 'Высокий';
                priorityClass = 'priority-high';
                break;
        }
        
        taskCard.innerHTML = `
            <div class="task-header">
                <div class="task-title">${escapeHtml(task.title)}</div>
                <span class="task-priority ${priorityClass}">${priorityText}</span>
            </div>
            ${task.description ? `<div class="task-description">${escapeHtml(task.description)}</div>` : ''}
            <div class="task-footer">
                <div class="task-date">${task.date}</div>
                <div class="task-actions">
                    <button class="btn btn-${task.completed ? 'secondary' : 'success'} btn-sm complete-btn">
                        <i class="fas fa-${task.completed ? 'undo' : 'check'}"></i> ${task.completed ? 'Возобновить' : 'Выполнить'}
                    </button>
                    <button class="btn btn-danger btn-sm delete-btn">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
            </div>
        `;
        
        // Добавление обработчиков событий
        const completeBtn = taskCard.querySelector('.complete-btn');
        const deleteBtn = taskCard.querySelector('.delete-btn');
        
        completeBtn.addEventListener('click', function() {
            toggleTaskComplete(task.id);
        });
        
        deleteBtn.addEventListener('click', function() {
            deleteTask(task.id);
        });
        
        return taskCard;
    }
    
    // Переключение статуса задачи
    function toggleTaskComplete(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            tasks[taskIndex].completed = !tasks[taskIndex].completed;
            saveTasks();
            renderTasks();
            updateTaskCount();
            
            const task = tasks[taskIndex];
            showNotification(`Задача "${task.title}" ${task.completed ? 'выполнена' : 'возобновлена'}!`);
        }
    }
    
    // Удаление задачи
    function deleteTask(taskId) {
        const taskIndex = tasks.findIndex(task => task.id === taskId);
        if (taskIndex !== -1) {
            const taskTitle = tasks[taskIndex].title;
            tasks.splice(taskIndex, 1);
            saveTasks();
            renderTasks();
            updateTaskCount();
            showNotification(`Задача "${taskTitle}" удалена!`);
        }
    }
    
    // Обновление счетчика задач
    function updateTaskCount() {
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.completed).length;
        const activeTasks = totalTasks - completedTasks;
        
        let countText = `${totalTasks} задач`;
        if (totalTasks > 0) {
            countText += ` (${activeTasks} активных, ${completedTasks} выполненных)`;
        }
        
        taskCount.textContent = countText;
    }
    
    // Сохранение задач в localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Показать уведомление
    function showNotification(message, isError = false) {
        notification.textContent = message;
        notification.className = 'notification';
        
        if (isError) {
            notification.classList.add('error');
        }
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    // Экранирование HTML для безопасности
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Добавление демо-задач при первом запуске
    function addDemoTasks() {
        const demoTasks = [
            {
                id: 1,
                title: "Изучить JavaScript",
                description: "Повторить основные концепции и функции ES6+",
                priority: "high",
                completed: false,
                date: new Date().toLocaleDateString('ru-RU')
            },
            {
                id: 2,
                title: "Подготовить отчет",
                description: "Завершить квартальный отчет по проекту",
                priority: "medium",
                completed: true,
                date: new Date().toLocaleDateString('ru-RU')
            },
            {
                id: 3,
                title: "Купить продукты",
                description: "Молоко, хлеб, яйца, фрукты",
                priority: "low",
                completed: false,
                date: new Date().toLocaleDateString('ru-RU')
            }
        ];
        
        tasks = demoTasks;
        saveTasks();
        renderTasks();
        updateTaskCount();
    }
});
