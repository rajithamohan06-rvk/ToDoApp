# 📝 Minimal To-Do App

> A fast, clean, and lightweight task management web application built with **Node.js** and modern vanilla web technologies — featuring **zero external runtime dependencies**.

![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-purple.svg)
![Style](https://img.shields.io/badge/UI-Clean%20%26%20Minimal-orange.svg)

---

## ✨ Features

- **⚡ Fast & Lightweight**: Zero external runtime dependencies; starts up instantly.
- **🎯 Task Management**: Add tasks with titles, toggle completion status, and delete tasks effortlessly.
- **🔍 Smart Filters**: Filter views across **All**, **Active**, and **Completed** tasks with dynamic counter badges.
- **🧹 Batch Cleanup**: One-click *"Clear completed"* action to declutter your list.
- **💾 Persistent JSON Storage**: Tasks are automatically saved to `data/todos.json` so your data survives server restarts.
- **🌓 Adaptive Theme**: Automatic **Dark Mode** and **Light Mode** support based on system settings.
- **📱 Fully Responsive**: Thoughtfully designed for desktop, tablet, and mobile browsers.

---

## 🚀 Quick Start

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18.0.0 or higher).

### 1. Clone the repository
```bash
git clone https://github.com/your-username/minimal-todo-app.git
cd minimal-todo-app/ToDoApp
```

### 2. Start the server
```bash
node server.js
```
*(or run `npm start`)*

### 3. Open in Browser
Visit **[http://localhost:3000](http://localhost:3000)** to start organizing your day!

---

## 🛠️ Tech Stack

- **Backend**: Native Node.js HTTP module (`node:http`, `node:fs/promises`, `node:crypto`, `node:path`)
- **Frontend**: Vanilla HTML5, CSS3 (CSS Variables, Flexbox, Keyframe Animations), and ES6+ JavaScript
- **Database**: Local persistent JSON storage (`todos.json`)

---

## 📡 REST API Reference

| Method | Endpoint | Description | Payload Example |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/todos` | Retrieve all tasks | *None* |
| `POST` | `/api/todos` | Create a new task | `{ "title": "Buy groceries" }` |
| `PATCH` | `/api/todos/:id` | Toggle complete or edit title | `{ "completed": true }` |
| `DELETE` | `/api/todos/:id` | Delete a specific task | *None* |
| `POST` | `/api/todos/clear-completed` | Delete all completed tasks | *None* |

---

## 📁 Project Structure

```text
ToDoApp/
├── data/
│   └── todos.json          # Persistent JSON database
├── public/
│   ├── index.html          # Clean, semantic UI structure
│   ├── style.css           # Modern styling & auto dark/light mode
│   └── app.js              # Client-side reactivity & API integration
├── package.json            # Scripts & project metadata
├── server.js               # Node.js HTTP server & REST API
├── test.js                 # Automated API test suite
└── README.md               # Project documentation
```

---

## 🧪 Testing

To run the automated endpoint and static file tests:

```bash
npm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

