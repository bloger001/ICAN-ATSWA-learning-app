// assets/app.js
firebase.auth().onAuthStateChanged(user => {
  const statusBox = document.querySelector('.card');
  const signInBtn = document.getElementById('googleBtn');
  const signOutBtn = document.getElementById('signOutBtn');
  const quizTiles = document.querySelectorAll('.tile');
  
  if (user) {
    // Show signed in state
    document.getElementById('userStatus').innerText = `Signed in as ${user.email}`;
    signInBtn.style.display = 'none';
    signOutBtn.style.display = 'inline-block';

    // Unlock quizzes
    quizTiles.forEach(tile => {
      tile.classList.remove('disabled');
      tile.querySelector('.locked')?.remove();
    });

    // Fix welcome box
    statusBox.innerHTML = `
      <h2>Welcome</h2>
      <p>You are signed in, ${user.email}. Quizzes, leaderboard, and resources are unlocked ✅.</p>
    `;
  } else {
    // Show logged out state
    document.getElementById('userStatus').innerText = 'Not signed in';
    signInBtn.style.display = 'inline-block';
    signOutBtn.style.display = 'none';

    // Lock quizzes
    quizTiles.forEach(tile => {
      if (!tile.classList.contains('disabled')) {
        tile.classList.add('disabled');
        if (!tile.querySelector('.locked')) {
          const lock = document.createElement('div');
          lock.className = 'locked';
          lock.innerText = '🔒 Sign in required';
          tile.appendChild(lock);
        }
      }
    });

    // Reset welcome box
    statusBox.innerHTML = `
      <h2>Welcome</h2>
      <p>Please sign in to unlock quizzes, leaderboard and your personalized status.</p>
    `;
  }
});