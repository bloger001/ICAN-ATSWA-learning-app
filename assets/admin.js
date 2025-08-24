const ADMIN_EMAIL = "offixcialbloger@gmail.com";
const KEY = "admin_gate_ok";
// SHA-256("FT24ACC245")
const STORED_HASH = "f7c93bce4fbefe718d8672e7fb9a2d8c28d8a3c3d4c13b32f0357baaec70422f";

const who = document.getElementById('who');
const gate = document.getElementById('gate');
const adminApp = document.getElementById('adminApp');
const verifyBtn = document.getElementById('verifyBtn');
const adminCodeInput = document.getElementById('adminCode');

const auth2 = firebase.auth();

auth2.onAuthStateChanged((user)=>{
  if(!user){
    who.textContent = "Not signed in";
    gate.innerHTML = `<p>Please sign in on the home page first.</p><a class="btn" href="./">Go to Home</a>`;
    return;
  }
  who.textContent = user.email;
  if(user.email !== ADMIN_EMAIL){
    gate.innerHTML = `<p>Access denied. Use <strong>${ADMIN_EMAIL}</strong>.</p><a class="btn" href="./">Back</a>`;
    return;
  }
  if(sessionStorage.getItem(KEY)==="1"){
    gate.style.display='none'; adminApp.style.display='';
  }
});

verifyBtn?.addEventListener('click', async ()=>{
  const code = adminCodeInput.value.trim();
  const hash = await sha256(code);
  if(hash===STORED_HASH){
    sessionStorage.setItem(KEY,"1");
    gate.style.display='none';
    adminApp.style.display='';
  } else {
    alert("Wrong code");
  }
});

async function sha256(str){
  const buf=await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
