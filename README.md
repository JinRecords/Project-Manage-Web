
# Firebase Realtime Database API Documentation

## Initialization

Before using the Realtime Database, initialize Firebase in your application:

```javascript
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

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