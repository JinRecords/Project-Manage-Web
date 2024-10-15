// Import necessary modules
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    get,
    set,
    remove,
    update,
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

// Add the authentication check here
const currentUser = JSON.parse(localStorage.getItem('currentUser'));
if (!currentUser) {
    window.location.href = '../index.html'; // Redirect to login if not authenticated
}

const isAdmin = currentUser.isAdmin;

// Function to toggle the add member popup
function toggleAddMemberPopup() {
    if (!isAdmin) {
        alert('Only admin can add new members');
        return;
    }
    const popup = document.getElementById('addMemberPopup');
    const overlay = document.getElementById('overlay');
    popup.classList.toggle('open');
    overlay.style.display = popup.classList.contains('open') ? 'block' : 'none';
}

// Function to toggle progress popup
function toggleProgressPopup() {
    console.log("Hahahah");
    const popup = document.getElementById('user-popup');
    popup.classList.toggle('open');
    console.log("Popup visibility:", popup.classList.contains('open'));
}

// Function to toggle filter popup
function toggleFilterTimeSpentPopup() {
    const popup = document.getElementById('filter-time-spent-popup');
    popup.style.display = popup.style.display === 'none' ? 'block' : 'none';
}

function closePopup() {
    const popup = document.getElementById('addMemberPopup');
    const overlay = document.getElementById('overlay');
    popup.classList.remove('open');
    overlay.style.display = 'none';
    document.getElementById('addMemberForm').reset(); // Reset the form when closing
}

window.saveNewMember = function () {
    const username = document.getElementById('newUsername').value;
    const password = document.getElementById('newPassword').value;

    if (username && password) {
        const newUserRef = ref(database, `users/${username}`);
        set(newUserRef, {
            username: username,
            password: password
        }).then(() => {
            console.log('New member added successfully');
            closePopup(); // Close the popup after successful save
            document.getElementById('addMemberForm').reset();
        }).catch((error) => {
            console.error('Error adding new member:', error);
        });
    } else {
        alert('Please fill in both fields');
    }
};

function hideUserDetails() {
    const popup = document.getElementById('userDetailsPopup');
    const overlay = document.getElementById('overlay');

    // Remove the event listener for the filter button
    const filterButton = document.getElementById('filterButton');
    filterButton.removeEventListener('click', showFilterTimeSpentPopup);

    popup.classList.remove('open');
    overlay.style.display = 'none';
}

// Make sure these functions are global
window.toggleAddMemberPopup = toggleAddMemberPopup;
window.closePopup = closePopup;
window.hideUserDetails = hideUserDetails;

// Add event listener to the add member button
document.getElementById('addMemberButton').addEventListener('click', toggleAddMemberPopup);

// Modify the Add Member button visibility
const addMemberButton = document.getElementById('addMemberButton');
if (!isAdmin) {
    addMemberButton.style.display = 'none';
}


// Function to fetch user data and create cards
function fetchUserDataAndCreateCards() {
    const userCardsContainer = document.getElementById('userCardsContainer');
    const usersRef = ref(database, 'users');

    onValue(usersRef, (snapshot) => {
        userCardsContainer.innerHTML = ''; // Clear existing cards
        const userData = snapshot.val();

        for (const userId in userData) {
            const user = userData[userId];
            // The timespent data is already in the user object
            console.log(`Timespent data for ${user.username}:`, user.timespent);
            const card = createUserCard(user);
            userCardsContainer.appendChild(card);
        }
    });
}

document.getElementById('overlay').addEventListener('click', function () {
    hideUserDetails();
});

// Function to create a user card
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'card mb-3';
    card.innerHTML = `
            <div class="card-header">
                <h3>${user.username}</h3>
                ${isAdmin ? `
                <div class="dropdown">
                    <button class="btn btn-link dropdown-toggle three-dot-menu" type="button" id="dropdownMenu-${user.username}" data-bs-toggle="dropdown" aria-expanded="false">⋮</button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownMenu-${user.username}">
                        <li><a class="dropdown-item text-danger delete-item" href="#" data-username="${user.username}">Delete</a></li>
                    </ul>
                </div>
                ` : ''}
            </div>
            <div class="card-body">
                <p>Team member</p>
                <button class="btn btn-secondary" disabled>User</button>
            </div>
        `;

    if (isAdmin) {
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown, .btn-link')) {
                showUserDetails(user);
            }
        });

        // Add event listener for delete button
        const deleteButton = card.querySelector('.delete-item');
        if (deleteButton) {
            deleteButton.addEventListener('click', (e) => {
                e.preventDefault();
                showDeleteConfirmation(user.username);
            });
        }
    }

    return card;
}

let userToDelete = null;

function showDeleteConfirmation(username) {
    if (!isAdmin) {
        alert('Only admin can delete members');
        return;
    }
    userToDelete = username;
    const popup = document.getElementById('deleteConfirmationPopup');
    const overlay = document.getElementById('overlay');
    popup.style.display = 'block';
    overlay.style.display = 'block';
}

function hideDeleteConfirmation() {
    const popup = document.getElementById('deleteConfirmationPopup');
    const overlay = document.getElementById('overlay');
    popup.style.display = 'none';
    overlay.style.display = 'none';
    userToDelete = null;
}

function confirmDelete() {
    if (userToDelete) {
        const userRef = ref(database, `users/${userToDelete}`);
        remove(userRef).then(() => {
            console.log('User deleted successfully');
            hideDeleteConfirmation();
            fetchUserDataAndCreateCards(); // Refresh the user list
        }).catch((error) => {
            console.error('Error deleting user:', error);
        });
    }
}

window.fetchUserTimeSpentData = async function (username) {
    const userRef = ref(database, `users/${username}/timespent`);
    const snapshot = await get(userRef);
    return snapshot.val() || {};
}

window.fetchAndDisplayProgressData = async function (taskId, startDate = null, endDate = null, reset = false) {
    const userRef = ref(database, `users/${username}`);
    const snapshot = await get(userRef);

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

// Make these functions global
window.showDeleteConfirmation = showDeleteConfirmation;
window.hideDeleteConfirmation = hideDeleteConfirmation;
window.confirmDelete = confirmDelete;


// Call this function when the page loads
document.addEventListener('DOMContentLoaded', fetchUserDataAndCreateCards);
document.addEventListener('DOMContentLoaded', setupFilterPopupOverlay);

document.addEventListener('DOMContentLoaded', () => {
    fetchUserDataAndCreateCards();
    if (!isAdmin) {
        document.getElementById('userCardsContainer').classList.add('read-only');
    }
});