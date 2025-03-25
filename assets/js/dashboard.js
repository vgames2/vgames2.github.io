// Dashboard functionality
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication
  const session = localStorage.getItem('vgames_session');
  if (!session) {
    window.location.href = '/auth/login.html';
    return;
  }

  // Load user data
  try {
    const user = JSON.parse(session);
    updateDashboard(user);
  } catch (error) {
    console.error('Session parse error:', error);
    localStorage.removeItem('vgames_session');
    window.location.href = '/auth/login.html';
  }

  // Logout handler
  document.getElementById('logoutBtn')?.addEventListener('click', () => {
    localStorage.removeItem('vgames_session');
    window.location.href = '/';
  });
});

function updateDashboard(userData) {
  // Update DOM elements
  document.getElementById('welcomeMessage').textContent = 
    `Welcome back, ${userData.name}!`;
  
  document.getElementById('userEmail').textContent = userData.email;
  document.getElementById('userAge').textContent = userData.age;
  document.getElementById('userCountry').textContent = userData.country;
  
  // Format join date
  const joinDate = new Date(userData.createdAt);
  document.getElementById('userSince').textContent = 
    joinDate.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
}
