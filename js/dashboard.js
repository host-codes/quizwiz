document.addEventListener('DOMContentLoaded', () => {
    // Load user data
    const user = JSON.parse(localStorage.getItem('user'));
    if (user) {
        document.getElementById('usernameDisplay').textContent = user.name;
        
        // Display first letter as avatar if no image
        const avatar = document.querySelector('.user-avatar');
        if (!avatar.innerHTML.includes('fa-user-circle')) {
            avatar.textContent = user.name.charAt(0).toUpperCase();
        }
    }
    
    // Fetch user stats (example - replace with actual API calls)
    fetchUserStats();
});

async function fetchUserStats() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/user/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            document.getElementById('testsCompleted').textContent = data.testsCompleted;
            document.getElementById('currentStreak').textContent = `${data.currentStreak} days`;
            document.getElementById('accuracy').textContent = `${data.accuracy}%`;
        }
    } catch (error) {
        console.error('Error fetching user stats:', error);
    }
}