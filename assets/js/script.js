// retrieve tasks and nextId from localStorage
let taskList = JSON.parse(localStorage.getItem('tasks'));

const addTask = $('#add-task');
const addNewTask = $('#add-new-task');
const taskDisplayEl = $('#task-display');
const taskNameInputEl = $('#task-title');
const taskDateInputEl = $('#due-date');
const taskDescInputEl = $('#task-description');

// generate a unique task id
function generateTaskId() {
    let uniqueId = crypto.randomUUID();
    return uniqueId;
}

// read and load tasks from local storage
function readTasksFromStorage() {
    if (!taskList) {
        taskList = [];
    }
    return taskList;
}

// save tasks to local storage
function saveTasksToStorage(taskList) {
    localStorage.setItem('tasks', JSON.stringify(taskList));
}

// create a card for new tasks
function createTaskCard(task) {
    const taskCard = $('<div>')
        .addClass('card task-card draggable my-3')
        .attr('data-task-id', task.id);
    const cardHeader = $('<div>').addClass('card-header h4').text(task.name);
    const cardBody = $('<div>').addClass('card-body');
    const cardDescription = $('<p>').addClass('card-text').text(task.desc);
    const cardDueDate = $('<p>').addClass('card-text').text(task.dueDate);
    const cardDeleteBtn = $('<button>')
        .addClass('btn btn-danger delete')
        .text('Delete')
        .attr('data-task-id', task.id);
    cardDeleteBtn.on('click', handleDeleteTask);

    // remove card colour when in 'done' lane
    if (task.dueDate && task.status !== 'done') {
        const now = dayjs();
        const taskDueDate = dayjs(task.dueDate, 'DD/MM/YYYY');

        // yellow task card for due today & not in 'done' lane
        if (now.isSame(taskDueDate, 'day')) {
            taskCard.addClass('bg-warning text-white');
        // red task card for past due & not in 'done' lane
        } else if (now.isAfter(taskDueDate)) {
            taskCard.addClass('bg-danger text-white');
            cardDeleteBtn.addClass('border-light');
        }
    }

    // update task card info
    cardBody.append(cardDescription, cardDueDate, cardDeleteBtn);
    taskCard.append(cardHeader, cardBody);

    return taskCard;
}

// print the task card in kanban lane
function renderTaskList() {
    const tasks = readTasksFromStorage();

    // Empty existing project cards out of the lanes
    const todoList = $('#todo-cards');
    todoList.empty();

    const inProgressList = $('#in-progress-cards');
    inProgressList.empty();

    const doneList = $('#done-cards');
    doneList.empty();

    // print task card in kanban lane based on status
    for (let task of tasks) {
        if (task.status === 'to-do') {
            todoList.append(createTaskCard(task));
        } else if (task.status === 'in-progress') {
            inProgressList.append(createTaskCard(task));
        } else if (task.status === 'done') {
            doneList.append(createTaskCard(task));
        }
    }

    // make task cards draggable
    $('.draggable').draggable({
        opacity: 0.7,
        zIndex: 100,
        // create duplicate of dragged card for improved visuals
        helper: function (e) {
            const original = $(e.target).hasClass('ui-draggable')
                ? $(e.target)
                : $(e.target).closest('.ui-draggable');
            return original.clone().css({
                width: original.outerWidth(),
            });
        },
    });
}

// add a new task
function handleAddTask(event) {
    event.preventDefault();

    // new task popup dialog
    $("#new-task-form").dialog({
        modal: true,
        width: 600,
        buttons: {
            "Add Task": function() {
                
                // retrieve form input values
                const taskName = taskNameInputEl.val().trim();
                const taskDate = taskDateInputEl.val(); // yyyy-mm-dd format
                const taskDesc = taskDescInputEl.val().trim();

                // save input values into task object
                const newTask = {
                    id: generateTaskId(),
                    name: taskName,
                    dueDate: taskDate,
                    desc: taskDesc,
                    status: 'to-do',
                };

                // load object existing array, add new task to end of loaded array
                const tasks = readTasksFromStorage();
                tasks.push(newTask);

                saveTasksToStorage(tasks);
                renderTaskList()
                
                // reset form values
                taskNameInputEl.val('');
                taskDateInputEl.val('');
                taskDescInputEl.val('');

                // close dialog box on form submit
                $(this).dialog('close');
            },
        }
    });
}

// delete a task
function handleDeleteTask() {
    const taskId = $(this).attr('data-task-id');
    const tasks = readTasksFromStorage();

    // remove object from task array based on unique id
    tasks.forEach((task) => {
        if (task.id === taskId) {
            tasks.splice(tasks.indexOf(task), 1);
        }
    });

    saveTasksToStorage(tasks);
    renderTaskList();
}

// drop a task into a new status lane
// * handleDrop
function handleDrop(event, ui) {
    const tasks = readTasksFromStorage();
    const taskId = ui.draggable[0].dataset.taskId;
    const newStatus = event.target.id;

    // update task status based on dropped lane
    for (let task of tasks) {
        if (task.id === taskId) {
            task.status = newStatus;
        }
    }

    localStorage.setItem('tasks', JSON.stringify(tasks));
    renderTaskList();
}


// on page load:
// render the task list, add event listeners, make lanes droppable, and make the due date field a date picker
$(document).ready(function () {
    addTask.on('click', handleAddTask)
    taskDisplayEl.on('click', '.btn-delete-task', handleDeleteTask);

    renderTaskList();

    // add date picker
    $('#due-date').datepicker({
        changeMonth: true,
        changeYear: true,
    });

    // make lanes droppable
    $('.lane').droppable({
        accept: '.draggable',
        drop: handleDrop,
    });
});
