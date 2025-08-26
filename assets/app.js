<script>
// App glue: binds the Google button, reflects auth state, and gates quiz access.

(function () {
  const $ = (sel) => document.querySelector(sel);

  // UI elements that may or may not exist on the current page
  const googleBtn = $('#googleBtn');
  const signOutBtn = $('#signOutBtn');
  const authBadge  = $('#authBadge'); // small "Not signed in" / email text
  const authedBlocks = document.querySelectorAll('[data-when="signed-in"]');
  const guestBlocks  = document.querySelectorAll('[data-when="signed-out"]');

  function showSignedIn(email) {
    if (authBadge) authBadge.textContent = email;
    authedBlocks.forEach(el => el.style.display = '');
    guestBlocks.forEach(el => el.style.display = 'none');
  }
  function showSignedOut() {
    if (authBadge) authBadge.textContent = 'Not signed in';
    authedBlocks.forEach(el => el.style.display = 'none');
    guestBlocks.forEach(el => el.style.display = '');
  }

  // Wait until Firebase is ready, then wire listeners
  (async function init() {
    if (!window.firebaseReady) {
      console.error('firebaseReady missing'); return;
    }
    await window.firebaseReady;

    const { auth, onAuthStateChanged, signInWithGoogle, signOutUser } = window.firebaseApi;

    // Button handlers (guard with existence so we can reuse this on all pages)
    if (googleBtn) {
      googleBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        googleBtn.disabled = true;
        try { await signInWithGoogle(); }
        catch (err) { alert('Sign-in failed: ' + err.message); }
        finally { googleBtn.disabled = false; }
      }, { passive: false });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', async () => {
        try { await signOutUser(); } catch {}
      });
    }

    // Reflect auth state in UI
    onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        showSignedIn(user.email);
        localStorage.setItem('ican_user', JSON.stringify({ uid: user.uid, email: user.email }));
      } else {
        showSignedOut();
        localStorage.removeItem('ican_user');
      }
    });

    // If we're on quiz.html, hard-gate access until signed in
    const quizGate = $('#quizGate'); // the black card that shows “Sign-in required”
    if (quizGate) {
      const enableQuiz = () => {
        quizGate.style.display = 'none';
        document.body.classList.add('quiz-unlocked');
      };
      const requireSignIn = () => {
        quizGate.style.display = '';
        document.body.classList.remove('quiz-unlocked');
      };
      onAuthStateChanged(auth, (user) => user ? enableQuiz() : requireSignIn());
    }
  })();
})();
</script>