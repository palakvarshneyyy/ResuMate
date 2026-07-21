const AUTH_API_BASE_URL = "http://localhost:8080/api/auth";
const AUTH_EMAIL_KEY = "resumateUserEmail";

let authRequestInProgress = false;

function getAuthenticatedEmail() {
    return sessionStorage.getItem(AUTH_EMAIL_KEY);
}

function setAuthenticatedEmail(email) {
    sessionStorage.setItem(AUTH_EMAIL_KEY, email);
}

function clearAuthenticatedEmail() {
    sessionStorage.removeItem(AUTH_EMAIL_KEY);
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showAuthMessage(message, type) {
    const messageBox = document.getElementById("authMessage");

    if (!messageBox) {
        return;
    }

    messageBox.textContent = message;
    messageBox.className = "auth-message " + type;
    messageBox.style.display = "block";
}

function setAuthButtonLoading(button, isLoading, loadingText) {
    if (!button) {
        return;
    }

    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = loadingText;
        button.disabled = true;
        return;
    }

    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
}

async function postAuthRequest(path, payload) {
    const response = await fetch(AUTH_API_BASE_URL + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const message = await response.text();

    return {
        ok: response.ok,
        message: message
    };
}

async function handleLogin(event) {
    event.preventDefault();

    if (authRequestInProgress) {
        return;
    }

    const form = event.currentTarget;
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitButton = form.querySelector("button[type='submit']");
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        showAuthMessage("Please enter both email and password.", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage("Please enter a valid email address.", "error");
        return;
    }

    authRequestInProgress = true;
    setAuthButtonLoading(submitButton, true, "Logging in...");
    showAuthMessage("Checking your account...", "info");

    try {
        const result = await postAuthRequest("/login", {
            email: email,
            password: password
        });

        if (result.ok && result.message.trim() === "Login Successful!") {
            setAuthenticatedEmail(email);
            showAuthMessage("Login successful. Redirecting...", "success");

            setTimeout(function() {
                window.location.href = "index.html";
            }, 500);

            return;
        }

        showAuthMessage(result.message || "Login failed. Please try again.", "error");
    } catch (error) {
        console.error(error);
        showAuthMessage("Unable to connect to the server. Please try again.", "error");
    } finally {
        authRequestInProgress = false;
        setAuthButtonLoading(submitButton, false);
    }
}

async function handleSignup(event) {
    event.preventDefault();

    if (authRequestInProgress) {
        return;
    }

    const form = event.currentTarget;
    const fullNameInput = document.getElementById("fullName");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const submitButton = form.querySelector("button[type='submit']");
    const fullName = fullNameInput.value.trim();
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!fullName || !email || !password) {
        showAuthMessage("Please complete all fields.", "error");
        return;
    }

    if (!isValidEmail(email)) {
        showAuthMessage("Please enter a valid email address.", "error");
        return;
    }

    if (password.length < 6) {
        showAuthMessage("Password must be at least 6 characters.", "error");
        return;
    }

    authRequestInProgress = true;
    setAuthButtonLoading(submitButton, true, "Creating account...");
    showAuthMessage("Creating your account...", "info");

    try {
        const result = await postAuthRequest("/signup", {
            fullName: fullName,
            email: email,
            password: password
        });

        if (result.ok && result.message.trim() === "User registered successfully!") {
            showAuthMessage("Account created. Redirecting to login...", "success");

            setTimeout(function() {
                window.location.href = "login.html";
            }, 700);

            return;
        }

        showAuthMessage(result.message || "Signup failed. Please try again.", "error");
    } catch (error) {
        console.error(error);
        showAuthMessage("Unable to connect to the server. Please try again.", "error");
    } finally {
        authRequestInProgress = false;
        setAuthButtonLoading(submitButton, false);
    }
}

function logout() {
    clearAuthenticatedEmail();
    window.location.href = "login.html";
}

function requireAuthentication() {
    if (!getAuthenticatedEmail()) {
        window.location.href = "login.html";
    }
}

function populateAuthUser() {
    const userEmail = getAuthenticatedEmail();
    const userElements = document.querySelectorAll("[data-auth-email]");

    userElements.forEach(function(element) {
        element.textContent = userEmail || "";
    });
}

document.addEventListener("DOMContentLoaded", function() {
    const requiresAuth = document.body.dataset.authRequired === "true";
    const authPage = document.body.dataset.authPage === "true";
    const loginForm = document.getElementById("loginForm");
    const signupForm = document.getElementById("signupForm");

    if (requiresAuth) {
        requireAuthentication();
        populateAuthUser();
    }

    if (authPage && getAuthenticatedEmail()) {
        window.location.href = "index.html";
        return;
    }

    if (loginForm) {
        loginForm.addEventListener("submit", handleLogin);
    }

    if (signupForm) {
        signupForm.addEventListener("submit", handleSignup);
    }
});
