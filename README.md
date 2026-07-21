# 🚀 ResumateAI

An AI-powered Resume Analyzer built with **Spring Boot, MySQL, HTML, CSS, and JavaScript**. ResumateAI helps users analyze resumes, calculate ATS scores, identify missing skills, generate AI-powered suggestions, and prepare for interviews.

---

## ✨ Features

- 🔐 User Authentication (Login & Signup)
- 📄 Resume Upload (PDF & DOCX)
- 🤖 AI-Powered Resume Analysis
- 📊 ATS Score Generation
- 🧠 AI Resume Suggestions
- 💼 Career Roadmap
- 🎯 Interview Preparation
- 📱 Responsive UI
- ⚡ Spring Boot REST APIs
- 🗄️ MySQL Database

---

## 🛠️ Tech Stack

### Frontend
- HTML5
- CSS3
- JavaScript (Vanilla)

### Backend
- Spring Boot
- Spring Data JPA
- Maven

### Database
- MySQL

### AI Integration
- OpenRouter API

---

## 📂 Project Structure

```
ResumateAI/
│
├── Backend/
│   ├── Spring Boot
│   ├── REST APIs
│   └── MySQL Configuration
│
└── Frontend/
    ├── HTML
    ├── CSS
    ├── JavaScript
    └── Assets
```

---

## ⚙️ Prerequisites

Make sure the following software is installed:

- Java 17+
- Git
- MySQL 8+
- VS Code (Recommended)
- Live Server Extension

---

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/ResumateAI.git
cd ResumateAI
```

### 2. Create Database

Open MySQL and run:

```sql
CREATE DATABASE resumateai;
```

### 3. Configure Backend

Create or update:

```
Backend/src/main/resources/application.properties
```

Add your configuration:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/resumateai
spring.datasource.username=root
spring.datasource.password=YOUR_PASSWORD

spring.jpa.hibernate.ddl-auto=update

openrouter.api.key=YOUR_OPENROUTER_API_KEY
```

---

### 4. Run Backend

```bash
cd Backend
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Backend runs on:

```
http://localhost:8080
```

---

### 5. Run Frontend

Open the **Frontend** folder in VS Code.

Open:

```
index.html
```

using **Live Server**.

Frontend:

```
http://127.0.0.1:5500
```

---

## 🧪 Demo Flow

1. Sign Up
2. Login
3. Upload Resume
4. Analyze Resume
5. View ATS Score
6. Review AI Suggestions
7. Explore Career Roadmap
8. Practice Interview Questions

---

## 📸 Screenshots

Add screenshots here:

- Login Page
- Dashboard
- Resume Upload
- Resume Analysis
- Results Page
- Career Roadmap

---

## 🔮 Future Improvements

- JWT Authentication
- Analysis History
- Cloud Deployment
- Admin Dashboard
- Email Notifications

---

## 👨‍💻 Author

**Abhay Pratap Singh Yadav**

GitHub: https://github.com/yadavabhayy

---

## 📄 License

This project is developed for the learning and portfolio purposes.
