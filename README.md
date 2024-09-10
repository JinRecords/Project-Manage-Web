# iZuck Digital

## Overview

This repository contains the codebase for our Project Management Tool, a web application designed to help teams manage projects, track progress, and collaborate effectively. Our tool is inspired by popular platforms like monday.com and Trello, and aims to streamline project management with customizable features tailored to our users' needs.

## Team

Our team consists of six  members, each contributing to different aspects of the project. We work collaboratively using Git for version control, with strict adherence to our Git policies to ensure smooth development and deployment processes.

## Git Workflow and Policies

To maintain code quality and ensure a smooth development process, we follow these Git policies:

1. **Branching Strategy**:
   - **Feature Branches**: Create a feature branch (`feature/your-feature-name`) for new features.
   - **Bugfix Branches**: Create a bugfix branch (`bugfix/issue-description`) for fixes.
   - **Hotfix Branches**: Create a hotfix branch (`hotfix/critical-fix`) for urgent changes that need to be addressed immediately.

2. **Commit Messages**:
   - Write clear and concise commit messages that describe the changes made in each commit.
   - Commit frequently with incremental changes to keep the history clean and manageable.

3. **Merge Requests (MRs)**:
   - All changes must go through a Merge Request (MR) before being merged into the main branch.
   - MRs should include a detailed description of the changes, screenshots (if applicable), and references to related tasks in monday.com.
   - Peer reviews are mandatory. A team member must review and approve the MR before it can be merged.

## Development Workflow

1. **Clone the Repository**:  
   Clone the repository to your local machine using:
   ```bash
   git clone https://git.infotech.monash.edu/fit2101/fit2101-s2-2024/MA_Wednesday12pm_Team6.git
   ```

2. **Create a Branch**:  
   Create a new branch based on the task you're working on:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Changes and Commit**:  
   Work on your feature or fix and commit your changes frequently:
   ```bash
   git add .
   git commit -m "A clear and concise commit message"
   ```

4. **Push Your Branch**:  
   Push your branch to the remote repository:
   ```bash
   git push origin feature/your-feature-name
   ```

5. **Open a Merge Request (MR)**:  
   Once your work is ready, open a Merge Request on GitLab. Make sure to include:
   - A detailed description of your changes.
   - Screenshots or other relevant media.
   - Links to related tasks in monday.com.

6. **Peer Review and Merge**:  
   A team member will review your MR. After approval, your changes will be merged into the main branch.

## Contributions

We welcome contributions from the team. Please follow the established Git policies and workflow to ensure consistency and quality in the codebase.


# Firebase Realtime Database API Documentation

## Initialization

Before using the Realtime Database, initialize Firebase in your application:

Website can be accessed [HERE](https://izuck-digital.web.app/)

## Team

const firebaseConfig = {
  // Your Firebase configuration object
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
```

## Add Data

To add new data to the database:

```javascript
import { ref, push, set } from "firebase/database";

function addData(path, data) {
  const newRef = push(ref(database, path));
  return set(newRef, data);
}

// Usage
addData("users", { name: "John Doe", email: "john@example.com" })
  .then(() => console.log("Data added successfully"))
  .catch((error) => console.error("Error adding data:", error));
```

## Fetch Data

To retrieve data from the database:

```javascript
import { ref, get } from "firebase/database";

function fetchData(path) {
  return get(ref(database, path)).then((snapshot) => {
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      console.log("No data available");
      return null;
    }
  });
}

// Usage
fetchData("users")
  .then((data) => console.log("Fetched data:", data))
  .catch((error) => console.error("Error fetching data:", error));
```

## Edit Data

To update existing data in the database:

```javascript
import { ref, update } from "firebase/database";

function editData(path, updates) {
  return update(ref(database, path), updates);
}

// Usage
editData("users/-NsomeUserId", { name: "Jane Doe" })
  .then(() => console.log("Data updated successfully"))
  .catch((error) => console.error("Error updating data:", error));
```

## Delete Data

To remove data from the database:

```javascript
import { ref, remove } from "firebase/database";

function deleteData(path) {
  return remove(ref(database, path));
}

// Usage
deleteData("users/-NsomeUserId")
  .then(() => console.log("Data deleted successfully"))
  .catch((error) => console.error("Error deleting data:", error));
```

## Real-time Listeners

To listen for real-time changes in the database:

```javascript
import { ref, onValue } from "firebase/database";

function listenForChanges(path, callback) {
  const dataRef = ref(database, path);
  return onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
}

// Usage
const unsubscribe = listenForChanges("users", (data) => {
  console.log("Data changed:", data);
});

// To stop listening
// unsubscribe();
```

This API documentation provides a basic overview of common operations for the Firebase Realtime Database.
```

Note: Please check discord for API information/credential.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

Last Updated: Jing Yang (11/09/2024, 00:07 PM)

