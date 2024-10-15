   // Import necessary modules
    import {initializeApp} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
    import {
        getDatabase,
        ref,
        get,
        set,
        push,
        update,
        remove,
        onValue
    } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

    // Firebase configuration (same as Product Backlog)
    const firebaseConfig = {
        apiKey: "AIzaSyDicFj4DUKZo2iYXZN8tUE2FcMLqmQ_cgU",
        authDomain: "izuck-digital.firebaseapp.com",
        databaseURL: "https://izuck-digital-default-rtdb.asia-southeast1.firebasedatabase.app",
        projectId: "izuck-digital",
        storageBucket: "izuck-digital.appspot.com",
        messagingSenderId: "875586622876",
        appId: "1:875586622876:web:dab65a8d81690d7a18e459",
        measurementId: "G-1YRPZNH521"
    };

    // Initialize Firebase app
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    const sprintBoardRef = ref(database, 'sprintboard');
    const productBacklogRef = ref(database, 'productBacklog');

    window.getSprintFromFirebase = function (sprintId) {
        return get(ref(database, `sprintboard/${sprintId}`))
            .then((snapshot) => {
                if (snapshot.exists()) {
                    const sprintData = snapshot.val();
                    sprintData.key = sprintId;
                    return sprintData;
                } else {
                    console.error(`Sprint with ID ${sprintId} not found`);
                    return null;
                }
            })
            .catch((error) => {
                console.error("Error fetching sprint:", error);
                return null;
            });
    }

    // Function to fetch sprint board data
    window.fetchSprintBoard = async function () {
        try {
            const snapshot = await get(sprintBoardRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                window.renderSprintBoard(data);
            } else {
                console.log("No sprint data available");
            }
        } catch (error) {
            console.error("Error fetching sprint board:", error);
        }
    }

    window.sendFormDataToFirebase = async function () {
        try {
            const formData = getFormData();
            if (Object.values(formData).some(value => value === '')) {
                alert('Please fill in all fields');
                return;
            }

            await push(productBacklogRef, formData);
            console.log("Data saved successfully.")
            toggleEditPopup();
        } catch (error) {
            console.error("Error sending form data:", error);
        }
    }

    window.handleSaveProgress = async function () {
        const taskId = currentTaskId;
        const duration = parseFloat(document.getElementById('progressDuration').value);
        const date = document.getElementById('progressDate').value;

        const taskRef = ref(database, `productBacklog/${taskId}`);

        get(taskRef).then((snapshot) => {
            if (snapshot.exists()) {
                const task = snapshot.val();

                // Update or create progressLog
                const progressLog = task.progressLog || {};
                if (progressLog[date]) {
                    progressLog[date] += duration;
                } else {
                    progressLog[date] = duration;
                }

                const newTimespent = (task.timespent || 0) + duration;

                update(taskRef, {
                    timespent: newTimespent,
                    progressLog: progressLog,
                    timeModified: new Date().toLocaleString('en-GB', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', second: '2-digit'
                    }).replace(/\//g, '-')
                }).then(() => {
                    // Update the total time spent display
                    document.getElementById('totalTimeSpent').textContent = newTimespent.toFixed(2);
                });

                // Update the user's timespent field
                const userRef = ref(database, `users/${task.assignee}/timespent`);
                get(userRef).then((snapshot) => {
                    const userTimespent = snapshot.val() || {};
                    if (userTimespent[date]) {
                        userTimespent[date] += duration;
                    } else {
                        userTimespent[date] = duration;
                    }
                    update(userRef, userTimespent);
                });
            }
        });

        toggleProgressPopup();
    }

    function parseDate(dateString) {
        const parts = dateString.split(/[-, :]/);
        return new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4], parts[5]);
    }
async function createSprintCardAsync(sprint, key) {
    let totalStoryPoints = 0;
    let completedStoryPoints = 0;
    let dateStoryPoint = {};  // Dictionary to track story points by completion date

    // This is for the burndown chart
    let dates = [];
    let startDate = new Date(sprint.startTime);
    let endDate = new Date(sprint.endTime);

    while (startDate <= endDate) {
        dates.push(startDate.toLocaleDateString('en-GB').replace(/\//g, '-'));
        startDate.setDate(startDate.getDate() + 1);
    }

    console.log("*******:", dates);
    console.log("S", startDate, sprint.endDate);

    if (sprint.sprintTasks) {
        for (const taskId of sprint.sprintTasks) {
            const task = await fetchTaskDetails(taskId);
            if (task) {
                // Add total story points from the task
                totalStoryPoints += parseInt(task.storypoint);

                // If the task is completed, update completed story points and store by date
                if (task.status === 'Completed') {
                    completedStoryPoints += parseInt(task.storypoint);

                    let completedDate = parseDate(task.timeModified).toLocaleDateString('en-GB').replace(/\//g, '-');  // Assuming this is where the task's completion date is stored
                    console.log("here", completedDate, task.status, task.timeModified);
                    let storyPoints = task.storypoint;       // Story points of the completed task

                    // Check if the completed date is already in the dictionary
                    if (dateStoryPoint[completedDate]) {
                        // Accumulate story points for this date
                        dateStoryPoint[completedDate] += parseInt(storyPoints);
                    } else {
                        // Create a new entry in the dictionary with the completed date
                        dateStoryPoint[completedDate] = parseInt(storyPoints);
                    }
                }
            }
        }

        // At this point, `dateStoryPoint` contains the accumulated story points by completion date
        console.log("Story points by completion date:", dateStoryPoint);
    }



        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.setAttribute('data-sprint-id', key);

        const statusPill = `<div class="pill-button status-${sprint.status.toLowerCase().replace(/ /g, '-')}">${sprint.status}</div>`;
        const isActive = sprint.status === 'In progress' || sprint.status === 'Completed';
        const deleteButtonClasses = `dropdown-item text-danger delete-sprint`;
        const editButtonClasses = `dropdown-item text-primary edit-sprint${isActive ? ' disabled' : ''}`;
        console.log('isActive:', isActive);

        card.innerHTML = `
            <div class="card-header d-flex justify-content-between align-items-center">
                <h3 class="mg-clear">${sprint.title}</h3>
                <div>
                    <button class="burndown-chart-button btn-secondary btn " data-sprint-id="${key}">Burndown Chart</button>
                    <button class="sprint-backlog-button btn-secondary btn " data-sprint-id="${key}">Sprint Backlog</button>
                    <div class="dropdown d-inline-block">
                    <button class="btn btn-link three-dot-menu" type="button" id="dropdownMenu-${key}" data-bs-toggle="dropdown" aria-expanded="false">⋮</button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenu-${key}">
                        <li><a class="${deleteButtonClasses}" href="#" data-sprint-id="${key}">Delete</a></li>
                        <li><a class="${editButtonClasses}" href="#" data-sprint-id="${key}" ${isActive ? 'onclick="return false;"' : ''}>Edit</a></li>
    
                        </ul>
                    </div>
                </div>
            </div>
            <div class="card-body">
                <p>Total Story Points: ${totalStoryPoints}</p>
                <p>Completed Story Points: ${completedStoryPoints}</p>
                <p>Product Owner: ${sprint.productOwner}</p>
                <p>Scrum Master: ${sprint.scrumMaster}</p>
                <p>Team Members:</p>
                <div class="teamMembers-container">${renderTeamMembers(sprint.teamMembers)}</div>
                <p>Status: ${statusPill}</p>
                <p>Start: ${new Date(sprint.startTime).toLocaleString()}</p>
                <p>End: ${new Date(sprint.endTime).toLocaleString()}</p>
            </div>
        `;

        card.addEventListener('click', (event) => {
            if (!event.target.closest('.dropdown') && !event.target.classList.contains('sprint-backlog-button')) {
                if (event.target.classList.contains('burndown-chart-button')) {
                    console.log("Toggling burndown chart...")
                    toggleBurndownChartPopup(totalStoryPoints, completedStoryPoints, dateStoryPoint, dates);
                } else {
                    openSprintViewMode(sprint, key);
                }
            }
        });

        return card;
    }
    function convertToISO(dateString) {
        const parts = dateString.split(/[-/]/);
        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed in JavaScript
        const year = parseInt(parts[2], 10);

        return new Date(year, month, day).toISOString().split('T')[0];
        }

    async function renderSprintBoard(newData) {
        const container = document.getElementById('sprintCardsContainer');
        if (!container) {
            console.error('Sprint cards container not found');
            return;
        }

        // Clear the container first
        container.innerHTML = '';

        if (!newData || Object.keys(newData).length === 0) {
            const noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'No sprints added yet.';
            noDataMessage.style.textAlign = 'center';
            noDataMessage.style.padding = '20px';
            container.appendChild(noDataMessage);
            return;
        }

        // Use a Set to keep track of rendered sprint IDs
        const renderedSprintIds = new Set();

        for (const [key, sprint] of Object.entries(newData)) {
            if (!renderedSprintIds.has(key)) {
                try {
                    const card = await createSprintCardAsync(sprint, key);
                    container.appendChild(card);
                    renderedSprintIds.add(key);
                } catch (error) {
                    console.error(`Error creating card for sprint ${key}:`, error);
                }
            }
        }
    }


    let burndownChartInstance = null;

    function renderBurndownChart(totalStoryPoints, completedStoryPoints, dateStoryPoint, dates) {
        // Check if dates and dateStoryPoint are valid
        if (!Array.isArray(dates) || !dates.length) {
            console.error("Error: 'dates' is not a valid array or is empty.");
            return;
        }
        if (!dateStoryPoint || typeof dateStoryPoint !== 'object') {
            console.error("Error: 'dateStoryPoint' is not a valid object.");
            return;
        }

        const ctx = document.getElementById('burndownChart').getContext('2d');
        let remainingStoryPoints = totalStoryPoints;
        const today = new Date();
        const todayStr = today.toLocaleDateString('en-GB').replace(/\//g, '-'); // Format as YYYY-MM-DD for comparison
        const completedDataPoints = []

        dates.map((date) => {

            if (date <= todayStr) {  // Only include data until today
                console.log('date', date, 'today', todayStr, 'remaining', remainingStoryPoints);
                completedDataPoints.push({x: date, y: remainingStoryPoints});
                // Check if dateStoryPoint[date] is defined
                const completedPoints = dateStoryPoint[date] || 0; // Use 0 if undefined
                if (completedPoints > 0) {
                    remainingStoryPoints -= completedPoints; // Reduce points on completion
                    completedDataPoints.push({x: date, y: remainingStoryPoints});
                }
            } else {
                console.log('date', date, 'today', todayStr, 'remaining', remainingStoryPoints);
                completedDataPoints.push({x: date, y: null});
            }
        });

        console.log(completedDataPoints);

        // Create a diagonal line from totalStoryPoints to 0 for the guideline
        const diagonalPoints = dates.map((date, index) => {
            // Ensure progress decreases from totalStoryPoints to 0
            const progress = totalStoryPoints * (1 - index / (dates.length - 1));
            return Math.max(progress, 0); // Ensure it doesn't go below 0
        });

        // If a chart instance already exists, destroy it before creating a new one
        if (burndownChartInstance) {
            burndownChartInstance.destroy();
        }

        // Define the chart instance
        burndownChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                //labels: dates, // X-axis labels
                datasets: [
                    {
                        label: 'Story Points Remaining',
                        data: completedDataPoints,
                        fill: false,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1,
                        stepped: true

                    },
                    {
                        label: 'Guideline',
                        data: diagonalPoints,
                        fill: false,
                        borderColor: 'rgba(200, 200, 200, 1)', // Gray color for the guideline
                        borderDash: [], // Solid line
                        pointRadius: 0, // Hide the data points
                        tension: 0.1
                    }
                ]
            },
            options: {

                plugins: {
                    annotation: {
                        annotations: {}
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Storypoints'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        },
                        ticks: {
                            callback: function (value, index, values) {
                                // Show every second date
                                return index % 2 === 0 ? this.getLabelForValue(value) : '';
                            }
                        }
                    }
                }
            }
        });
        // Check if today is within the sprint's date range and add the today line if it is
        if (todayStr <= dates[dates.length - 1] && todayStr >= dates[0]) {
            burndownChartInstance.options.plugins.annotation.annotations.todayLine = {
                type: 'line',
                xMin: todayStr,
                xMax: todayStr,
                borderColor: 'rgba(128, 128, 128, 0.8)', // Gray color for today's vertical line
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                    content: 'Today', // Label content
                    enabled: true, // Enable the label
                    position: 'top', // Position the label
                }
            };
        }

        // Update the chart after adding annotations if any
        burndownChartInstance.update();
    }

    function getFormData() {
        return {
            title: document.getElementById('title').value,
            description: document.getElementById('description').value,
            assignee: document.getElementById('assignee').value,
            priority: document.getElementById('priority-input').value,
            status: document.getElementById('status-input').value,
            stage: document.getElementById('stage-input').value,
            storypoint: document.getElementById('storypoint').value,
            history: [{
                action: 'Created',
                timestamp: new Date().toLocaleString('en-GB', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', second: '2-digit'
                }).replace(/\//g, '-'),
                changes: 'Item created'
            }],
            timeModified: new Date().toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-'),
            timestamp: Date.now(),
            tags: window.tags || []
        };
    }

    // Function to handle adding a new sprint
    window.handleAddSprintClick = function (event) {
        event.preventDefault();
        console.log('Add sprint button clicked');
        setSprintFormMode('add');
    }

    function exitSprintBacklogMode() {
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
        <div class="bloc l-bloc" id="bloc-1">
            <div class="container bloc-lg">
                <div class="row align-items-center">
                    <div class="col">
                        <div id="sprintCardsContainer" class="sprint-cards-container">
                            <!-- Sprint cards will be dynamically added here -->
                        </div>
                        <div class="form-group mb-3">
                            <button class="btn btn-lg btn-9-style btn-c-7647" id="addSprintButton">
                                <span class="fa fa-plus"></span> Add Sprint
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;


        // Re-attach event listener for add sprint button
        document.getElementById('addSprintButton').addEventListener('click', handleAddSprintClick);

        fetchSprintBoard(); // This will now render the sprint board correctly
    }

    window.exitSprintKanbanMode = function () {
        exitSprintBacklogMode(); // Reuse the existing function to return to sprint board view
    };

    async function enterSprintBacklogMode(sprintId, sprintTitle) {
        currentSprintTasks = [];
        currentSprintId = sprintId;
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
        <div class="main-container">
                    <div class="tasks-container">
                <h2>Product Backlog</h2>
                <div id="backlogTasks" class="backlog-tasks"></div>
            </div>
            <div class="tasks-container">
                <h2 data-sprint-id="${sprintId}">${sprintTitle}</h2>
                <div id="sprintTasks" class="sprint-tasks"></div>
            </div>

        </div>
        <div class="sprint-backlog-buttons">
            <button id="cancelSprintBacklog" class="btn btn-secondary">Cancel</button>
            <button id="saveSprintBacklog" class="btn btn-primary">Save Changes</button>
        </div>
    `;

        const sprint = await getSprintFromFirebase(sprintId);
        if (sprint) {
            if (sprint.status === 'In progress' || sprint.status === 'Completed') {
                document.getElementById('saveSprintBacklog').style.display = 'none';
                disableDragAndDrop();
            }
            await fetchSprintTasks(sprintId);
            await fetchBacklogTasks();
            initDragAndDrop(sprintId, sprint.status);
            setupSprintBacklogRealtimeListener(sprintId);
        }
    }


async function fetchBacklogTasks() {
    const backlogContainer = document.getElementById('backlogTasks');
    if (!backlogContainer) {
        console.error('Backlog container not found');
        return;
    }
    const db = getDatabase();
    const backlogRef = ref(db, 'productBacklog');
    const snapshot = await get(backlogRef);
    if (snapshot.exists()) {
        const backlogTasks = snapshot.val();
        backlogContainer.innerHTML = '';
        Object.entries(backlogTasks).forEach(([key, task]) => {
            // Check if the task is not hidden and not part of current sprint tasks
            if (!task.hidden && !currentSprintTasks.includes(key)) {
                const taskCard = createTaskCard(key, task);
                backlogContainer.appendChild(taskCard);
            }
        });
    }
    initDragAndDrop();
}


    // Function to set sprint form mode
    function setSprintFormMode(mode, sprint = null) {
        const form = document.getElementById('sprintForm');
        const buttons = document.querySelector('.form-buttons');
        buttons.innerHTML = '';

        if (mode === 'edit' && sprint) {
            fillSprintFormWithData(sprint);
            buttons.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="toggleSprintPopup()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="updateSprint('${sprint.key}')">Update</button>
            `;

        } else if (mode === 'add') {
            form.reset();
            console.log('Adding new sprint');

            //prevent refresh of website
            form.addEventListener('submit', function (event) {
                event.preventDefault();
            });
            document.addEventListener("keyup", function (event) {

                if (event.key === 'Enter' && mode === 'add') {
                    saveSprint();
                    console.log('Sprint saved with enter key');
                    mode = 'view';
                }
            });

            setDefaultSprintFormValues();
            window.teamMembers = [];
            renderPopupTeamMembers();
            buttons.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="toggleSprintPopup()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveSprint()">Save Sprint</button>
            `;
        }
        isSprintUpdated = false;
        toggleSprintPopup();
    }

    // Function to fill sprint form with data
    function fillSprintFormWithData(sprint) {
        const form = document.getElementById('sprintForm');
        form.elements['sprintTitle'].value = sprint.title || '';
        form.elements['sprintDescription'].value = sprint.description || '';
        form.elements['productOwner'].value = sprint.productOwner || '';
        form.elements['scrumMaster'].value = sprint.scrumMaster || '';
        form.elements['sprintStartTime'].value = sprint.startTime || '';
        form.elements['sprintEndTime'].value = sprint.endTime || '';
        window.teamMembers = sprint.teamMembers || [];
        renderPopupTeamMembers();

        // Update the status display
        const statusContainer = form.querySelector('#sprintStatus');
        statusContainer.innerHTML = `<div class="pill-button status-${sprint.status.toLowerCase().replace(/ /g, '-')}">${sprint.status}</div>`;
    }

    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
        setupSprintRealtimeListener();


        // Event delegation for delete and edit buttons
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-sprint')) {
                event.preventDefault();
                const sprintId = event.target.getAttribute('data-sprint-id');
                showDeleteConfirmation(sprintId);
            } else if (event.target.classList.contains('edit-sprint')) {
                event.preventDefault();
                const sprintId = event.target.getAttribute('data-sprint-id');
                editSprint(sprintId);
            }
        });

        // Close popup when clicking outside
        document.getElementById('overlay-sprint').addEventListener('click', (event) => {
            if (event.target === document.getElementById('overlay-sprint')) {
                toggleSprintPopup();
                hideTeamMemberSelectionPopup();
            }
        });

        // Event delegation for delete and edit buttons
        document.addEventListener('click', (event) => {
            if (event.target.classList.contains('edit-item')) {
                event.preventDefault();
                event.stopPropagation();
                const itemId = event.target.getAttribute('data-task-id');
                console.log('Edit button clicked for item:', itemId);
                get(ref(database, `productBacklog/${itemId}`)).then((snapshot) => {
                    if (snapshot.exists()) {
                        const item = snapshot.val();
                        item.key = itemId;
                        editTaskFromViewMode(item);
                    }
                }).catch(console.error);
            }
        });

        document.getElementById('overlay-task').addEventListener('click', (event) => {
            if (event.target === document.getElementById('overlay-task')) {
                toggleEditPopup();
                hideTagSelectionPopup();
            }
        });

        document.getElementById('progress-button').addEventListener('click', (event) => {
            if (event.target === document.getElementById('progress-button')) {
                toggleProgressPopup();
            }
        });

        document.getElementById('filterButton').addEventListener('click', (event) => {
            console.log("event listener filter ")
            if (event.target === document.getElementById('filterButton')) {
                toggleFilterTimeSpentPopup();
            }
        });

    });


    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-item')) {
            event.preventDefault();
            const itemId = event.target.getAttribute('data-task-id');
            get(ref(database, `productBacklog/${itemId}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    const item = snapshot.val();
                    item.key = itemId;
                    setFormMode('edit', item);
                }
            }).catch(console.error);
        }
    });

    // Function to handle update item
    window.updateSprintBacklogItem = async function (itemId) {
        try {
            const formData = getFormDataForUpdate(itemId);
            const currentData = await get(ref(database, `productBacklog/${itemId}`));

            if (currentData.exists()) {
                const oldStatus = currentData.val().status;
                const newStatus = formData.status;

                // Get the current user's username from localStorage
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                const username = currentUser ? currentUser.username : 'Unknown User';

                const changes = getChanges(currentData.val(), formData);
                const updatedData = updateItemHistory(currentData.val(), formData, changes, username);
                await update(ref(database, `productBacklog/${itemId}`), updatedData);
                console.log('Data updated successfully');

                if (oldStatus !== "Completed" && newStatus === "Completed") {
                    showEncouragingMessage(getRandomMessage());
                }

                if (document.querySelector('.kanban-container')) {
                    const oldColumn = document.querySelector(`.task-card[data-task-id="${itemId}"]`).parentNode;
                    oldColumn.removeChild(document.querySelector(`.task-card[data-task-id="${itemId}"]`));
                    addTaskToColumn(newStatus, formData, itemId);
                } else {
                    await fetchSprintTasks(currentSprintId);
                }
                setFormMode('edit', itemId);

                toggleEditPopup();
            }
        } catch (error) {
            console.error("Error updating data:", error);
        }
    }

    // Function to update a sprint
    window.updateSprint = async function (sprintId) {
        try {
            const sprintData = getSprintFormDataForUpdate(sprintId);
            if (validateSprintData(sprintData)) {
                await update(ref(database, `sprintboard/${sprintId}`), sprintData);
                console.log('Sprint updated successfully');
                toggleSprintPopup();
                // Remove the event listener to prevent multiple updates
            }
        } catch (error) {
            console.error("Error updating sprint:", error);
        }
    }

    function getFormDataForUpdate(itemId) {
        const form = document.getElementById('backlogForm');
        return {
            title: form.elements['title'].value,
            description: form.elements['description'].value,
            assignee: form.elements['assignee'].value,
            priority: document.getElementById('priority-input').value,
            status: document.getElementById('status-input').value,
            stage: document.getElementById('stage-input').value,
            storypoint: form.elements['storypoint'].value,
            timeCreated: form.elements['timeCreated'].value,
            tags: window.tags || [],
            timeModified: new Date().toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-'),
        };
    }

    function updateItemHistory(currentData, formData, changes, username) {
        if (!currentData.history) currentData.history = [];
        currentData.history.push({
            action: 'Modified',
            timestamp: new Date().toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-'),
            changes: changes,
            user: username
        });

        formData.history = currentData.history;
        return formData;
    }


    async function enterSprintKanbanMode(sprintId, sprintTitle) {
        currentSprintId = sprintId;
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = `
        <div class="kanban-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2>${sprintTitle} - Kanban Board</h2>

        </div>
        <button id="toggleViewButton" class="btn btn-secondary" style="display: block; margin: 20px auto;">List View</button>
        <div id="kanbanContainer" class="kanban-container" style="display: flex; justify-content: space-between; padding: 20px;">
            <div class="kanban-column" style="width: 30%; min-height: 500px; border: 1px solid #ddd; border-radius: 20px; overflow: hidden;">
                <h3 style="color: black; text-align: center; height: 100px; line-height: 100px; background-color: #FFB7B7; margin: 0;">Not started</h3>
                <div id="not-started-tasks" style="padding: 10px; background-color: white;"></div>
            </div>
            <div class="kanban-column" style="width: 30%; min-height: 500px; border: 1px solid #ddd; border-radius: 20px; overflow: hidden;">
                <h3 style="color: black; text-align: center; height: 100px; line-height: 100px; background-color: #E3E649; margin: 0;">In progress</h3>
                <div id="in-progress-tasks" style="padding: 10px; background-color: white;"></div>
            </div>
            <div class="kanban-column" style="width: 30%; min-height: 500px; border: 1px solid #ddd; border-radius: 20px; overflow: hidden;">
                <h3 style="color: black; text-align: center; height: 100px; line-height: 100px; background-color: #7EBF60; margin: 0;">Completed</h3>
                <div id="completed-tasks" style="padding: 10px; background-color: white;"></div>
            </div>
        </div>
        <button class="btn btn-secondary" style="display: block; margin: 20px auto;" onclick="exitSprintKanbanMode()">Back</button>
    `;

        await fetchTasksForKanban(sprintId);

        // Initialize the toggle button functionality
        const toggleButton = document.getElementById('toggleViewButton');
        if (toggleButton) {
            window.isKanbanView = true; // Default to Kanban view
            toggleButton.addEventListener('click', toggleView);
        } else {
            console.error('Toggle view button not found');
        }
    }

    // Add this function to handle the view toggle
    function toggleView() {
        const kanbanContainer = document.getElementById('kanbanContainer');
        const toggleButton = document.getElementById('toggleViewButton');

        if (window.isKanbanView) {
            // Switch to List View
            kanbanContainer.innerHTML = '<div id="listViewContainer"></div>';
            toggleButton.textContent = 'Kanban View';
            renderListView();
        } else {
            // Switch back to Kanban View
            kanbanContainer.innerHTML = `
            <div class="kanban-column" style="width: 30%; min-height: 500px; border: 1px solid #ddd; border-radius: 20px; overflow: hidden;">
                <h3 style="color: black; text-align: center; height: 100px; line-height: 100px; background-color: #FFB7B7; margin: 0;">Not started</h3>
                <div id="not-started-tasks" style="padding: 10px; background-color: white;"></div>
            </div>
            <div class="kanban-column" style="width: 30%; min-height: 500px; border: 1px solid #ddd; border-radius: 20px; overflow: hidden;">
                <h3 style="color: black; text-align: center; height: 100px; line-height: 100px; background-color: #E3E649; margin: 0;">In progress</h3>
                <div id="in-progress-tasks" style="padding: 10px; background-color: white;"></div>
            </div>
            <div class="kanban-column" style="width: 30%; min-height: 500px; border: 1px solid #ddd; border-radius: 20px; overflow: hidden;">
                <h3 style="color: black; text-align: center; height: 100px; line-height: 100px; background-color: #7EBF60; margin: 0;">Completed</h3>
                <div id="completed-tasks" style="padding: 10px; background-color: white;"></div>
            </div>
        `;
            toggleButton.textContent = 'List View';
            fetchTasksForKanban(currentSprintId);
        }

        window.isKanbanView = !window.isKanbanView;
    }

    // Add this function to render the List View
    async function renderListView() {
        const listViewContainer = document.getElementById('listViewContainer');
        const tasks = await getAllTasksForSprint(currentSprintId);

        // Sort tasks by story points (highest to lowest) and then alphabetically
        tasks.sort((a, b) => {
            if (b.storypoint !== a.storypoint) {
                return b.storypoint - a.storypoint;
            }
            return a.title.localeCompare(b.title);
        });

        listViewContainer.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = createTaskCard(task.id, task);
            listViewContainer.appendChild(taskElement);
        });
    }

    // Add this function to get all tasks for a sprint
    async function getAllTasksForSprint(sprintId) {
        const snapshot = await get(ref(database, `sprintboard/${sprintId}/sprintTasks`));
        if (snapshot.exists()) {
            const taskIds = snapshot.val();
            const tasks = [];
            for (const taskId of taskIds) {
                const task = await fetchTaskDetails(taskId);
                if (task) {
                    tasks.push({...task, id: taskId});
                }
            }
            return tasks;
        }
        return [];
    }


    async function fetchTasksForKanban(sprintId) {
        const snapshot = await get(ref(database, `sprintboard/${sprintId}/sprintTasks`));
        if (snapshot.exists()) {
            const taskIds = snapshot.val();
            const notStartedTasks = [];
            const inProgressTasks = [];
            const completedTasks = [];

            for (const taskId of taskIds) {
                const task = await fetchTaskDetails(taskId);
                if (task) {
                    switch (task.status.toLowerCase()) {
                        case 'not started':
                            notStartedTasks.push({...task, id: taskId});
                            break;
                        case 'in progress':
                            inProgressTasks.push({...task, id: taskId});
                            break;
                        case 'completed':
                            completedTasks.push({...task, id: taskId});
                            break;
                        default:
                            console.warn(`Task ${taskId} has unknown status: ${task.status}`);
                    }
                }
            }

            renderKanbanColumn('not-started-tasks', notStartedTasks);
            renderKanbanColumn('in-progress-tasks', inProgressTasks);
            renderKanbanColumn('completed-tasks', completedTasks);
        }
    }


    function renderKanbanColumn(columnId, tasks) {
        const column = document.getElementById(columnId);
        column.innerHTML = ''; // Clear existing tasks
        tasks.forEach(task => {
            const taskCard = createKanbanTaskCard(task, task.id);
            column.appendChild(taskCard);
        });
    }


    function createKanbanTaskCard(task, taskId) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('data-task-id', taskId);
        card.style.margin = '10px';
        card.style.padding = '10px';
        card.style.backgroundColor = 'white';
        card.style.borderRadius = '5px';
        card.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';

        const tags = task.tags ? task.tags.map(tag => `<span class="tag" style="background-color: ${tag.color};">${tag.name}</span>`).join('') : '';

        card.innerHTML = `
            <div class="d-flex justify-content-between align-items-center">
                <h4 class="mg-clear mb-0">${task.title}</h4>
                <div class="dropdown d-inline-block">
                    <button class="btn btn-link three-dot-menu" type="button" data-bs-toggle="dropdown" aria-expanded="false">⋮</button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item text-primary edit-item" href="#" data-task-id="${taskId}">Edit</a></li>
                    </ul>
                </div>
            </div>
            <div class="card-body">
            <p>Priority:</p>
            <button class="btn btn-secondary me-2 card-tag" disabled style="background-color: ${getPriorityColor(task.priority)}">${task.priority}</button>
            <p>Tags: </p>
            <p>${tags}</p>
            <p>Storypoint: ${task.storypoint}</p>
        </div>
        `;

        card.addEventListener('click', (event) => {
            if (!event.target.closest('.dropdown')) {
                openTaskViewMode(task, taskId);
            }
        });

        return card;
    }

    document.addEventListener('click', async function (event) {
        if (event.target.classList.contains('burndown-chart-button')) {
            console.log('Burndown Chart button clicked');
        }
    });

    document.addEventListener('click', async function (event) {
        if (event.target.classList.contains('sprint-backlog-button')) {
            console.log('Sprint Backlog button clicked');
            const sprintId = event.target.getAttribute('data-sprint-id');
            const sprintTitle = event.target.closest('.card').querySelector('h3').textContent;
            const sprintStatus = await getSprintStatusFromFirebase(sprintId);
            console.log('Sprint status:', sprintStatus);
            if (sprintStatus === 'Not started') {
                await enterSprintBacklogMode(sprintId, sprintTitle);
            } else if (sprintStatus === 'In progress' || sprintStatus === 'Completed') {
                await enterSprintKanbanMode(sprintId, sprintTitle);
            } else {
                console.error('Unknown sprint status:', sprintStatus);
            }
        }
    });


    function getSprintStatusFromFirebase(sprintId) {
        return get(ref(database, `sprintboard/${sprintId}/status`))
            .then((snapshot) => {
                return snapshot.exists() ? snapshot.val() : null;
            })
            .catch((error) => {
                console.error("Error fetching sprint status:", error);
                return null;
            });
    }

    function addTaskToColumn(status, task, taskId) {
        const columnId = status.toLowerCase() === 'not started' ? 'not-started-tasks' :
            status.toLowerCase() === 'in progress' ? 'in-progress-tasks' :
                'completed-tasks';
        const column = document.getElementById(columnId);
        if (column) {
            const existingTask = column.querySelector(`[data-task-id="${taskId}"]`);
            if (existingTask) {
                existingTask.remove();
            }
            const taskCard = createKanbanTaskCard(task, taskId);
            column.appendChild(taskCard);
        } else {
            console.error(`Column not found for status: ${status}`);
        }
    }


    function openTaskViewMode(task, taskId) {
        console.log('pass');
        //setFormMode('view', { ...task, key: taskId });
    }

    // Function to get changes
    function getChanges(oldData, newData) {
        const changes = [];
        for (const key in newData) {
            if (key !== 'timeModified' && key !== 'timeCreated' && key !== 'history' && JSON.stringify(oldData[key]) !== JSON.stringify(newData[key])) {
                changes.push(`${key} updated`);
            }
        }

        // Format the changes text
        if (changes.length > 1) {
            return changes.join(', ');
        } else if (changes.length === 1) {
            return changes[0];
        } else {
            return 'No changes';
        }
    }


    // Function to set default sprint form values
    function setDefaultSprintFormValues() {
        const statusContainer = document.getElementById('sprintStatus');
        statusContainer.innerHTML = '<div class="pill-button status-not-started">Not started</div>';
    }

    // Function to toggle sprint popup
    window.toggleSprintPopup = function () {
        const popup = document.getElementById('sprintFormPopup');
        const overlay = document.getElementById('overlay-sprint');
        popup.classList.toggle('open');
        overlay.classList.toggle('open');

        if (!popup.classList.contains('open')) {
            // Reset form state

            const form = document.getElementById('sprintForm');
            form.reset();
            Array.from(form.elements).forEach(el => el.disabled = false);
        }
    }

    // Function to toggle progress popup
    window.toggleProgressPopup = function () {
        const popup = document.getElementById('progress-popup');
        const overlay = document.getElementById('overlay-progress');
        popup.classList.toggle('open');
        overlay.style.display = popup.classList.contains('open') ? 'block' : 'none';

        if (popup.classList.contains('open')) {
            fetchAndDisplayProgressData(currentTaskId);
        } else {
            // Reset form state
            const form = document.getElementById('progressForm');
            form.reset();
        }
    }

    window.fetchAndDisplayProgressData = async function (taskId, startDate = null, endDate = null, reset = false) {
        const taskRef = ref(database, `productBacklog/${taskId}`);
        const snapshot = await get(taskRef);

        if (snapshot.exists()) {
            const task = snapshot.val();
            const progressLog = task.progressLog || {};

            let dates = Object.keys(progressLog).sort();
            let durations = dates.map(date => progressLog[date]);

            if (!reset && startDate && endDate) {
                const filteredData = filterDataByDateRange(dates, durations, startDate, endDate);
                dates = filteredData.dates;
                durations = filteredData.durations;
            }

            const totalTimeSpent = durations.reduce((sum, duration) => sum + duration, 0);

            renderProgressChart(dates, durations);

            document.getElementById('totalTimeSpent').textContent = totalTimeSpent.toFixed(2);
        } else {
            console.log("No progress data available");
        }
    }

    function renderProgressChart(dates, durations) {
        const ctx = document.getElementById('progressChart').getContext('2d');

        if (window.progressChart instanceof Chart) {
            window.progressChart.data.labels = dates;
            window.progressChart.data.datasets[0].data = durations;
            window.progressChart.update();
        } else {
            window.progressChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: dates,
                    datasets: [{
                        label: 'Time Spent (hours)',
                        data: durations,
                        borderColor: 'rgb(75, 192, 192)',
                        tension: 0.1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                            title: {
                                display: true,
                                text: 'Date'
                            }
                        },
                        y: {
                            title: {
                                display: true,
                                text: 'Duration (hours)'
                            },
                            beginAtZero: true
                        }
                    }
                }
            });
        }
    }

    window.toggleBurndownChartPopup = function (totalStoryPoints, completedStoryPoints, dateStoryPoint, dates) {
        const popup = document.getElementById('burndown-chart-popup');
        const overlay = document.getElementById('overlay-burndown-chart');
        popup.classList.toggle('open');
        overlay.classList.toggle('open');
        console.log("Popup visibility:", popup.classList.contains('open'));
        renderBurndownChart(totalStoryPoints, completedStoryPoints, dateStoryPoint, dates);

        if (!popup.classList.contains('open')) {
            // Reset form state
            const form = document.getElementById('burndownChartForm');
            form.reset();
            Array.from(form.elements).forEach(el => el.disabled = false);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        //fetchSprintBoard();
        document.getElementById('filterButton').addEventListener('click', showFilterTimeSpentPopup);
    });

    document.addEventListener('DOMContentLoaded', () => {
        //setupSprintBacklogRealtimeListener();
        document.getElementById('filterButton').addEventListener('click', showFilterTimeSpentPopup);
    });

    let toggleInProgress = false;
    let isOverlayOpen = false;
    window.toggleEditPopup = function () {
        if (toggleInProgress) {
            console.log('Toggle already in progress, ignoring');
            return;
        }

        toggleInProgress = true;

        console.log('Toggle Edit Popup called');
        const popup = document.getElementById('editTaskPopupForm');
        const overlay = document.getElementById('overlay-task');

        if (!popup || !overlay) {
            console.error('Popup or overlay element not found');
            toggleInProgress = false;
            return;
        }

        console.log('Popup Before Toggle:', popup.classList.contains('open'));
        popup.classList.toggle('open');

        // Only toggle the overlay if its state doesn't match the popup's state
        if (popup.classList.contains('open') !== isOverlayOpen) {
            isOverlayOpen = !isOverlayOpen;
            overlay.classList.toggle('open');
        }

        console.log('Popup After Toggle:', popup.classList.contains('open'));

        if (popup.classList.contains('open')) {
            popup.style.display = 'block';
            overlay.style.display = 'block';
        } else {
            popup.style.display = 'none';
            overlay.style.display = 'none';
            setFormMode('edit');
        }

        console.log('Popup final display:', window.getComputedStyle(popup).display);
        console.log('Overlay final display:', window.getComputedStyle(overlay).display);

        // Reset the toggle flag after a short delay
        setTimeout(() => {
            toggleInProgress = false;
        }, 100);
    }

    // Function to save a new sprint
    window.saveSprint = async function () {
        try {
            const sprintData = getSprintFormData();
            if (Object.values(sprintData).some(value => value === '')) {
                alert('Please fill in all fields');
                return;
            }

            await push(sprintBoardRef, sprintData);
            console.log('Sprint saved successfully');
            toggleSprintPopup();
        } catch (error) {
            console.error("Error saving sprint:", error);
        }
    }

    // Function to get sprint form data
    function getSprintFormData() {
        const form = document.getElementById('sprintForm');
        const statusElement = document.querySelector('#sprintStatus .pill-button');
        return {
            title: form.elements['sprintTitle'].value,
            description: form.elements['sprintDescription'].value,
            productOwner: form.elements['productOwner'].value,
            scrumMaster: form.elements['scrumMaster'].value,
            teamMembers: window.teamMembers || [],
            startTime: form.elements['sprintStartTime'].value,
            endTime: form.elements['sprintEndTime'].value,
            status: calculateSprintStatus(form.elements['sprintStartTime'].value, form.elements['sprintEndTime'].value)
        };
    }


    // Function to delete a sprint
    window.deleteSprint = async function (sprintId) {
        try {
            await remove(ref(database, `sprintboard/${sprintId}`));
            console.log("Sprint deleted successfully");
        } catch (error) {
            console.error("Error deleting sprint:", error);
        }
    }

    function setupSprintBacklogRealtimeListener(sprintId) {
        const productBacklogRef = ref(database, 'productBacklog');
        onValue(productBacklogRef, (snapshot) => {
            const data = snapshot.val() || {};
            fetchSprintTasks(sprintId).then(() => {
                const sprintTasksContainer = document.getElementById('sprintTasks');
                sprintTasksContainer.innerHTML = '';
                for (const taskId of currentSprintTasks) {
                    const task = data[taskId];
                    if (task) {
                        const taskCard = createTaskCard(taskId, task);
                        sprintTasksContainer.appendChild(taskCard);
                    }
                }
            });
        });
    }


    document.addEventListener('DOMContentLoaded', () => {
        document.getElementById('addSprintButton').addEventListener('click', handleAddSprintClick);
    });

    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('.btn-lg.btn-9-style').addEventListener('click', handleAddSprintClick);
        initDragAndDrop();
    });

    document.addEventListener('DOMContentLoaded', () => {
        const overlayBurndownChart = document.getElementById('overlay-burndown-chart');
        overlayBurndownChart.addEventListener('click', (event) => {
            if (event.target === overlayBurndownChart) {
                toggleBurndownChartPopup();
            }
        });
    });

    // Event delegation for delete and edit buttons
    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-sprint')) {
            event.preventDefault();
            const sprintId = event.target.getAttribute('data-sprint-id');
            get(ref(database, `sprintboard/${sprintId}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    const sprint = snapshot.val();
                    sprint.key = sprintId;
                    setSprintFormMode('edit', sprint);
                }
            }).catch(console.error);
        }
    });

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.card');
        if (card && !event.target.closest('.dropdown, .btn-link')) {
            const sprintId = card.getAttribute('data-sprint-id');
            if (sprintId) {
                getSprintFromFirebase(sprintId).then((sprint) => {
                    if (sprint) {
                        sprint.key = sprintId;
                        openSprintViewMode(sprint, sprintId);
                    }
                }).catch(console.error);
            }
        }
    });

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.task-card');
        if (card && !event.target.closest('.dropdown, .btn-link')) {
            const itemId = card.getAttribute('data-task-id');
            if (itemId) {
                get(ref(database, `productBacklog/${itemId}`)).then((snapshot) => {
                    if (snapshot.exists()) {
                        const item = snapshot.val();
                        item.key = itemId;
                        openFormInViewMode(item);
                    }
                }).catch(console.error);
            }
        }
    });


    document.addEventListener('click', (event) => {
        const taskCard = event.target.closest('.task-card');
        if (taskCard) {
            const taskId = taskCard.getAttribute('data-task-id');
            if (taskId) {
                currentTaskId = taskId;
                console.log('Selected task ID:', currentTaskId);
            }
        }
    });

    // Set up real-time listener for sprint board
    function setupSprintRealtimeListener() {
        onValue(sprintBoardRef, (snapshot) => {
            const data = snapshot.val() || {};
            if (document.getElementById('sprintCardsContainer')) {
                window.renderSprintBoard(data);
            }
        });
    }


    async function fetchTaskDetails(taskId) {
        const taskRef = ref(database, `productBacklog/${taskId}`);
        const snapshot = await get(taskRef);
        return snapshot.exists() ? snapshot.val() : null;
    }

async function saveSprintBacklog() {
    const sprintTasks = Array.from(document.querySelectorAll('#sprintTasks .task-card'))
        .map(card => card.getAttribute('data-task-id'));
    const sprintIdElement = document.querySelector('h2[data-sprint-id]');
    const sprintId = sprintIdElement.getAttribute('data-sprint-id');
    console.log('Sprint ID:', sprintId);
    if (!sprintId) {
        console.error('Sprint ID not found');
        return;
    }

    const db = getDatabase();
    const sprintRef = ref(db, `sprintboard/${sprintId}/sprintTasks`);

    try {
        // Save the sprint tasks
        await set(sprintRef, sprintTasks);
        console.log('Sprint tasks saved successfully');

        // Set hidden key to true for each backlog item
        const updates = {};
        sprintTasks.forEach(taskId => {
            updates[`productBacklog/${taskId}/hidden`] = true;
        });

        await update(ref(db), updates);
        console.log('Backlog items updated to hidden');

        // Do not remove tasks from backlog
        exitSprintBacklogMode();
    } catch (error) {
        console.error('Error saving sprint tasks:', error);
    }
}


    window.getAllSprintsFromFirebase = async function () {
        try {
            const snapshot = await get(sprintBoardRef);
            return snapshot.val();
        } catch (error) {
            console.error("Error fetching all sprints:", error);
            return null;
        }
    }

    document.addEventListener('click', (event) => {
        if (event.target.id === 'saveSprintBacklog') {
            saveSprintBacklog();
        } else if (event.target.id === 'cancelSprintBacklog') {
            exitSprintBacklogMode();
        }
    });

    let currentSprintTasks = [];

    async function fetchSprintTasks(sprintId) {
        const sprintContainer = document.getElementById('sprintTasks');
        if (!sprintContainer) {
            console.error('Sprint tasks container not found');
            return;
        }

        const db = getDatabase();
        const sprintRef = ref(db, `sprintboard/${sprintId}`);
        const snapshot = await get(sprintRef);

        if (snapshot.exists()) {
            const sprint = snapshot.val();
            const sprintTasks = sprint.sprintTasks || [];
            currentSprintTasks = sprintTasks; // Store the current sprint tasks
            sprintContainer.innerHTML = '';

            for (const taskId of sprintTasks) {
                const task = await fetchTaskDetails(taskId);
                if (task) {
                    const taskCard = createTaskCard(taskId, task, sprint.status);
                    sprintContainer.appendChild(taskCard);
                }
            }

            await fetchBacklogTasks();
            initDragAndDrop();
        } else {
            console.error('Sprint not found');
        }
    }


    function initDragAndDrop() {
        const sprintIdElement = document.querySelector('.tasks-container h2[data-sprint-id]');
        if (!sprintIdElement) {
            console.error('Sprint ID element not found');
            return;
        }
        const sprintId = sprintIdElement.getAttribute('data-sprint-id');

        getSprintFromFirebase(sprintId).then(sprint => {
            if (!sprint) {
                console.error('Sprint data not found');
                return;
            }

            if (sprint.status === 'In progress' || sprint.status === 'Completed') {
                disableDragAndDrop();
                return;
            }

            // Rest of the drag and drop initialization code
            const containers = document.querySelectorAll('#sprintTasks, #backlogTasks');

            containers.forEach(container => {
                container.addEventListener('dragover', e => {
                    e.preventDefault();
                    const afterElement = getDragAfterElement(container, e.clientY);
                    const draggable = document.querySelector('.dragging');
                    if (draggable && draggable !== afterElement) {
                        if (afterElement == null) {
                            container.appendChild(draggable);
                        } else {
                            container.insertBefore(draggable, afterElement);
                        }
                    }
                });

                container.addEventListener('dragenter', e => {
                    e.preventDefault();
                    container.classList.add('drag-over');
                });

                container.addEventListener('dragleave', () => {
                    container.classList.remove('drag-over');
                });

                container.addEventListener('drop', e => {
                    e.preventDefault();
                    container.classList.remove('drag-over');
                    const draggable = document.querySelector('.dragging');
                    if (draggable) {
                        draggable.parentNode.removeChild(draggable);
                        container.appendChild(draggable);
                        draggable.classList.remove('dragging');
                        updateTaskStatus(draggable.getAttribute('data-task-id'), container.id);
                    }
                });
            });

            const draggables = document.querySelectorAll('.task-card');
            draggables.forEach(draggable => {
                draggable.setAttribute('draggable', 'true');
                draggable.addEventListener('dragstart', () => {
                    draggable.classList.add('dragging');
                });
                draggable.addEventListener('dragend', () => {
                    draggable.classList.remove('dragging');
                });
            });
        }).catch(error => {
            console.error('Error initializing drag and drop:', error);
        });
    }

    function disableDragAndDrop() {
        const taskCards = document.querySelectorAll('.task-card');
        taskCards.forEach(card => {
            card.setAttribute('draggable', 'false');
            card.classList.add('disabled');
        });
    }


    function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            if (offset < 0 && offset > closest.offset) {
                return {offset: offset, element: child};
            } else {
                return closest;
            }
        }, {offset: Number.NEGATIVE_INFINITY}).element;
    }

    async function updateTaskStatus(taskId, fromContainer, toContainer) {
        const isMovingToSprint = toContainer === 'sprintTasks';
        console.log(`Moving task ${taskId} from ${fromContainer} to ${toContainer}`);

        const db = getDatabase();
        const sprintIdElement = document.querySelector('.tasks-container h2');
        const sprintId = sprintIdElement ? sprintIdElement.getAttribute('data-sprint-id') : null;

        if (!sprintId) {
            console.error('Sprint ID not found');
            return;
        }

        const sprintRef = ref(db, `sprintboard/${sprintId}`);
        const sprintSnapshot = await get(sprintRef);

        if (!sprintSnapshot.exists()) {
            console.error('Sprint not found');
            return;
        }

        const sprint = sprintSnapshot.val();
        let sprintTasks = sprint.sprintTasks || [];

        if (isMovingToSprint) {
            if (!sprintTasks.includes(taskId)) {
                sprintTasks.push(taskId);
            }
        } else {
            sprintTasks = sprintTasks.filter(id => id !== taskId);
        }

        try {
            await update(sprintRef, {sprintTasks});
            console.log('Sprint tasks updated successfully');
        } catch (error) {
            console.error('Error updating sprint tasks:', error);
        }
    }


    function createTaskCard(key, task) {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.setAttribute('draggable', 'true');
        card.setAttribute('data-task-id', key);

        const tags = task.tags ? task.tags.map(tag => `<div class="tag" style="background-color: ${tag.color};">${tag.name}</div>`).join('') : '';

        card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center">
            <h4 class="mg-clear mb-0">${task.title}</h4>
            <div>
                <div class="dropdown d-inline-block edit-item">
                    <button class="btn btn-link three-dot-menu" type="button" id="dropdownMenu-${key}" data-bs-toggle="dropdown" aria-expanded="false">⋮</button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenu-${key}">
                        <li><a class="dropdown-item text-primary edit-item" href="#" data-task-id="${key}" >Edit</a></li>
                    </ul>
                </div>
            </div>
        </div>
        <div class="card-body">
            <p>Priority:</p>
            <button class="btn btn-secondary me-2 card-tag" disabled style="background-color: ${getPriorityColor(task.priority)}">${task.priority}</button>
            <p>Tags: ${tags}</p>
            <p>Storypoint: ${task.storypoint}</p>
        </div>

        `
        return card;
    }

    function getPriorityColor(priority) {
        const colors = {'Low': '#C6F4D6', 'Medium': '#F7DC6F', 'Important': '#FFC0CB', 'Urgent': '#FFD7BE'};
        return colors[priority] || '#6E6AF0';
    }

    document.addEventListener('DOMContentLoaded', function () {
        initDragAndDrop();
    });

    // Call this function when the DOM is loaded
    document.addEventListener('DOMContentLoaded', initDragAndDrop);

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.card');
        if (card && !event.target.closest('.dropdown, .btn-link')) {
            const sprintId = card.getAttribute('data-sprint-id');
            if (sprintId) {
                getSprintFromFirebase(sprintId).then((sprint) => {
                    if (sprint) {
                        sprint.key = sprintId;
                        openSprintViewMode(sprint, sprintId);
                    }
                }).catch(console.error);
            }
        }
    });

    let currentData;

    function fetchSprintBoard() {
        get(ref(database, 'sprintboard')).then((snapshot) => {
            if (snapshot.exists()) {
                const currentData = snapshot.val();
                console.log('Fetched Data:', currentData); // Debugging line
                renderSprintBoard(currentData);
            } else {
                console.log("No data available");
                renderSprintBoard({}); // Render an empty board
            }
        }).catch((error) => {
            console.error("Error fetching sprint board:", error);
            renderSprintBoard({}); // Render an empty board in case of error
        });
    }

    async function updateSprintStatusInFirebase(sprintId, newStatus) {
        try {
            const sprintRef = ref(database, `sprintboard/${sprintId}`);
            await update(sprintRef, {status: newStatus});
            console.log(`Sprint ${sprintId} status updated to ${newStatus}`);
        } catch (error) {
            console.error(`Error updating sprint ${sprintId} status:`, error);
        }
    }

    // Function to periodically update sprint statuses
    function updateAllSprintStatuses() {
        getAllSprintsFromFirebase().then(sprints => {
            if (sprints) {
                Object.entries(sprints).forEach(([sprintId, sprint]) => {
                    const newStatus = calculateSprintStatus(sprint.startTime, sprint.endTime, sprint.status);
                    if (newStatus !== sprint.status) {
                        updateSprintStatusInFirebase(sprintId, newStatus);
                    }
                });
            }
        }).catch(console.error);
    }

    // Set interval to update sprint statuses every minute
    setInterval(updateAllSprintStatuses, 5000);

    // Initial fetch of sprint board data
    fetchSprintBoard();

    // Function to clear all sprints (DEBUGGING ONLY)
    function clearAllSprints() {
        const database = getDatabase();
        const sprintBoardRef = ref(database, 'sprintboard');
        remove(sprintBoardRef)
            .then(() => {
                console.log("All sprints cleared successfully.");
            })
            .catch((error) => {
                console.error("Error clearing sprints:", error);
            });
    }


    // Expose the function to the global scope for console access
    window.clearAllSprints = clearAllSprints;

    async function fetchUserTeamMember() {
        const usersRef = ref(database, 'users'); // Reference to the users node
        try {
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const users = snapshot.val();
                window.availableTeamMembers = Object.values(users).map(user => user.username);
                window.teamMembersColors = Object.values(users).map((user) => '#FFD7BE');
            } else {
                console.log("No users available");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    // Fetch users from Firebase and populate the assignee dropdown
    async function fetchUsers(assigneeId) {
        const usersRef = ref(database, 'users'); // Reference to the users node
        try {
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const users = snapshot.val();
                const assigneeSelect = document.getElementById(assigneeId);
                assigneeSelect.innerHTML = ''; // Clear existing options
                Object.entries(users).forEach(([key, user]) => {
                    const option = document.createElement('option');
                    option.value = user.username; // Use username as the value
                    option.textContent = user.username; // Display username
                    assigneeSelect.appendChild(option);
                });
            } else {
                console.log("No users available");
            }
        } catch (error) {
            console.error("Error fetching users:", error);
        }
    }

    // Call the function to fetch users when the document is loaded
    document.addEventListener('DOMContentLoaded', () => {
        fetchUsers('productOwner');
        fetchUsers('scrumMaster');
        fetchUsers('assignee');
        fetchUserTeamMember();
    });

    document.addEventListener('DOMContentLoaded', () => {
        const overlayProgress = document.getElementById('overlay-progress');
        overlayProgress.addEventListener('click', () => {
            toggleProgressPopup();
        });
    });