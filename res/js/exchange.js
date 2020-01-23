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
  },
  collection: {
    listen: function(callback) {
      return db.collection("exchange").where("user", "==", api.account.user().uid).onSnapshot(qs => {
        var p = [];
        qs.forEach(doc => {
          p.push(doc.data());
        });
        callback(p);
      });
    }
  },
  sign: {
    listen: function() {
      return db.collection("user").doc(api.account.user().uid).onSnapshot(doc => {
        api.sign.data = doc.data();
        if(api.sign.data.last.toMillis() + 86400000 > Date.now()) {
          document.getElementById("sign-btn").innerHTML = "Sign again after " + ((api.sign.data.last.toDate() + 86400000 - Date.now())/1000) + " seconds";
          document.getElementById("sign-btn").disabled = true;
        }
        else {
          document.getElementById("sign-btn").innerHTML = "Sign Now";
          document.getElementById("sign-btn").disabled = false;
        }
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

async function parseCollection(raw) {
  var cc = document.getElementsByClassName("collection-container")[0];
  cc.innerHTML = "";
  var c = {};
  for(var i = 0; i < raw.length; i++) {
    if(!c[raw[i].belong]) c[raw[i].belong] = [];
    c[raw[i].belong].push(raw[i]);
  }
  for(var collection in c) {
    var puzzle = document.createElement("table");
    var area = JSON.parse(c[collection][0].position);
    for(var i = 0; i < area[0]; i++) {
      var r = document.createElement("tr");
      for(var j = 0; j < area[1]; j++) {
        var d = document.createElement("td");
        r.appendChild(d);
      }
      puzzle.appendChild(r);
    }
    for(var i in c[collection]) {
      var speice = c[collection][i];
      var img = document.createElement("img");
      img.src = await fetch("https://game-exchange-2020.firebaseio.com/exchange/puzzle/" + speice.pid + ".json").then(r=>r.json());
      speice.position = [JSON.parse(speice.position)[2],JSON.parse(speice.position)[3]];
      puzzle.children[speice.position[0]].children[speice.position[1]].appendChild(img);
      console.log(puzzle.children[speice.position[0]].children[speice.position[1]]);
    }
    cc.appendChild(puzzle);
  }
}

function SIGN() {
  if(api.sign.data.last.toMillis() + 86400000 > Date.now()) {
    console.log("SIGN FAILED");
  }
  else {
    var increment = Math.floor(20+Math.random()*20);
    db.collection("user").doc(api.account.user().uid).update({
      exp: firebase.firestore.FieldValue.increment(increment)
      last: Date()
    });
  }
}

firebase.auth().onAuthStateChanged(() => {
  if(api.account.user() === null) {
    togglePage("signin");
  }
  else {
    Array.from(document.getElementsByClassName("username")).forEach(elm => {
      elm.innerHTML = api.account.user().displayName;
    });
    window.collection = api.collection.listen(parseCollection);
    window.sign = api.sign.listen();
    togglePage("home");
  }
  document.getElementById("ba").remove();
});
