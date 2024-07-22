
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
     
      // const credential = GoogleAuthProvider.credentialFromResult(result);
      const user = result.user;
      fetch('/google-authentication', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: user.displayName,
          email: user.email
        })
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          window.location.href = '/';
        } else {
          Swal.fire({
            title: 'Error!',
            text: data.message,
            icon: 'error',
            confirmButtonText: 'OK'
          });
        }
      });
    }).catch((error) => {
      console.error("Error during sign-in: ", error);
      Swal.fire({
        title: 'Error!',
        text: error.message,
        icon: 'error',
        confirmButtonText: 'OK'
      });
    });
  });