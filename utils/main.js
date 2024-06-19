
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth , GoogleAuthProvider , signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
  const firebaseConfig = {
    apiKey: "AIzaSyCrane1NlrbE4tne1PIS4b3rU3ANAzV1ow",
    authDomain: "stingson-fashion.firebaseapp.com",
    projectId: "stingson-fashion",
    storageBucket: "stingson-fashion.appspot.com",
    messagingSenderId: "708881647474",
    appId: "1:708881647474:web:1fe22ebaa37530d8b5ffeb"
  };

  // Initialize Firebase
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  auth.languageCode = 'en';

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({
    prompt: 'select_account'
  })

  const googleLogin = document.getElementById("google-login-btn")
  googleLogin.addEventListener("click" , function(){
    signInWithPopup(auth, provider)
    .then((result) => {
     
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      console.log(user);
      window.location.href = "../home";
    }).catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;

    });
  })