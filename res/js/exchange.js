window.exchange = {
  player: {},
  server: {}
};

window.api = {
  account: {
    user: function() {
      return firebase.auth().currentUser;
    },
    signup: function(email, password, name) {
      return firebase.auth().createUserWithEmailAndPassword(email, password)
      .catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      })
      .then(user => {
        console.log("ACCOUNT CREATED. "+user);
      })
      .then(() => {
        api.account.user().updateProfile({displayName: name})
        .then(() => {
          console.log("ACCOUNT NAME SET.");
          setTimeout(function(){location.reload();}, 500);
        })
        .catch(error => {
          console.error("ACCOUNT NAME SET ERROR.");
        });
      });
    },
    signin: function(email, password) {
      return firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      })
      .then(user => {
        console.log("ACCOUNT LOGGED IN. "+user);
        setTimeout(function(){location.reload();}, 500);
      });
    },
    signout: function() {
      return firebase.auth().signOut()
      .then(() => {
        console.log("ACCOUNT LOGGED OUT.");
        setTimeout(function(){location.reload();}, 500);
      }).catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      });
    }
  }
};

function togglePage(page) {
  Array.from(document.getElementsByClassName("page")).forEach(elm => {
    elm.style.display = "none";
  });
  Array.from(document.getElementsByClassName("nav-item")).forEach(elm => {
    elm.classList.remove("active");
  });
  document.getElementsByClassName("page-"+page)[0].style.display = "block";
  try { document.getElementsByClassName("nav-"+page)[0].classList.add("active"); } catch(e) {}
}

function signIn() {api.account.signin(document.getElementById("in-email").value, document.getElementById("in-password").value);};
function signUp() {
  if(document.getElementById("up-password").value === document.getElementById("up-password2").value && document.getElementById("up-password").value.length >= 8)
    api.account.signup(document.getElementById("up-email").value, document.getElementById("up-password").value, document.getElementById("up-name").value);
};

firebase.auth().onAuthStateChanged(() => {
  if(api.account.user() === null) {
    togglePage("signin");
  }
  else {
    Array.from(document.getElementsByClassName("username")).forEach(elm => {
      elm.innerHTML = api.account.user().displayName;
    });
    togglePage("home");
  }
  document.getElementById("ba").remove();
});
