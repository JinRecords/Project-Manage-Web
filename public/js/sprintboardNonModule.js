// Global variables
let currentSprintId = null;
let isSprintUpdated = false;
let currentTaskId = null;
let lastMessageIndex = -1;

function getRandomMessage() {
    const encouragingMessages = [
        "Great job! Keep up the good work!",
        "You're making excellent progress!",
        "Awesome work! You're crushing it!",
        "Way to go! You're on fire!",
        "Fantastic effort! You're doing great!",
        "Keep pushing forward, you're doing amazing!",
        "Your hard work is paying off, well done!",
        "You're unstoppable, keep it going!",
        "Impressive progress, keep shining!",
        "You're a rockstar, keep up the momentum!"
    ];

    let newIndex;
    do {
        newIndex = Math.floor(Math.random() * encouragingMessages.length);
    } while (newIndex === lastMessageIndex);

    lastMessageIndex = newIndex;
    return encouragingMessages[newIndex];
}

// Function to show an encouraging message
function showEncouragingMessage(message) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'encouraging-message';
    messageContainer.textContent = message;
    document.body.appendChild(messageContainer);

    setTimeout(() => {
        messageContainer.classList.add('show');
    }, 100);

    setTimeout(() => {
        messageContainer.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageContainer);
        }, 500);
    }, 5000);
}

// Function to handle adding a new sprint
window.handleAddSprintClick = function (event) {
    event.preventDefault();
    setSprintFormMode('add');
}

function showFilterTimeSpentPopup() {
    document.getElementById('filter-time-spent-popup').style.display = 'block';
}

function hideFilterTimeSpentPopup() {
    document.getElementById('filter-time-spent-popup').style.display = 'none';
}


// Function to set sprint form mode (add or edit)
function setSprintFormMode(mode, sprint = null) {
    console.log("Setting sprint form mode:", mode);
    const form = document.getElementById('sprintForm');
    const buttons = document.querySelector('.form-buttons');
    buttons.innerHTML = '';

    if (mode === 'edit' && sprint) {
        fillSprintFormWithData(sprint);
        buttons.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="toggleSprintPopup()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="updateSprint('${sprint.key}')">Update</button>
        `;
        currentSprintId = sprint.key;
        document.addEventListener("keyup", function (event) {
            if (event.key === 'Enter' && mode === 'edit') {
                updateSprint(sprint.key);
                console.log('Sprint updated with enter key');
                mode = 'view';
            }
        });
    } else if (mode === 'add') {
        form.reset();
        setDefaultSprintFormValues();
        buttons.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="toggleSprintPopup()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="saveSprint()">Save Sprint</button>
        `;
        currentSprintId = null;
    }

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

    const statusContainer = document.getElementById('sprintStatus');
    statusContainer.innerHTML = `<div class="pill-button status-${sprint.status.toLowerCase().replace(/ /g, '-')}">${sprint.status}</div>`;
}


// Function to set default sprint form values
function setDefaultSprintFormValues() {
    const form = document.getElementById('sprintForm');
    form.elements['sprintStatus'].value = 'Not started';
}

// Function to toggle sprint popup
function toggleSprintPopup() {
    console.log("Toggling sprint popup");
    const popup = document.getElementById('sprintFormPopup');
    const overlay = document.getElementById('overlay-sprint');
    popup.classList.toggle('open');
    overlay.classList.toggle('open');
    console.log("Popup visibility:", popup.classList.contains('open'));

    // Reset team members array and re-render team members container when popup is closed
    if (!popup.classList.contains('open')) {
        const form = document.getElementById('sprintForm');
        form.reset();
        Array.from(form.elements).forEach(el => el.disabled = false);
        window.teamMembers = [];
        renderPopupTeamMembers();
    }
}

// Function to toggle progress popup
function toggleProgressPopup() {
    console.log("Toggling sprint popup");
    const popup = document.getElementById('progress-popup');
    const taskCard = document.querySelector('.task-card.open');
    if (taskCard) {
        currentTaskId = taskCard.getAttribute('data-task-id'); // Update the currentTaskId variable
        taskCard.classList.toggle('open');
    }
    popup.classList.toggle('open');
    console.log("Popup visibility:", popup.classList.contains('open'));
}


// Function to toggle sprint popup
function toggleBurndownChartPopup(totalStoryPoints, completedStoryPoints, dateStoryPoint, dates) {
    console.log("Toggling burndown chart popup");
    const popup = document.getElementById('burndown-chart-popup');
    const overlay = document.getElementById('overlay-sprint');
    popup.classList.toggle('open');
    overlay.classList.toggle('open');
    console.log("Popup visibility:", popup.classList.contains('open'));
    renderBurndownChart(totalStoryPoints, completedStoryPoints, dateStoryPoint, dates);  // Call the render function
    $('#burndownChartModal').modal('show');  // Show the modal
}

window.toggleEditPopup = function () {
    console.log('toggleEditPopup function called');
    const popup = document.getElementById('editTaskPopupForm');
    const overlay = document.getElementById('overlay-task');

    if (!popup) {
        console.error('Edit popup element not found!');
        return;
    }

    console.log('Popup before toggle:', popup.classList.contains('open'));
    popup.classList.toggle('open');
    overlay.classList.toggle('open');
    console.log('Popup after toggle:', popup.classList.contains('open'));

    // Force a reflow
    void popup.offsetWidth;

    if (popup.classList.contains('open')) {
        popup.style.display = 'block';
        overlay.style.display = 'block';
    } else {
        popup.style.display = 'none';
        overlay.style.display = 'none';
    }

    console.log('Popup display:', window.getComputedStyle(popup).display);
    console.log('Popup visibility:', window.getComputedStyle(popup).visibility);
    console.log('Popup opacity:', window.getComputedStyle(popup).opacity);
}

let tags = [], teamMembers = [], priority = '', sprint = '', status = 'Not started', stage = '';
const availableTags = ['UI', 'UX', 'Frontend', 'Backend', 'Framework', 'Testing', 'Database', 'API'];
const tagColors = ['#FFC0CB', '#FFD7BE', '#F7DC6F', '#C6F4D6', '#9ED2C0', '#8DB8CB', '#9F9CE9', '#BE8DE4'];
window.tags = [];
window.teamMembers = [];
let teamMembersColors = [];

function showTagSelectionPopup() {
    const tagSelectionPopup = document.getElementById('tag-selection-popup');
    const tagSelection = document.getElementById('tag-selection');
    tagSelection.innerHTML = '';
    availableTags.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.classList.add('tag-selection-tag');
        tagElement.style.backgroundColor = tagColors[index % tagColors.length];
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => {
            if (!window.tags.some(t => t.name === tag)) {
                window.tags.push({name: tag, color: tagColors[index % tagColors.length]});
            }
            renderPopupTags();
            hideTagSelectionPopup();
        });
        tagSelection.appendChild(tagElement);
    });
    tagSelectionPopup.classList.add('open');
}

function showTeamMemberSelectionPopup() {
    const teamMembersSelectionPopup = document.getElementById('teamMembers-selection-popup');
    const teamMembersSelection = document.getElementById('teamMembers-selection');
    teamMembersSelection.innerHTML = '';
    window.availableTeamMembers.forEach((tag, index) => {
        const tagElement = document.createElement('div');
        tagElement.classList.add('teamMembers-selection-teamMembers');
        tagElement.style.backgroundColor = window.teamMembersColors[index];
        tagElement.textContent = tag;
        tagElement.addEventListener('click', () => {
            if (!window.teamMembers.some(t => t.name === tag)) {
                window.teamMembers.push({name: tag, color: window.teamMembersColors[index]});
            }
            renderPopupTeamMembers();
            hideTeamMemberSelectionPopup();
        });
        teamMembersSelection.appendChild(tagElement);
    });
    teamMembersSelectionPopup.classList.add('open');
}


function hideTagSelectionPopup() {
    document.getElementById('tag-selection-popup').classList.remove('open');
}

function hideTeamMemberSelectionPopup() {
    document.getElementById('teamMembers-selection-popup').classList.remove('open');
}

function renderPopupTags(isViewMode = false) {
    const tagsContainer = document.getElementById('popup-tags-container');
    tagsContainer.innerHTML = '';

    // Loop through and render the tags
    if (Array.isArray(window.tags)) {
        window.tags.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('tag');
            tagElement.style.backgroundColor = tag.color;
            tagElement.textContent = tag.name;

            // In view mode, tags should not be clickable
            if (!isViewMode) {
                tagElement.addEventListener('click', () => {
                    window.tags = window.tags.filter(t => t.name !== tag.name);
                    renderPopupTags();
                });
            }

            tagsContainer.appendChild(tagElement);
        });
    }

    // Hide or show the "Add Tag" button based on the mode
    const addTagButton = document.getElementById('add-tag-button');
    if (isViewMode) {
        addTagButton.style.display = 'none'; // Hide the button in view mode
    } else {
        addTagButton.style.display = 'inline-block'; // Show the button in edit/add mode
    }
}

function renderPopupTeamMembers(isViewMode = false) {
    const teamMembersContainer = document.getElementById('popup-teamMembers-container');
    teamMembersContainer.innerHTML = '';

    // Loop through and render the tags
    if (Array.isArray(window.teamMembers)) {
        window.teamMembers.forEach(tag => {
            const tagElement = document.createElement('div');
            tagElement.classList.add('teamMembers');
            tagElement.style.backgroundColor = tag.color;
            tagElement.textContent = tag.name;

            // In view mode, tags should not be clickable
            if (!isViewMode) {
                tagElement.addEventListener('click', () => {
                    window.teamMembers = window.teamMembers.filter(t => t.name !== tag.name);
                    renderPopupTeamMembers();
                });
            }

            teamMembersContainer.appendChild(tagElement);
        });
    }

    // Hide or show the "Add Tag" button based on the mode
    const addTagButton = document.getElementById('add-tag-button');
    if (isViewMode) {
        addTagButton.style.display = 'none'; // Hide the button in view mode
    } else {
        addTagButton.style.display = 'inline-block'; // Show the button in edit/add mode
    }
}

function renderTeamMembers(teamMembers) {
    return teamMembers ? teamMembers.map(teamMember => `<div class="teamMembers" style="background-color: ${teamMember.color}; color: black;">${teamMember.name}</div>`).join('') : '';
}

function setPriority(p) {
    if (!p) {
        console.warn("Priority is undefined or missing");  // Add a warning if the priority is missing
        return;
    }

    priority = p;
    document.querySelectorAll('.pill-button.priority-low, .pill-button.priority-medium, .pill-button.priority-urgent, .pill-button.priority-important')
        .forEach(button => button.classList.remove('selected'));
    document.querySelector(`.pill-button.priority-${p.toLowerCase()}`).classList.add('selected');
    document.getElementById('priority-input').value = p;
}

function setStatus(status) {
    document.getElementById('status-input').value = status;
    const statusPills = document.querySelectorAll('.edit-status');
    statusPills.forEach(pill => {
        if (pill.textContent === status) {
            pill.classList.add('selected');
        } else {
            pill.classList.remove('selected');
        }
    });
    console.log("Status changed to:", status);
}

function setStage(stage) {
    if (!stage) {
        console.warn("Stage is undefined or missing");
        return;
    }

    // Clear previous selections
    document.querySelectorAll('.pill-button.stage-planning, .pill-button.stage-development, .pill-button.stage-testing, .pill-button.stage-integration')
        .forEach(button => button.classList.remove('selected'));

    // Try to select the button for the given stage
    const stageButton = document.querySelector(`.pill-button.stage-${stage.toLowerCase()}`);

    // Check if the stage button exists before trying to add a class
    if (stageButton) {
        stageButton.classList.add('selected');
        document.getElementById('stage-input').value = stage;
    } else {
        console.warn("Stage button not found for:", stage);
    }
}

let isSettingFormMode = false;
let setFormModeTimeout;

function setFormMode(mode, item = null) {
    if (isSettingFormMode) {
        console.log('Already setting form mode, ignoring duplicate call');
        return;
    }

    isSettingFormMode = true;
    clearTimeout(setFormModeTimeout);

    setFormModeTimeout = setTimeout(() => {
        console.log(`Setting form mode to: ${mode}`);
        const form = document.getElementById('backlogForm');
        const buttons = document.getElementById('edit-form-buttons');

        buttons.innerHTML = '';

        if (mode === 'edit' && item) {
            console.log('Filling form with item data:', item);
            fillFormWithItemData(item);
            buttons.innerHTML = `
                    <button type="button" class="btn btn-secondary" onclick="toggleEditPopup()">Cancel</button>
                    <button type="button" class="btn btn-primary" onclick="updateSprintBacklogItem('${item.key}')">Update</button>
                `;
            Array.from(form.elements).forEach(el => el.disabled = false);
            enableStatusPills();
            console.log('About to toggle edit popup');

        } else if (mode === 'view') {
            console.log("???????????????????????????????????????????")
            fillFormWithItemData(item);
            Array.from(form.elements).forEach(el => el.disabled = true);
            buttons.innerHTML = `<button type="button" class="btn btn-secondary" onclick="toggleEditPopup()">Back</button>
                    `;
            disableStatusPills();
            console.log('About to toggle view popup');
        }

        isSettingFormMode = false;
    }, 100);
    window.toggleEditPopup();
}

function enableStatusPills() {
    const statusPills = document.querySelectorAll('.edit-status');
    statusPills.forEach(pill => {
        pill.classList.remove('disabled');
        pill.addEventListener('click', function () {
            setStatus(this.textContent);
        });
    });
}

function disableStatusPills() {
    const statusPills = document.querySelectorAll('.edit-status');
    statusPills.forEach(pill => {
        pill.classList.add('disabled');
        pill.removeEventListener('click', setStatus);
    });
}

function fillFormWithItemData(item) {
    const form = document.getElementById('backlogForm');
    const statusInput = document.getElementById('status-input');
    const statusPills = document.querySelectorAll('.edit-status');
    statusInput.value = item.status || 'Not started';
    statusPills.forEach(pill => {
        if (pill.textContent === statusInput.value) {
            pill.classList.add('selected');
        } else {
            pill.classList.remove('selected');
        }
    });

    console.log("Item filled: ", form);
    form.elements['title'].value = item.title || '';
    form.elements['description'].value = item.description || '';
    form.elements['assignee'].value = item.assignee || '';
    setPriority(item.priority || '');
    setStatus(item.status || 'Not started');
    setStage(item.stage || '');
    form.elements['storypoint'].value = item.storypoint || '';
    window.tags = item.tags || [];
    renderPopupTags();

    // Render the timeline
    if (item.history && item.history.length > 0) {
        form.elements['timeCreated'].value = `Created on ${item.history[0].timestamp}`;
    } else {
        form.elements['timeCreated'].value = item.timeCreated || '';
    }
    renderTimeline(item.history || []);
}

function renderTimeline(history) {
    const timelineContainer = document.getElementById('timeline-events');
    timelineContainer.innerHTML = '';

    history.slice().reverse().forEach((event, index) => {
        const timelineEvent = document.createElement('div');
        timelineEvent.className = 'timeline-event';

        const dot = document.createElement('div');
        dot.className = 'timeline-dot';

        const content = document.createElement('div');
        content.className = 'timeline-content';

        const actionTime = document.createElement('p');
        actionTime.textContent = `${event.action} on ${event.timestamp} \n | by: ${event.user || 'Unknown User'}`;
        actionTime.style.fontFamily = 'Poppins, sans-serif';
        actionTime.style.width = '45%';
        actionTime.style.marginRight = '10px';
        actionTime.style.float = 'left';

        const changes = document.createElement('p');
        changes.textContent = event.changes;
        changes.style.fontFamily = 'Poppins, sans-serif';
        changes.style.width = '45%';
        changes.style.float = 'right';
        changes.style.marginTop = '10px';

        if (changes.textContent.length > 50) {
            changes.textContent = changes.textContent.substring(0, 47) + '...';
        }

        content.appendChild(actionTime);
        content.appendChild(changes);

        timelineEvent.appendChild(dot);
        timelineEvent.appendChild(content);

        timelineContainer.appendChild(timelineEvent);
    });
}

// Function to save a new sprint
function saveSprint() {
    const sprintData = getSprintFormData();
    if (validateSprintData(sprintData)) {
        sendFormDataToFirebase(sprintData);
        toggleSprintPopup();
        isSprintUpdated = false;
    }
}

// Function to get sprint form data
function getSprintFormData() {
    const form = document.getElementById('sprintForm');
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

// Function to validate sprint data
function validateSprintData(data) {
    for (let key in data) {
        if (data[key] === '') {
            alert(`Please fill in the ${key} field.`);
            return false;
        }
    }
    if (new Date(data.startTime) >= new Date(data.endTime)) {
        alert('End time must be after start time.');
        return false;
    }
    return true;
}

// Function to calculate sprint status based on time
function calculateSprintStatus(startTime, endTime, previousStatus) {
    const now = new Date();
    const start = new Date(startTime);
    const end = new Date(endTime);

    let newStatus;
    if (now < start) {
        newStatus = 'Not started';
    } else if (now >= start && now <= end) {
        newStatus = 'In progress';
    } else {
        newStatus = 'Completed';
    }

    console.log(`Status change: ${previousStatus} -> ${newStatus}`);

    if (newStatus !== previousStatus) {
        let message;
        switch (newStatus) {
            case 'In progress':
                message = "Sprint has started! Good luck and stay focused!";
                break;
            case 'Completed':
                message = "Congratulations! You've completed the sprint!";
                break;
        }
        if (message) {
            console.log(`Showing message: ${message}`);
            showEncouragingMessage(message);
        }
    }

    return newStatus;
}

// Function to update a sprint
function updateSprint(sprintId) {
    setSprintFormMode('edit', sprint);
    const sprintData = getSprintFormData();
    if (validateSprintData(sprintData)) {
        updateSprintInFirebase(sprintId, sprintData);
        toggleSprintPopup();

    }
}

let renderedSprintIds = new Set();

// Function to render sprint board
function renderSprintBoard(data) {
    const container = document.getElementById('sprintCardsContainer');
    container.innerHTML = ''; // Clear existing sprint cards
    renderedSprintIds.clear();
    Object.entries(data).forEach(([key, sprint]) => {
        if (!renderedSprintIds.has(key)) {
            const card = createSprintCard(sprint, key);
            container.appendChild(card);
            renderedSprintIds.add(key);
        }
    });

    if (!container) {
        console.error('Sprint cards container not found');
        return; // Exit the function if the container is not found
    }

    container.innerHTML = '';

    if (!data || Object.keys(data).length === 0) {
        const noDataMessage = document.createElement('p');
        noDataMessage.textContent = 'No sprints added yet.';
        noDataMessage.style.textAlign = 'center';
        noDataMessage.style.padding = '20px';
        container.appendChild(noDataMessage);
    } else {
        Object.entries(data).forEach(([key, sprint]) => {
            const card = createSprintCard(sprint, key);
            container.appendChild(card);
        });
    }
}


// Function to create a sprint card
function createSprintCard(sprint, key) {
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
            openSprintViewMode(sprint, key);
        }
    });

    return card;
}

function openSprintViewMode(sprint, key) {
    const form = document.getElementById('sprintForm');

    // Fill in the form fields
    form.elements['sprintTitle'].value = sprint.title || '';
    form.elements['sprintDescription'].value = sprint.description || '';
    form.elements['productOwner'].value = sprint.productOwner || '';
    form.elements['scrumMaster'].value = sprint.scrumMaster || '';
    form.elements['sprintStartTime'].value = sprint.startTime || '';
    form.elements['sprintEndTime'].value = sprint.endTime || '';
    const statusElement = document.getElementById('sprintStatus');
    if (statusElement) {
        statusElement.innerHTML = `<div class="pill-button status-${sprint.status.toLowerCase().replace(/ /g, '-')}">${sprint.status}</div>`;
    } else {
        console.error('Sprint status element not found');
    }

    window.teamMembers = sprint.teamMembers || [];
    renderPopupTeamMembers(true);

    // Disable all form fields
    Array.from(form.elements).forEach(el => el.disabled = true);

    // Change buttons: Only "Back"
    const buttons = document.querySelector('.form-buttons');
    buttons.innerHTML = '<button type="button" class="btn btn-secondary" onclick="toggleSprintPopup()">Back</button>';

    // Open popup
    toggleSprintPopup();
}

function editTaskFromViewMode(item) {
    console.log('Editing task from view mode:', item);
    setFormMode('edit', item);
}

function openFormInViewMode(item) {
    console.log('Opening form in view mode with item:', item);

    const form = document.getElementById('backlogForm');

    // Prefill form fields
    form.elements['title'].value = item.title || '';
    form.elements['description'].value = item.description || '';
    form.elements['assignee'].value = item.assignee || '';

    // Set priority
    if (item.priority) {
        setPriority(item.priority);
    } else {
        console.warn("Priority is missing for item:", item);
    }

    // Set stage
    if (item.stage) {
        setStage(item.stage);
    } else {
        console.warn("Stage is missing for item:", item);
    }

    form.elements['storypoint'].value = item.storypoint || '';

    // Populate 'timeCreated' field in view mode (use 'timeCreated' or fallback to history)
    form.elements['timeCreated'].value = item.timeCreated || (item.history && item.history.length > 0 ? `Created on ${item.history[0].timestamp}` : 'No creation date available');

    window.tags = item.tags || [];

    // Render tags
    renderPopupTags(true);

    // Disable all form fields
    Array.from(form.elements).forEach(el => el.disabled = true);

    // Change buttons: Only "Back"
    const buttons = document.getElementById('edit-form-buttons');
    console.log(buttons)
    buttons.innerHTML = `
            <button type="button" id="progress-button" class=btn btn-primary" onclick="toggleProgressPopup()">Progress</button>
            <button type="button" class="btn btn-secondary" onclick="toggleEditPopup()">Back</button>`;

    // Open popup
    toggleEditPopup();

    renderTimeline(item.history || []);
}

// Function to render sprint board
window.renderSprintBoard = function (data) {
    const container = document.getElementById('sprintCardsContainer');
    container.innerHTML = '';

    if (!data || Object.keys(data).length === 0) {
        const noDataMessage = document.createElement('p');
        noDataMessage.textContent = 'No sprints added yet.';
        noDataMessage.style.textAlign = 'center';
        noDataMessage.style.padding = '20px';
        container.appendChild(noDataMessage);
    } else {
        Object.entries(data).forEach(([key, sprint]) => {
            const card = createSprintCard(sprint, key);
            container.appendChild(card);
        });
    }
}

function handleSaveChanges() {
    if (typeof window.sendFormDataToFirebase === 'function') {
        window.sendFormDataToFirebase();
    } else {
        console.error('sendFormDataToFirebase is not defined');
    }
}

// Function to show delete confirmation
function showDeleteConfirmation(sprintId) {
    const popup = document.getElementById('delete-confirmation-popup');
    popup.style.display = 'block';
    document.getElementById('overlay-sprint').classList.add('open');

    // Set up event listeners for delete confirmation
    document.querySelector('#delete-confirmation-popup .btn-secondary').onclick = hideDeleteConfirmation;
    document.querySelector('#delete-confirmation-popup .btn-danger').onclick = () => {
        deleteSprint(sprintId);
        hideDeleteConfirmation();
    };
}

// Function to get sprint form data for update
function getSprintFormDataForUpdate(sprintId) {
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
        status: statusElement ? statusElement.textContent : 'Not started'
    }
}

// Function to hide delete confirmation
function hideDeleteConfirmation() {
    document.getElementById('delete-confirmation-popup').style.display = 'none';
    document.getElementById('overlay-sprint').classList.remove('open');
}

// Function to edit a sprint
function editSprint(sprintId) {
    console.log("Editing sprint with ID:", sprintId);
    toggleSprintPopup();
    getSprintFromFirebase(sprintId).then(sprint => {
        if (sprint) {
            sprint.key = sprintId;
            setSprintFormMode('edit', sprint);
        } else {
            console.log("Sprint not found");
        }
    }).catch(console.error);
}

function filterDataByDateRange(dates, durations, startDate, endDate) {
    const filteredDates = [];
    const filteredDurations = [];

    for (let i = 0; i < dates.length; i++) {
        if (dates[i] >= startDate && dates[i] <= endDate) {
            filteredDates.push(dates[i]);
            filteredDurations.push(durations[i]);
        }
    }

    return {dates: filteredDates, durations: filteredDurations};
}

function applyDateFilter() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;

    if (startDate && endDate) {
        fetchAndDisplayProgressData(currentTaskId, startDate, endDate);
        hideFilterTimeSpentPopup();
    } else {
        alert('Please select both start and end dates.');
    }
}

function resetDateFilter() {
    document.getElementById('start-date').value = '';
    document.getElementById('end-date').value = '';
    fetchAndDisplayProgressData(currentTaskId, null, null, true);
    hideFilterTimeSpentPopup();
}

