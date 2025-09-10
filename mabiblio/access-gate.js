// ===================== CONFIG =====================
const API_BASE = "http://localhost:8000/api"; // <-- remplace par ton domaine (https://…/api)
const SALAIRES_URL = "salaire.html";          // page à ouvrir si accès OK
// =================================================

(function(){
  const btnSalaires = document.getElementById("btn-salaires");
  const modal = document.getElementById("codeModal");
  const inputCode = document.getElementById("userCode");
  const btnValidate = document.getElementById("validateCode");
  const btnCancel = document.getElementById("cancelCode");
  const errBox = document.getElementById("codeErr");

  const deviceId = getOrCreateDeviceId();
  const deviceHash = simpleHash(navigator.userAgent + "|" + deviceId);

  function toggleModal(show){
    if(!modal) return;
    modal.style.display = show ? "block" : "none";
    if (show) { inputCode.value = ""; errBox.textContent = ""; setTimeout(()=>inputCode?.focus(), 50); }
  }

  btnSalaires?.addEventListener("click", async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("salaires_token");
    if (token && await checkToken(token)) { window.location.href = SALAIRES_URL; return; }
    toggleModal(true);
  });

  btnValidate?.addEventListener("click", async () => {
    const code = (inputCode?.value || "").trim().toUpperCase();
    if (!code) { errBox.textContent = "Veuillez saisir un code."; return; }
    errBox.textContent = "";

    try{
      const res = await fetch(`${API_BASE}/claim`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ code, device_hash: deviceHash })
      });
      const data = await res.json().catch(()=>({}));
      if (!res.ok) throw new Error(data?.detail || "Code invalide ou déjà utilisé sur un autre appareil.");
      const { token } = data;
      if (!token) throw new Error("Réponse inattendue du serveur.");
      localStorage.setItem("salaires_token", token);
      toggleModal(false);
      window.location.href = SALAIRES_URL;
    }catch(err){
      errBox.textContent = (err && err.message) ? err.message : "Erreur réseau.";
    }
  });

  btnCancel?.addEventListener("click", () => toggleModal(false));

  async function checkToken(token){
    try{
      const res = await fetch(`${API_BASE}/check`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ token, device_hash: deviceHash })
      });
      return res.ok;
    }catch{ return false; }
  }

  function getOrCreateDeviceId(){
    const k = "device_id_v1";
    let v = localStorage.getItem(k);
    if (!v){ v = cryptoRandom(); localStorage.setItem(k, v); }
    return v;
  }

  function cryptoRandom(){
    if (window.crypto?.getRandomValues){
      const a = new Uint32Array(4); crypto.getRandomValues(a);
      return [...a].map(n => n.toString(16)).join("");
    }
    return String(Math.random()).slice(2) + Date.now().toString(16);
  }

  function simpleHash(s){
    let h = 2166136261;
    for (let i=0;i<s.length;i++){
      h ^= s.charCodeAt(i);
      h += (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24);
    }
    return (h>>>0).toString(16);
  }
})();