    // Import necessary modules
    import {initializeApp} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
    import {
        getDatabase,
        ref,
        push,
        get,
        remove,
        update,
        onValue
    } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

    // Firebase configuration
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
    const productBacklogRef = ref(database, 'productBacklog');

    // Function to fetch product backlog
// Function to fetch and filter product backlog
window.fetchProductBacklog = async function () {
    try {
        const snapshot = await get(productBacklogRef);
        if (snapshot.exists()) {
            let data = snapshot.val();
            // Filter out items where hidden is true
            data = Object.fromEntries(Object.entries(data).filter(([key, value]) => !value.hidden));
            const result = currentFilterOption.length > 0 ? filterBacklogItems(data) : sortBacklogItems(data);
            window.renderProductBacklog(result);
        } else {
            console.log("No data available");
        }
    } catch (error) {
        console.error("Error fetching product backlog:", error);
    }
};


function setupRealtimeListener() {
    const productBacklogRef = ref(database, 'productBacklog');
    onValue(productBacklogRef, (snapshot) => {
        let data = snapshot.val();
        if (data === null) {
            data = {}; // Ensure we're always working with an object
        }
        // Filter out items where hidden is true
        data = Object.fromEntries(Object.entries(data).filter(([key, value]) => !value.hidden));

        const result = currentFilterOption.length > 0 ? filterBacklogItems(data) : sortBacklogItems(data);
        window.renderProductBacklog(result);
    });
}

// Ensure this function is called when the document is ready
document.addEventListener('DOMContentLoaded', () => {
    setupRealtimeListener();
});


    // Function to send form data to Firebase
    window.sendFormDataToFirebase = async function () {
        try {
            const formData = getFormData();
            if (Object.values(formData).some(value => value === '')) {
                alert('Please fill in all fields');
                return;
            }

            await push(productBacklogRef, formData);
            console.log('Data saved successfully');
            togglePopup();
        } catch (error) {
            console.error("Error sending form data:", error);
        }
    }

    // Function to get form data
    function getFormData() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        const createdBy = currentUser ? currentUser.username : 'Unknown';
    
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
                changes: 'Item created',
                updatedBy: createdBy // Include the creator's username
            }],
            timeModified: new Date().toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-'),
            timestamp: Date.now(),
            tags: window.tags || [],
            timespent: 0,
            hidden: false
        };
    }

    // Function to handle delete item
    window.deleteData = async function (path) {
        try {
            await remove(ref(database, path));
            console.log("Data deleted successfully");
            hideDeleteConfirmation();
            // The listener will automatically update the UI
        } catch (error) {
            console.error("Error deleting data:", error);
        }
    }

    // Function to handle update item
    window.updateBacklogItem = async function (itemId) {
        try {
            const formData = getFormDataForUpdate(itemId);
            const currentData = await get(ref(database, `productBacklog/${itemId}`));
            if (currentData.exists()) {
                const changes = getChanges(currentData.val(), formData);

                // Retrieve the current user from localStorage
                const currentUser = JSON.parse(localStorage.getItem('currentUser'));
                const updatedBy = currentUser ? currentUser.username : 'Unknown user';

                const updatedData = updateItemHistory(currentData.val(), formData, changes, updatedBy);
                await update(ref(database, `productBacklog/${itemId}`), updatedData);
                console.log('Data updated successfully');
                togglePopup();
            }
        } catch (error) {
            console.error("Error updating data:", error);
        }
    }

    // Function to get form data for update
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

    // Function to update item history
    function updateItemHistory(currentData, formData, changes, updatedBy) {
        if (!currentData.history) currentData.history = [];
        currentData.history.push({
            action: 'Modified',
            timestamp: new Date().toLocaleString('en-GB', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit', second: '2-digit'
            }).replace(/\//g, '-'),
            changes: changes,
            updatedBy: updatedBy // Add this line
        });

        formData.history = currentData.history;
        return formData;
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

    // Event listeners
    document.addEventListener('DOMContentLoaded', () => {
        fetchProductBacklog();
        document.getElementById('sortButton').addEventListener('click', showSortingPopup);
        document.getElementById('filterButton').addEventListener('click', showFilterPopup);
    });

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-item')) {
            event.preventDefault();
            showDeleteConfirmation(event.target.getAttribute('data-item-id'));
        }
    });

    document.addEventListener('click', (event) => {
        if (event.target.classList.contains('edit-item')) {
            event.preventDefault();
            const itemId = event.target.getAttribute('data-item-id');
            get(ref(database, `productBacklog/${itemId}`)).then((snapshot) => {
                if (snapshot.exists()) {
                    const item = snapshot.val();
                    item.key = itemId;
                    setFormMode('edit', item);
                }
            }).catch(console.error);
        }
    });

    document.addEventListener('DOMContentLoaded', function () {
        const addButton = document.querySelector('.btn-lg.btn-8-style');
        if (addButton) {
            addButton.addEventListener('click', function (event) {
                console.log('Add button clicked via event listener');
                handleAddButtonClick(event);
            });
        } else {
            console.error('Add button not found');
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        setupRealtimeListener();
        document.getElementById('sortButton').addEventListener('click', showSortingPopup);
        document.getElementById('filterButton').addEventListener('click', showFilterPopup);
    });

    window.setupRealtimeListener = setupRealtimeListener;
    window.fetchProductBacklog = fetchProductBacklog;
    window.sendFormDataToFirebase = sendFormDataToFirebase;
    document.querySelector('.btn-lg.btn-8-style').addEventListener('click', function (event) {
        event.preventDefault();
        setFormMode('add');
    });

    document.getElementById('overlay').addEventListener('click', function () {
        togglePopup();
        hideTagSelectionPopup();
    });

    document.addEventListener('click', (event) => {
        const card = event.target.closest('.card');
        if (card && !event.target.closest('.dropdown, .btn-link')) {
            const itemId = card.getAttribute('data-item-id');
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

    // Fetch users from Firebase and populate the assignee dropdown
    async function fetchUsers() {
        const usersRef = ref(database, 'users'); // Reference to the users node
        try {
            const snapshot = await get(usersRef);
            if (snapshot.exists()) {
                const users = snapshot.val();
                const assigneeSelect = document.getElementById('assignee');
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
    document.addEventListener('DOMContentLoaded', fetchUsers);