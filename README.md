# COGNITO LMS

COGNITO is a **Student Learning Management System (LMS)** built using the **MERN stack** (MongoDB, Express.js, React, and Node.js). It provides role-based access for students, faculty, and admins, facilitating authentication, course management, and exam administration.

## 📌 Current Status
✅ **Authentication Module Completed** (Signup, Login, Forgot Password, Reset Password)  
🚧 **Exam Management Module Under Development**

---

## 🚀 Tech Stack

### **Frontend**:
- Vite + React.js
- Tailwind CSS
- React Router
- Axios

### **Backend**:
- Node.js & Express.js
- MongoDB (Compass)
- JWT Authentication
- bcrypt for Password Hashing

---

## 🔧 Installation & Setup

### **1️⃣ Clone the Repository**
```sh
# Clone the repo
git clone https://github.com/Pratimsarkar02/cognito-lms-tool.git
cd lms-app
```

### **2️⃣ Setup the Backend**
```sh
cd backend  # Navigate to the backend directory
npm install  # Install dependencies
```

#### **Create a `.env` file inside `backend/` and add the following:**
```env
MONGODB_URI = 'mongodb://localhost:27017'
JWT_SECRET_KEY = 'secret#text'
NODE_ENV = 'development'
SMTP_USER = 'your-smtp-user-login-details'
SMTP_PASS = "your-smtp-password"
SENDER_MAIL = "sender-email"
```

```sh
# Run the backend server
npm run server
```
Backend will start on `http://localhost:5000`

---

### **3️⃣ Setup the Frontend**
```sh
cd frontend  # Navigate to the frontend directory
npm install  # Install dependencies
```

#### **Create a `.env` file inside `frontend/` and add:**
```env
VITE_BACKEND_URL = 'http://localhost:5000'
```

```sh
# Run the frontend
npm run dev
```
Frontend will start on `http://localhost:5173`

---

## 📌 Features Implemented
- ✅ User Authentication (Signup, Login, Logout, Forgot/Reset Password)
- ✅ Role-based Dashboards (Student, Faculty, Admin)
- 🚧 Exam Management System Module (In Progress)

---

## 📂 Project Structure
```
lms-app
├─ backend
│  ├─ config
│  │  ├─ mongodb.js
│  │  └─ nodemailer.js
│  ├─ controllers
│  │  ├─ analyticsController.js
│  │  ├─ authController.js
│  │  ├─ examController.js
│  │  ├─ examLogController.js
│  │  ├─ exportController.js
│  │  ├─ questionController.js
│  │  ├─ responseController.js
│  │  ├─ resultController.js
│  │  └─ userController.js
│  ├─ middleware
│  │  ├─ examMiddleware.js
│  │  ├─ loggingMiddleware.js
│  │  ├─ questionValidation.js
│  │  ├─ roleMiddleware.js
│  │  ├─ timeoutMiddleware.js
│  │  └─ userAuth.js
│  ├─ models
│  │  ├─ accomodationModel.js
│  │  ├─ analyticsModel.js
│  │  ├─ examAttemptModel.js
│  │  ├─ examLogModel.js
│  │  ├─ examModel.js
│  │  ├─ exportProfile.js
│  │  ├─ notificationModel.js
│  │  ├─ questionModel.js
│  │  ├─ responseModel.js
│  │  ├─ resultModel.js
│  │  ├─ sectionModel.js
│  │  └─ userModel.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ analyticsRoutes.js
│  │  ├─ authRoutes.js
│  │  ├─ examLogRoutes.js
│  │  ├─ examRoutes.js
│  │  ├─ questionRoutes.js
│  │  ├─ responseRoutes.js
│  │  ├─ resultRoutes.js
│  │  └─ userRoutes.js
│  └─ server.js
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  └─ vite.svg
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ chalkboard-user-solid.svg
│  │  │  ├─ google.png
│  │  │  ├─ hero-pg-photo.png
│  │  │  ├─ logo.svg
│  │  │  └─ teacher.png
│  │  ├─ components
│  │  │  ├─ auth
│  │  │  ├─ auth-backup
│  │  │  │  ├─ AuthTabs.jsx
│  │  │  │  ├─ LoginForm.jsx
│  │  │  │  └─ SignUpForm.jsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ EmailBanner.jsx
│  │  │  │  └─ Navbar.jsx
│  │  │  ├─ Features.tsx
│  │  │  ├─ Footer.tsx
│  │  │  ├─ Hero.tsx
│  │  │  ├─ icons
│  │  │  │  └─ GoogleIcon.jsx
│  │  │  ├─ Navbar.tsx
│  │  │  ├─ TestimonialCard.tsx
│  │  │  └─ Testimonials.tsx
│  │  ├─ contexts
│  │  │  ├─ AppContext.js
│  │  │  └─ AppContext.jsx
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  └─ utils.js
│  │  ├─ main.jsx
│  │  └─ pages
│  │     ├─ auth
│  │     │  ├─ EmailVerify.jsx
│  │     │  ├─ Login.jsx
│  │     │  └─ ResetPassword.jsx
│  │     ├─ dashboard
│  │     │  ├─ AdminDashboard.jsx
│  │     │  ├─ StudentDashboard.jsx
│  │     │  └─ TeacherDashboard.jsx
│  │     └─ landing
│  │        ├─ About.jsx
│  │        ├─ ContactUs.jsx
│  │        └─ LandingPage.jsx
│  └─ vite.config.js
└─ README.md

```
---

## 📖 Usage
1. Open `http://localhost:5173`
2. Create an account or log in
3. Depending on your role, you’ll be redirected to the **Student, Faculty, or Admin dashboard**
4. Faculty/Admin can manage courses, students, and exams (Coming Soon)

---

## 📜 `.gitignore` Configuration
A single `.gitignore` file at the project root excludes unnecessary files:
```gitignore
# Node.js Dependencies
node_modules/

# Environment Variables
*.env

# Build Files
dist/
.cache/
.vscode/
frontend/.vite/

# Logs and Debugging Files
logs/
debug.log
error.log

# OS-Specific Files
.DS_Store
Thumbs.db
```

---

## 🤝 Contributing
Want to contribute? Feel free to fork the repo, create a feature branch, and submit a pull request!

---


### 📩 Contact
For any queries or suggestions, feel free to reach out!
- **Email**: help.cognito@gmail.com
- **GitHub**: [Pratimsarkar02](https://github.com/Pratimsarkar02)

```
lms-app
├─ backend
│  ├─ config
│  │  ├─ mongodb.js
│  │  └─ nodemailer.js
│  ├─ controllers
│  │  ├─ analyticsController.js
│  │  ├─ authController.js
│  │  ├─ examController.js
│  │  ├─ examLogController.js
│  │  ├─ exportController.js
│  │  ├─ questionController.js
│  │  ├─ responseController.js
│  │  ├─ resultController.js
│  │  └─ userController.js
│  ├─ middleware
│  │  ├─ checkAttemptExists.js
│  │  ├─ examMiddleware.js
│  │  ├─ loggingMiddleware.js
│  │  ├─ questionValidation.js
│  │  ├─ roleMiddleware.js
│  │  ├─ timeoutMiddleware.js
│  │  └─ userAuth.js
│  ├─ models
│  │  ├─ accomodationModel.js
│  │  ├─ analyticsModel.js
│  │  ├─ examAttemptModel.js
│  │  ├─ examLogModel.js
│  │  ├─ examModel.js
│  │  ├─ exportProfile.js
│  │  ├─ notificationModel.js
│  │  ├─ questionModel.js
│  │  ├─ responseModel.js
│  │  ├─ resultModel.js
│  │  ├─ sectionModel.js
│  │  └─ userModel.js
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ routes
│  │  ├─ analyticsRoutes.js
│  │  ├─ authRoutes.js
│  │  ├─ examLogRoutes.js
│  │  ├─ examRoutes.js
│  │  ├─ questionRoutes.js
│  │  ├─ responseRoutes.js
│  │  ├─ resultRoutes.js
│  │  └─ userRoutes.js
│  ├─ server.js
│  └─ utils
│     └─ cleanup.js
├─ frontend
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ public
│  │  └─ vite.svg
│  ├─ src
│  │  ├─ App.jsx
│  │  ├─ assets
│  │  │  ├─ chalkboard-user-solid.svg
│  │  │  ├─ google.png
│  │  │  ├─ hero-pg-photo.png
│  │  │  ├─ logo.svg
│  │  │  └─ teacher.png
│  │  ├─ components
│  │  │  ├─ auth
│  │  │  │  ├─ ProtectedRoute.jsx
│  │  │  │  └─ PublicRoute.jsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ EmailBanner.jsx
│  │  │  │  ├─ ExamCard.jsx
│  │  │  │  ├─ LoadingSkeleton.jsx
│  │  │  │  ├─ Navbar.jsx
│  │  │  │  ├─ Sidebar.jsx
│  │  │  │  └─ Timer.jsx
│  │  │  ├─ Features.tsx
│  │  │  ├─ Footer.tsx
│  │  │  ├─ Hero.tsx
│  │  │  ├─ icons
│  │  │  │  └─ GoogleIcon.jsx
│  │  │  ├─ Navbar.tsx
│  │  │  ├─ TestimonialCard.tsx
│  │  │  └─ Testimonials.tsx
│  │  ├─ contexts
│  │  │  ├─ AppContext.js
│  │  │  └─ AppContext.jsx
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  └─ utils.js
│  │  ├─ main.jsx
│  │  └─ pages
│  │     ├─ auth
│  │     │  ├─ EmailVerify.jsx
│  │     │  ├─ Login.jsx
│  │     │  └─ ResetPassword.jsx
│  │     ├─ dashboard
│  │     │  ├─ AdminDashboard.jsx
│  │     │  ├─ components
│  │     │  │  ├─ DashboardHome.jsx
│  │     │  │  ├─ ExamDetails.jsx
│  │     │  │  ├─ ExamInstructionsModal.jsx
│  │     │  │  ├─ ExamInterface.jsx
│  │     │  │  ├─ ExamList.jsx
│  │     │  │  ├─ ExamResults.jsx
│  │     │  │  ├─ ExamReview.jsx
│  │     │  │  ├─ SettingsPage.jsx
│  │     │  │  └─ UserProfile.jsx
│  │     │  ├─ FacultyDashboard.jsx
│  │     │  └─ StudentDashboard.jsx
│  │     └─ landing
│  │        ├─ About.jsx
│  │        ├─ ContactUs.jsx
│  │        └─ LandingPage.jsx
│  └─ vite.config.js
└─ README.md

```