    // Global variables
    let currentSprintId = null;
    let timeSpentData = {};
    let userTimeSpentChartInstance = null;

    // Function to handle adding a new sprint
    window.handleAddMemberClick = function (event) {
        event.preventDefault();
        setMemberFormMode('add');
    }


    // Function to show delete confirmation
    function showDeleteConfirmation(sprintId) {
        const popup = document.getElementById('delete-confirmation-popup');
        popup.style.display = 'block';
        document.getElementById('overlay').classList.add('open');

        // Set up event listeners for delete confirmation
        document.querySelector('#delete-confirmation-popup .btn-secondary').onclick = hideDeleteConfirmation;
        document.querySelector('#delete-confirmation-popup .btn-danger').onclick = () => {
            deleteMember(sprintId);
            hideDeleteConfirmation();
        };
    }

    // Function to hide delete confirmation
    function hideDeleteConfirmation() {
        document.getElementById('delete-confirmation-popup').style.display = 'none';
        document.getElementById('overlay').classList.remove('open');
    }

    // Function to show user detail
    function showUserDetails(user) {
        const popup = document.getElementById('userDetailsPopup');
        const overlay = document.getElementById('overlay');

        document.getElementById('userUsername').textContent = user.username;

        // Reset the chart canvas
        const chartCanvas = document.getElementById('userTimeSpentChart');
        chartCanvas.width = chartCanvas.width;

        // Fetch time spent data for the user
        fetchUserTimeSpentData(user.username).then(data => {
            timeSpentData = data;
            const totalTimeSpent = calculateTotalTimeSpent(timeSpentData);
            document.getElementById('userTotalTimeSpent').textContent = totalTimeSpent;

            renderUserTimeSpentChart(timeSpentData);
        });

        // Add event listener for the filter button
        const filterButton = document.getElementById('filterButton');
        filterButton.addEventListener('click', showFilterTimeSpentPopup);

        popup.classList.add('open');
        overlay.style.display = 'block';
    }


    // Function to create bar chart
    function renderUserTimeSpentChart(timeSpentData) {
        const ctx = document.getElementById('userTimeSpentChart').getContext('2d');

        // Destroy the existing chart if it exists
        if (userTimeSpentChartInstance) {
            userTimeSpentChartInstance.destroy();
        }

        const dates = Object.keys(timeSpentData).sort();
        const timeSpent = dates.map(date => timeSpentData[date]);

        userTimeSpentChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: dates,
                datasets: [{
                    label: 'Time Spent (hours)',
                    data: timeSpent,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Time Spent (hours)'
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: 'Date'
                        }
                    }
                }
            }
        });
    }

    // Function to calculate time spend for user
    function calculateTotalTimeSpent(timespent) {
        if (!timespent || typeof timespent !== 'object') return '0 hours';

        const totalHours = Object.values(timespent).reduce((sum, value) => sum + value, 0);
        return `${totalHours.toFixed(2)} hours`;
    }

    // Function to show filter popup
    function showFilterTimeSpentPopup() {
        const popup = document.getElementById('filter-time-spent-popup');
        popup.style.display = 'block';
    }

    // Function to hide filter popup
    function hideFilterTimeSpentPopup() {
        const popup = document.getElementById('filter-time-spent-popup');
        popup.style.display = 'none';
    }

    // Function to handle overlay clicks
    function setupFilterPopupOverlay() {
        const popup = document.getElementById('filter-time-spent-popup');
        const overlay = popup.querySelector('.filter-overlay');

        overlay.addEventListener('click', hideFilterTimeSpentPopup);
    }

    // Function to filter by date
    function filterDataByDateRange(dates, durations, startDate, endDate) {
        const filteredDates = [];
        const filteredDurations = [];

        for (let i = 0; i < dates.length; i++) {
            if (dates[i] >= startDate && dates[i] <= endDate) {
                filteredDates.push(dates[i]);
                filteredDurations.push(durations[i]);
            }
        }

        return { dates: filteredDates, durations: filteredDurations };
    }

    function applyDateFilter() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;

        if (startDate && endDate) {
            const filteredData = filterDataByDateRange(Object.keys(timeSpentData), Object.values(timeSpentData), startDate, endDate);
            const filteredTimeSpentData = Object.fromEntries(filteredData.dates.map((date, index) => [date, filteredData.durations[index]]));

            const totalTimeSpent = calculateTotalTimeSpent(filteredTimeSpentData);
            document.getElementById('userTotalTimeSpent').textContent = totalTimeSpent;

            renderUserTimeSpentChart(filteredTimeSpentData);
            hideFilterTimeSpentPopup();
        } else {
            alert('Please select both start and end dates.');
        }
    }

    function resetDateFilter() {
        document.getElementById('start-date').value = '';
        document.getElementById('end-date').value = '';
        const totalTimeSpent = calculateTotalTimeSpent(timeSpentData);
        document.getElementById('userTotalTimeSpent').textContent = totalTimeSpent;
        renderUserTimeSpentChart(timeSpentData);
        hideFilterTimeSpentPopup();
    }

