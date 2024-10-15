    //Global Variable for the NFR ENTER button
    let isSprintUpdated = false;

    let tags = [], priority = '', sprint = '', status = 'Not started', stage = '';
    const availableTags = ['UI', 'UX', 'Frontend', 'Backend', 'Framework', 'Testing', 'Database', 'API'];
    const tagColors = ['#FFC0CB', '#FFD7BE', '#F7DC6F', '#C6F4D6', '#9ED2C0', '#8DB8CB', '#9F9CE9', '#BE8DE4'];
    let currentSortOption = 'default', currentFilterOption = [];
    window.tags = [];

    function fetchProductBacklog() {
        get(ref(database, 'productBacklog')).then((snapshot) => {
            if (snapshot.exists()) {
                currentData = snapshot.val();
                console.log('Fetched Data:', currentData); // Debugging line
                renderProductBacklog(currentData);
            } else {
                console.log("No data available");
            }
        }).catch(console.error);
    }

    function renderProductBacklog(data) {
        const container = document.querySelector('.col .form-group.mb-3');
        container.innerHTML = ''; // Clear the container

        if (!data || Object.keys(data).length === 0) {
            const noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'No items in the product backlog.';
            noDataMessage.style.textAlign = 'center';
            noDataMessage.style.padding = '20px';
            container.appendChild(noDataMessage);
        } else {
            Object.entries(data).forEach(([key, item]) => {
                const card = createBacklogCard(item, key);
                container.appendChild(card);
            });
        }

        // Always add the "Add" button
        const addButton = document.createElement('button');
        addButton.className = 'btn btn-lg btn-8-style btn-c-7647';
        addButton.onclick = handleAddButtonClick;
        addButton.innerHTML = '<span class="fa fa-plus"></span>';
        container.appendChild(addButton);
    }

    function createBacklogCard(item, key) {
        console.log(`Task Priority: ${item.priority}`);
        const card = document.createElement('div');
        card.className = 'card mb-3';
        card.setAttribute('data-item-id', key);  // Add this line to set the item ID on the card
        const timeCreated = item.history && item.history.length > 0 ? item.history[0].timestamp : 'No creation date available';
        card.innerHTML = `
    <div class="card-header d-flex justify-content-between align-items-center">
      <h3 class="mg-clear">${item.title}</h3>
      <div class="dropdown">
        <button class="btn btn-link dropdown-toggle three-dot-menu" type="button" id="dropdownMenu-${key}" data-bs-toggle="dropdown" aria-expanded="false">⋮</button>
        <ul class="dropdown-menu" aria-labelledby="dropdownMenu-${key}">
          <li><a class="dropdown-item text-danger delete-item" href="#" data-item-id="${key}">Delete</a></li>
          <li><a class="dropdown-item text-primary edit-item" href="#" data-item-id="${key}">Edit</a></li>
        </ul>
      </div>
    </div>
    <div class="card-body">
      <!-- <p>${item.description}</p> -->
      <div class="d-flex mb-2">
        <button class="btn btn-secondary me-2 card-tag" disabled style="background-color: ${getPriorityColor(item.priority)}">${item.priority}</button>
        <!-- <button class="btn btn-secondary card-tag" disabled>${item.assignee}</button> -->
      </div>
      <div class="tags-container">${renderCardTags(item.tags)}</div>
            <div class="mt-2"><small>Story Point: ${item.storypoint}</small></div>
    </div>
  `;
        return card;
    }



    function renderCardTags(tags) {
        return tags ? tags.map(tag => `<div class="tag" style="background-color: ${tag.color}; color: black;">${tag.name}</div>`).join('') : '';
    }

    function getPriorityColor(priority) {
        const colors = {'Low': '#C6F4D6', 'Medium': '#F7DC6F', 'Important': '#FFC0CB', 'Urgent': '#FFD7BE'};
        return colors[priority] || '#6E6AF0';
    }

    function togglePopup() {
        const popup = document.getElementById('popupForm');
        const overlay = document.getElementById('overlay');

        popup.classList.toggle('open');
        overlay.classList.toggle('open');

        if (!popup.classList.contains('open')) {
            // Reset form state without changing buttons
            const form = document.getElementById('backlogForm');
            form.reset();
            Array.from(form.elements).forEach(el => el.disabled = false);
            window.tags = [];
            renderPopupTags();
        }
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

    function hideTagSelectionPopup() {
        document.getElementById('tag-selection-popup').classList.remove('open');
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
        // Clear any previously selected status buttons
        document.querySelectorAll('.pill-button.status-not-started, .pill-button.status-in-progress, .pill-button.status-completed').forEach(button => {
            button.classList.remove('selected');
        });

        // Select the appropriate status button
        const statusClassMap = {
            'Not started': '.pill-button.status-not-started',
            'In progress': '.pill-button.status-in-progress',
            'Completed': '.pill-button.status-completed'
        };

        const statusButton = document.querySelector(statusClassMap[status]);
        if (statusButton) {
            statusButton.classList.add('selected');
        } else {
            console.warn("Unknown status:", status);
        }

        // Set hidden input value (if needed)
        document.getElementById('status-input').value = status;
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


    document.addEventListener('DOMContentLoaded', () => {
        document.querySelector('#popupForm form').addEventListener('submit', e => {
            e.preventDefault();
            window.sendFormDataToFirebase();
        });
    });

    function handleSaveChanges() {
        if (typeof window.sendFormDataToFirebase === 'function') {
            window.sendFormDataToFirebase();
        } else {
            console.error('sendFormDataToFirebase is not defined');
        }
    }

    window.showDeleteConfirmation = key => {
        window.itemToDelete = key;
        document.getElementById('delete-confirmation-popup').style.display = 'block';
    }

    window.hideDeleteConfirmation = () => {
        document.getElementById('delete-confirmation-popup').style.display = 'none';
    }

    window.confirmDelete = () => {
        if (window.itemToDelete) {
            window.deleteData(`productBacklog/${window.itemToDelete}`);

            // Remove the corresponding card from the DOM
            const cardToRemove = document.querySelector(`[data-item-id="${window.itemToDelete}"]`);
            if (cardToRemove) {
                cardToRemove.remove();
            }
        }
    }


    function showSortingPopup() {
        document.getElementById('sorting-popup').style.display = 'block';
    }

    function hideSortingPopup() {
        document.getElementById('sorting-popup').style.display = 'none';
    }

    function applySorting() {
        currentSortOption = document.querySelector('input[name="sort-option"]:checked').value;
        hideSortingPopup();
        fetchProductBacklog();
    }

    function sortBacklogItems(items) {
        if (!items || Object.keys(items).length === 0) {
            return {};
        }
        const itemsArray = Object.entries(items).map(([key, value]) => ({key, ...value}));
        const priorityValues = {'Low': 1, 'Medium': 2, 'Important': 3, 'Urgent': 4};
        const sortFunctions = {
            'oldest-recent': (a, b) => a.timestamp - b.timestamp,
            'recent-oldest': (a, b) => b.timestamp - a.timestamp,
            'low-important': (a, b) => (priorityValues[a.priority] || 0) - (priorityValues[b.priority] || 0),
            'important-low': (a, b) => (priorityValues[b.priority] || 0) - (priorityValues[a.priority] || 0),
        };
        itemsArray.sort(sortFunctions[currentSortOption] || sortFunctions['recent-oldest']);
        return Object.fromEntries(itemsArray.map(item => [item.key, item]));
    }


    function showFilterPopup() {
        document.getElementById('filter-popup').style.display = 'block';
    }

    function hideFilterPopup() {
        document.getElementById('filter-popup').style.display = 'none';
    }

    function applyFilter() {
        hideFilterPopup();
        fetchProductBacklog();
    }


    function filterBacklogItems(items) {
        if (!items || Object.keys(items).length === 0) {
            return {};
        }
        const itemsArray = Object.entries(items).map(([key, value]) => ({key, ...value}));
        if (currentFilterOption.length === 0) {
            return items;
        }
        const filteredItemsArray = itemsArray.filter(item => {
            const itemTags = item.tags ? item.tags.map(tag => tag.name) : [];
            const filterTags = currentFilterOption;
            if (currentFilterOption.length === 1) {
                return itemTags.includes(filterTags[0]);
            } else {
                return itemTags.length === currentFilterOption.length && itemTags.sort().every((value, index) => value === filterTags.sort()[index]);
            }
        });

        return filteredItemsArray.length === 0 ? {} :
               Object.fromEntries(filteredItemsArray.map(item => [item.key, item]));
    }


    function toggleFilterTagSelection(button, tag) {
        button.classList.toggle('selected');

        if (button.classList.contains('selected')) {
            if (!currentFilterOption.includes(tag)) {
                currentFilterOption.push(tag);
            }
        } else {
            currentFilterOption = currentFilterOption.filter(t => t !== tag);
        }

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

        // Set status
        setStatus(item.status);

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
        const buttons = document.querySelector('.form-buttons');
        buttons.innerHTML = '<button type="button" class="btn btn-secondary" onclick="togglePopup()">Back</button>';

        // Open popup
        togglePopup();
        renderTimeline(item.history || []);
    }


    function setFormMode(mode, item = null) {
        console.log(`Setting form mode to: ${mode}`); // Debug log
        const form = document.getElementById('backlogForm');
        const buttons = document.querySelector('.form-buttons');

        // Always clear the buttons first
        buttons.innerHTML = '';

        if (mode === 'edit' && item) {
            fillFormWithItemData(item);
            buttons.innerHTML = `
  <button type="button" class="btn btn-secondary" onclick="togglePopup(); hideTagSelectionPopup()">Cancel</button>
  <button type="button" class="btn btn-primary" onclick="updateBacklogItem('${item.key}')">Update</button>
`;
                        document.addEventListener("keyup", function (event) {

                            if (event.key === 'Enter' && mode === 'edit') {
                                updateBacklogItem(item.key);
                                console.log('Sprint saved with enter key');
                                mode = 'view';
                            }
                        });
        } else if (mode === 'add') {
            console.log('Entering add mode'); // Debug log
            // Force reset for add mode
            form.reset();
            window.tags = [];
            renderPopupTags();
            const timelineContainer = document.getElementById('timeline-events');
            timelineContainer.innerHTML = ''; // Reset the timeline
            setPriority('Low');  // Default to 'Low'
            setStatus('Not started');  // Default to 'Not started'
            setStage('Planning');  // Default to 'Planning'
            document.addEventListener("keyup", function (event) {

                if (event.key === 'Enter' && mode === 'add') {
                    handleSaveChanges();
                    console.log('Sprint saved with enter key');
                    mode = 'view';
                }
            });


            // Enable all form fields
            Array.from(form.elements).forEach(el => el.disabled = false);

            // Set the current time for the timeCreated field
            form.elements['timeCreated'].value = new Date().toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-');

            // Force the correct buttons for add mode
            buttons.innerHTML = `
            <button type="button" class="btn btn-secondary" onclick="togglePopup(); hideTagSelectionPopup()">Cancel</button>
            <button type="button" class="btn btn-primary" onclick="handleSaveChanges()">Save Changes</button>
        `;
            console.log('Add mode buttons set:', buttons.innerHTML); // Debug log
        } else if (mode === 'view') {
            fillFormWithItemData(item);
            Array.from(form.elements).forEach(el => el.disabled = true);
            buttons.innerHTML = '<button type="button" class="btn btn-secondary" onclick="togglePopup()">Back</button>';
        }

        // Force the popup to open
        const popup = document.getElementById('popupForm');
        const overlay = document.getElementById('overlay');
        popup.classList.add('open');
        overlay.classList.add('open');
    }

    window.handleAddButtonClick = function (event) {
        console.log('Add button clicked'); // Debug log
        event.preventDefault();
        console.log('Add button clicked'); // Debug log
        setFormMode('add');
    };

    function fillFormWithItemData(item) {
        const form = document.getElementById('backlogForm');
        form.elements['title'].value = item.title || '';
        form.elements['description'].value = item.description || '';
        form.elements['assignee'].value = item.assignee || '';
        setPriority(item.priority || '');
        form.elements['status-input'].value = item.status || 'Not started';
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
            actionTime.textContent = `${event.action} on ${event.timestamp} | by: ${event.updatedBy || 'Unknown'}`;
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