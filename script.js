document.addEventListener('DOMContentLoaded', () => {
    // --- Initialisation des éléments du DOM ---
    const navItems = document.querySelectorAll('.nav-item');
    const contentViews = document.querySelectorAll('.content-view');
    const addTaskBtn = document.querySelector('.add-task-btn');
    const taskModal = document.getElementById('task-modal');
    const projectModal = document.getElementById('project-modal');
    const closeModalButtons = document.querySelectorAll('.close-button');
    const taskForm = document.getElementById('task-form');
    const projectForm = document.getElementById('project-form');
    const allTasksList = document.getElementById('all-tasks-list');
    const upcomingTasksList = document.querySelector('.upcoming-tasks');
    const filterStatus = document.getElementById('filter-status');
    const sortBy = document.getElementById('sort-by');
    const taskSearch = document.getElementById('task-search');
    const addProjectBtn = document.querySelector('.add-project-btn');
    const projectListDiv = document.querySelector('.project-list');
    const addCategoryBtn = document.getElementById('add-category-btn');
    const newCategoryInput = document.getElementById('new-category-input');
    const categoryListUl = document.querySelector('.category-list');
    const taskCategorySelect = document.getElementById('task-category');
    const taskProjectSelect = document.getElementById('task-project');
    const notificationCount = document.querySelector('.notification-count');
    const themeSelect = document.getElementById('theme-select');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');
    const currentMonthYearHeader = document.getElementById('currentMonthYear');
    const calendarDaysGrid = document.getElementById('calendar-days');

    // --- Données d'application (chargées ou initialisées vides) ---
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let projects = JSON.parse(localStorage.getItem('projects')) || [];
    let categories = JSON.parse(localStorage.getItem('categories')) || [];

    // --- Fonctions utilitaires ---
    const saveToLocalStorage = () => {
        localStorage.setItem('tasks', JSON.stringify(tasks));
        localStorage.setItem('projects', JSON.stringify(projects));
        localStorage.setItem('categories', JSON.stringify(categories));
    };

    const generateUniqueId = () => '_' + Math.random().toString(36).substr(2, 9);

    const getTasksByProject = (projectId) => tasks.filter(task => task.project === projectId);

    const updateProjectStats = () => {
        projects.forEach(project => {
            const projectTasks = getTasksByProject(project.id);
            project.tasksCount = projectTasks.length;
            project.completedTasks = projectTasks.filter(task => task.completed).length;
        });
        saveToLocalStorage();
    };

    // --- Gestion de la vue et navigation ---
    const showView = (viewId) => {
        contentViews.forEach(view => view.classList.add('hidden'));
        document.getElementById(`${viewId}-view`).classList.remove('hidden');

        navItems.forEach(item => item.classList.remove('active'));
        document.querySelector(`[data-view="${viewId}"]`).classList.add('active');

        // Actions spécifiques à la vue
        if (viewId === 'tasks') {
            renderTasks();
        } else if (viewId === 'dashboard') {
            renderDashboard();
        } else if (viewId === 'projects') {
            renderProjects();
        } else if (viewId === 'categories') {
            renderCategories();
        } else if (viewId === 'calendar') {
            renderCalendar();
        }
    };

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            showView(item.dataset.view);
        });
    });

    // --- Modals (Ajouter/Modifier Tâche, Ajouter Projet) ---
    const openModal = (modalElement, taskId = null, projectId = null) => {
        modalElement.style.display = 'flex'; // Use flex to center
        if (modalElement === taskModal) {
            populateTaskCategoriesAndProjects();
            if (taskId) {
                const task = tasks.find(t => t.id === taskId);
                if (task) {
                    document.getElementById('task-id').value = task.id;
                    document.getElementById('task-title').value = task.title;
                    document.getElementById('task-description').value = task.description;
                    document.getElementById('task-due-date').value = task.dueDate;
                    document.getElementById('task-priority').value = task.priority;
                    document.getElementById('task-category').value = task.category;
                    document.getElementById('task-project').value = task.project;
                    taskModal.querySelector('h2').textContent = 'Modifier Tâche';
                }
            } else {
                taskForm.reset();
                document.getElementById('task-id').value = '';
                taskModal.querySelector('h2').textContent = 'Ajouter Tâche';
            }
        } else if (modalElement === projectModal) {
            if (projectId) {
                const project = projects.find(p => p.id === projectId);
                if (project) {
                    document.getElementById('project-id').value = project.id;
                    document.getElementById('project-name').value = project.name;
                    document.getElementById('project-description').value = project.description;
                    projectModal.querySelector('h2').textContent = 'Modifier Projet';
                }
            } else {
                projectForm.reset();
                document.getElementById('project-id').value = '';
                projectModal.querySelector('h2').textContent = 'Nouveau Projet';
            }
        }
    };

    const closeModal = (modalElement) => {
        modalElement.style.display = 'none';
        taskForm.reset(); // Reset forms when closing
        projectForm.reset();
    };

    addTaskBtn.addEventListener('click', () => openModal(taskModal));
    addProjectBtn.addEventListener('click', () => openModal(projectModal));

    closeModalButtons.forEach(button => {
        button.addEventListener('click', (e) => closeModal(e.target.closest('.modal')));
    });

    window.addEventListener('click', (e) => {
        if (e.target === taskModal) closeModal(taskModal);
        if (e.target === projectModal) closeModal(projectModal);
    });

    // --- Gestion des Tâches (CRUD) ---
    const renderTaskItem = (task) => {
        const li = document.createElement('li');
        li.classList.add('task-item');
        li.setAttribute('data-id', task.id);
        li.setAttribute('draggable', true); // Enable drag and drop
        if (task.completed) {
            li.classList.add('completed');
        }
        li.classList.add(`priority-${task.priority}`); // Add priority class for styling

        const project = projects.find(p => p.id === task.project);
        const projectName = project ? project.name : 'Aucun projet';

        li.innerHTML = `
            <div class="task-info">
                <input type="checkbox" ${task.completed ? 'checked' : ''}>
                <span class="task-title">${task.title}</span>
                <span class="task-meta">
                    <i class="fas fa-calendar-alt"></i> ${task.dueDate || 'Pas de date'}
                    ${task.category ? `<i class="fas fa-tag" style="margin-left: 10px;"></i> ${task.category}` : ''}
                    ${task.project ? `<i class="fas fa-project-diagram" style="margin-left: 10px;"></i> ${projectName}` : ''}
                </span>
            </div>
            <div class="task-actions">
                <button class="edit-task-btn" title="Modifier"><i class="fas fa-edit"></i></button>
                <button class="delete-task-btn" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;

        // Event Listeners for actions on the task item
        li.querySelector('input[type="checkbox"]').addEventListener('change', (e) => toggleTaskCompletion(task.id, e.target.checked));
        li.querySelector('.edit-task-btn').addEventListener('click', () => openModal(taskModal, task.id));
        li.querySelector('.delete-task-btn').addEventListener('click', () => deleteTask(task.id));

        return li;
    };

    const renderTasks = () => {
        allTasksList.innerHTML = '';
        const searchTerm = taskSearch.value.toLowerCase();
        const statusFilter = filterStatus.value;
        const sortOption = sortBy.value;

        let filteredTasks = tasks.filter(task => {
            const matchesSearch = task.title.toLowerCase().includes(searchTerm) || (task.description && task.description.toLowerCase().includes(searchTerm));
            const matchesStatus = statusFilter === 'all' || (statusFilter === 'completed' && task.completed) || (statusFilter === 'pending' && !task.completed);
            return matchesSearch && matchesStatus;
        });

        // Sorting
        if (sortOption === 'date') {
            filteredTasks.sort((a, b) => {
                const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31'); // Put no-date tasks at the end
                const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31');
                return dateA - dateB;
            });
        } else if (sortOption === 'priority') {
            const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
            filteredTasks.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
        }

        if (filteredTasks.length === 0) {
            allTasksList.innerHTML = '<p class="no-items">Aucune tâche trouvée pour ces critères.</p>';
        } else {
            filteredTasks.forEach(task => {
                allTasksList.appendChild(renderTaskItem(task));
            });
        }
        updateDashboard();
        updateNotifications();
    };

    const addTask = (e) => {
        e.preventDefault();
        const taskId = document.getElementById('task-id').value;
        const newTask = {
            id: taskId || generateUniqueId(),
            title: document.getElementById('task-title').value,
            description: document.getElementById('task-description').value,
            dueDate: document.getElementById('task-due-date').value,
            priority: document.getElementById('task-priority').value,
            category: document.getElementById('task-category').value,
            project: document.getElementById('task-project').value,
            completed: taskId ? tasks.find(t => t.id === taskId).completed : false // Keep completion status if editing
        };

        if (taskId) {
            // Edit existing task
            const index = tasks.findIndex(t => t.id === taskId);
            if (index !== -1) {
                tasks[index] = { ...tasks[index], ...newTask }; // Merge existing with new data
            }
        } else {
            // Add new task
            tasks.push(newTask);
        }
        saveToLocalStorage();
        updateProjectStats();
        renderTasks();
        closeModal(taskModal);
    };

    const toggleTaskCompletion = (id, isCompleted) => {
        const task = tasks.find(t => t.id === id);
        if (task) {
            task.completed = isCompleted;
            saveToLocalStorage();
            updateProjectStats();
            renderTasks(); // Re-render to update classes
            updateDashboard(); // Update dashboard stats
            updateNotifications(); // Update notification count
        }
    };

    const deleteTask = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer cette tâche ?')) {
            tasks = tasks.filter(task => task.id !== id);
            saveToLocalStorage();
            updateProjectStats();
            renderTasks();
            updateDashboard();
            updateNotifications();
        }
    };

    taskForm.addEventListener('submit', addTask);
    filterStatus.addEventListener('change', renderTasks);
    sortBy.addEventListener('change', renderTasks);
    taskSearch.addEventListener('input', renderTasks); // Event listener for search bar

    // --- Drag and Drop for Tasks ---
    let draggedItem = null;

    allTasksList.addEventListener('dragstart', (e) => {
        draggedItem = e.target.closest('.task-item');
        if (draggedItem) {
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', draggedItem.dataset.id); // Set data for transfer
            draggedItem.classList.add('dragging');
        }
    });

    allTasksList.addEventListener('dragover', (e) => {
        e.preventDefault(); // Necessary to allow drop
        const target = e.target.closest('.task-item');
        if (draggedItem && target && draggedItem !== target) {
            const boundingBox = target.getBoundingClientRect();
            const offset = boundingBox.y + (boundingBox.height / 2);
            if (e.clientY < offset) {
                allTasksList.insertBefore(draggedItem, target);
            } else {
                allTasksList.insertBefore(draggedItem, target.nextSibling);
            }
        }
    });

    allTasksList.addEventListener('drop', (e) => {
        e.preventDefault();
        // The DOM order is already changed by dragover.
        // To persist this order, you would need to:
        // 1. Get the new order of task IDs from the DOM.
        // 2. Update a 'sortOrder' property on your tasks array.
        // 3. Save the updated tasks array.
        // 4. Re-render based on this sortOrder.
        // For simplicity in this demo, the visual order will be maintained until a re-render.
    });

    allTasksList.addEventListener('dragend', () => {
        if (draggedItem) {
            draggedItem.classList.remove('dragging');
        }
        draggedItem = null;
    });

    // --- Gestion des Projets (CRUD) ---
    const renderProjectItem = (project) => {
        const div = document.createElement('div');
        div.classList.add('project-card');
        div.setAttribute('data-id', project.id);
        div.innerHTML = `
            <h3>${project.name}</h3>
            <p>${project.description || 'Pas de description.'}</p>
            <div class="project-stats">
                <span>Tâches: ${project.tasksCount}</span>
                <span>Terminées: ${project.completedTasks}</span>
            </div>
            <div class="project-actions">
                <button class="edit-project-btn" title="Modifier"><i class="fas fa-edit"></i></button>
                <button class="delete-project-btn" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        div.querySelector('.edit-project-btn').addEventListener('click', () => openModal(projectModal, null, project.id));
        div.querySelector('.delete-project-btn').addEventListener('click', () => deleteProject(project.id));
        return div;
    };

    const renderProjects = () => {
        projectListDiv.innerHTML = '';
        if (projects.length === 0) {
            projectListDiv.innerHTML = '<p class="no-items">Aucun projet pour le moment.</p>';
        } else {
            projects.forEach(project => {
                projectListDiv.appendChild(renderProjectItem(project));
            });
        }
        populateTaskCategoriesAndProjects(); // Update select options
    };

    const addProject = (e) => {
        e.preventDefault();
        const projectId = document.getElementById('project-id').value;
        const newProject = {
            id: projectId || generateUniqueId(),
            name: document.getElementById('project-name').value,
            description: document.getElementById('project-description').value,
            tasksCount: 0,
            completedTasks: 0
        };

        if (projectId) {
            const index = projects.findIndex(p => p.id === projectId);
            if (index !== -1) {
                projects[index] = { ...projects[index], ...newProject };
            }
        } else {
            projects.push(newProject);
        }
        saveToLocalStorage();
        updateProjectStats();
        renderProjects();
        closeModal(projectModal);
    };

    const deleteProject = (id) => {
        if (confirm('Êtes-vous sûr de vouloir supprimer ce projet ? Toutes les tâches associées seront également supprimées.')) {
            projects = projects.filter(p => p.id !== id);
            tasks = tasks.filter(task => task.project !== id); // Delete associated tasks
            saveToLocalStorage();
            renderProjects();
            renderTasks(); // Re-render tasks as some might be gone
            updateDashboard();
            updateNotifications();
        }
    };

    projectForm.addEventListener('submit', addProject);

    // --- Gestion des Catégories (CRUD) ---
    const renderCategoryItem = (categoryName) => {
        const li = document.createElement('li');
        li.classList.add('category-item');
        li.innerHTML = `
            <span>${categoryName}</span>
            <div class="category-actions">
                <button class="delete-category-btn" data-category="${categoryName}" title="Supprimer"><i class="fas fa-trash-alt"></i></button>
            </div>
        `;
        li.querySelector('.delete-category-btn').addEventListener('click', (e) => deleteCategory(e.target.dataset.category || e.target.closest('button').dataset.category));
        return li;
    };

    const renderCategories = () => {
        categoryListUl.innerHTML = '';
        if (categories.length === 0) {
            categoryListUl.innerHTML = '<p class="no-items">Aucune catégorie pour le moment.</p>';
        } else {
            categories.forEach(cat => {
                categoryListUl.appendChild(renderCategoryItem(cat));
            });
        }
        populateTaskCategoriesAndProjects(); // Update select options
    };

    const addCategory = () => {
        const newCatName = newCategoryInput.value.trim();
        if (newCatName && !categories.includes(newCatName)) {
            categories.push(newCatName);
            saveToLocalStorage();
            renderCategories();
            newCategoryInput.value = '';
        } else if (categories.includes(newCatName)) {
            alert('Cette catégorie existe déjà.');
        }
    };

    const deleteCategory = (categoryName) => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer la catégorie "${categoryName}" ? Les tâches associées perdront leur catégorie.`)) {
            categories = categories.filter(cat => cat !== categoryName);
            // Remove category from tasks that use it
            tasks.forEach(task => {
                if (task.category === categoryName) {
                    task.category = ''; // Or set to a default 'Uncategorized'
                }
            });
            saveToLocalStorage();
            renderCategories();
            renderTasks(); // Re-render tasks to reflect category change
            updateDashboard();
        }
    };

    addCategoryBtn.addEventListener('click', addCategory);
    newCategoryInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addCategory();
    });

    // --- Population des Selects de Formulaire (Catégories & Projets) ---
    const populateTaskCategoriesAndProjects = () => {
        // Populate Categories
        taskCategorySelect.innerHTML = '<option value="">Sélectionner une catégorie</option>';
        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            taskCategorySelect.appendChild(option);
        });

        // Populate Projects
        taskProjectSelect.innerHTML = '<option value="">Aucun projet</option>';
        projects.forEach(proj => {
            const option = document.createElement('option');
            option.value = proj.id;
            option.textContent = proj.name;
            taskProjectSelect.appendChild(option);
        });
    };

    // --- Tableau de Bord ---
    const updateDashboard = () => {
        const pendingTasksCount = tasks.filter(task => !task.completed).length;
        const completedTasksCount = tasks.filter(task => task.completed).length;
        const activeProjectsCount = projects.length;

        document.querySelector('.stat-card:nth-child(1) p').textContent = pendingTasksCount;
        document.querySelector('.stat-card:nth-child(2) p').textContent = completedTasksCount;
        document.querySelector('.stat-card:nth-child(3) p').textContent = activeProjectsCount;

        // Render upcoming tasks for dashboard (next 7 days)
        upcomingTasksList.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const upcoming = tasks.filter(task => {
            if (!task.dueDate || task.completed) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            // Only show tasks due today or in the future, up to 7 days from now
            return dueDate >= today && dueDate <= new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000));
        }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
        .slice(0, 5); // Show top 5 upcoming

        if (upcoming.length === 0) {
            upcomingTasksList.innerHTML = '<p class="no-items">Aucune tâche à venir.</p>';
        } else {
            upcoming.forEach(task => upcomingTasksList.appendChild(renderTaskItem(task)));
        }
    };

    // --- Notifications (compteur pour tâches en retard ou à venir très bientôt) ---
    const updateNotifications = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const overdueOrDueSoon = tasks.filter(task => {
            if (task.completed || !task.dueDate) return false;
            const dueDate = new Date(task.dueDate);
            dueDate.setHours(0, 0, 0, 0);
            // Tâches en retard (due date < today)
            // OU tâches à venir dans les 2 prochains jours (today <= due date <= today + 2 days)
            return dueDate < today || (dueDate >= today && dueDate <= new Date(today.getTime() + (2 * 24 * 60 * 60 * 1000)));
        }).length;

        notificationCount.textContent = overdueOrDueSoon;
        if (overdueOrDueSoon > 0) {
            notificationCount.style.display = 'block';
        } else {
            notificationCount.style.display = 'none';
        }
    };

    // --- Gestion du Thème ---
    themeSelect.addEventListener('change', (e) => {
        document.body.classList.toggle('dark-theme', e.target.value === 'dark');
        localStorage.setItem('theme', e.target.value);
    });

    const loadTheme = () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.classList.toggle('dark-theme', savedTheme === 'dark');
        themeSelect.value = savedTheme;
    };

    // --- Calendrier ---
    let currentCalendarDate = new Date(); // Stores the month currently displayed

    const renderCalendar = () => {
        calendarDaysGrid.innerHTML = '';
        currentMonthYearHeader.textContent = currentCalendarDate.toLocaleString('fr-FR', { month: 'long', year: 'numeric' });

        const year = currentCalendarDate.getFullYear();
        const month = currentCalendarDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();

        // Calculate offset for first day (0=Sunday, 1=Monday...)
        let startDay = firstDayOfMonth.getDay();
        startDay = startDay === 0 ? 6 : startDay - 1; // Adjust for Monday as first day of week (ISO)

        // Fill leading empty days
        for (let i = 0; i < startDay; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('calendar-day', 'empty');
            calendarDaysGrid.appendChild(emptyDay);
        }

        // Fill days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.innerHTML = `<span class="date-number">${day}</span>`;

            // Mark today
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (date.toDateString() === today.toDateString()) {
                dayElement.classList.add('today');
            }

            // Add tasks to the day
            const tasksOnThisDay = tasks.filter(task => {
                if (!task.dueDate) return false;
                const taskDueDate = new Date(task.dueDate);
                taskDueDate.setHours(0, 0, 0, 0);
                return taskDueDate.toDateString() === date.toDateString();
            });

            tasksOnThisDay.forEach(task => {
                const taskDiv = document.createElement('div');
                taskDiv.classList.add('calendar-task-item');
                // Add a priority class to the calendar task item as well
                taskDiv.classList.add(`priority-${task.priority}`);
                taskDiv.textContent = task.title;
                dayElement.appendChild(taskDiv);
            });

            calendarDaysGrid.appendChild(dayElement);
        }
    };

    prevMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1);
        renderCalendar();
    });

    // --- Initialisation au chargement de la page ---
    const init = () => {
        updateProjectStats(); // Ensure project stats are up-to-date initially
        loadTheme();
        showView('dashboard'); // Start on the dashboard
        renderTasks(); // Render tasks for the 'All Tasks' view
        renderProjects(); // Render projects for the 'Projects' view
        renderCategories(); // Render categories for the 'Categories' view
        renderCalendar(); // Render initial calendar
        updateDashboard(); // Update dashboard stats and upcoming tasks
        updateNotifications(); // Update notification count
    };

    init();
});
