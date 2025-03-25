// Configuration
const CONFIG = {
  BLOB_TOKEN: "vercel_blob_rw_SpBSMVEscBql0aDk_Zwsp5gzBRdGaCwYB0xPD72BTOHWeQt",
  BLOB_URL: "https://spbsmvescbql0adk.public.blob.vercel-storage.com/secure/users.json",
  APP_NAME: "VGames",
  SUPPORT_EMAIL: "support@vgames.run.place"
};

// DOM Elements
const elements = {
  notification: document.getElementById('notification'),
  forms: {
    login: document.getElementById('loginForm'),
    create: document.getElementById('createAccountForm'),
    forgot: document.getElementById('forgotPasswordForm'),
    reset: document.getElementById('resetPasswordForm')
  }
};

// Initialize Auth Pages
document.addEventListener('DOMContentLoaded', () => {
  // Load appropriate page script based on current path
  const path = window.location.pathname;
  
  if (path.includes('login.html')) initLoginPage();
  if (path.includes('create.html')) initCreatePage();
  if (path.includes('forgot-password.html')) initForgotPasswordPage();
  if (path.includes('reset-password.html')) initResetPasswordPage();
});

// Core Authentication Functions
async function blobRequest(method, data = null) {
  try {
    const response = await fetch(CONFIG.BLOB_URL, {
      method,
      headers: {
        'Authorization': `Bearer ${CONFIG.BLOB_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : null
    });
    
    if (response.status === 404) return null;
    return await response.json();
  } catch (error) {
    console.error('Blob request failed:', error);
    return null;
  }
}

function showNotification(message, type = 'success', duration = 5000) {
  const notification = elements.notification;
  notification.textContent = message;
  notification.className = `notification ${type} show`;
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, duration);
}

// Password Security (Basic implementation)
function hashPassword(password) {
  // Note: Replace with bcrypt in production
  return btoa(encodeURIComponent(password + CONFIG.APP_NAME));
}

// Page-specific Initializers
function initLoginPage() {
  if (!elements.forms.login) return;
  
  elements.forms.login.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('loginUsername').value.trim();
    const password = hashPassword(document.getElementById('loginPassword').value);
    
    const users = await blobRequest('GET');
    const user = users?.find(u => 
      (u.username === username || u.email === username) && 
      u.password === password
    );
    
    if (user) {
      showNotification('Login successful!', 'success');
      // Redirect to dashboard after delay
      setTimeout(() => {
        window.location.href = '/dashboard/';
      }, 1500);
    } else {
      showNotification('Invalid credentials', 'error');
    }
  });
}

// ... (Other init functions for create/forgot/reset pages)

// Utility Functions (to be moved to utils.js if needed)
function validateUsername(username) {
  return /\d/.test(username); // Requires at least one number
}

function validatePassword(password) {
  return password.length >= 8;
}
