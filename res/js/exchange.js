window.api = {
  account: {
    user: function() {
      return firebase.auth().currentUser;
    },
    signup: function(email, password, name) {
      Swal.fire({
        title: "Registering",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });
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
          Swal.fire("Success", "", "success");
          setTimeout(function(){location.reload();}, 500);
        })
        .catch(error => {
          console.error("ACCOUNT NAME SET ERROR.");
        });
      });
    },
    signin: function(email, password) {
      Swal.fire({
        title: "Authenticating",
        icon: "info",
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        allowEnterKey: false
      });
      return firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      })
      .then(user => {
        console.log("ACCOUNT LOGGED IN. "+user);
        Swal.fire("Success", "", "success");
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
        api.collection.data = p;
        if(api.collection.data.length > 0) callback(p);
        else getNew();
      });
    }
  },
  sign: {
    listen: function() {
      return db.collection("user").doc(api.account.user().uid).onSnapshot(doc => {
        if(!doc.metadata.hasPendingWrites) {
          api.sign.data = doc.data();
          if(api.sign.data === undefined) {
            db.collection("user").doc(api.account.user().uid).set({exp: 0, last: new Date(0)});
          }
          else {
            document.getElementById("level").innerHTML = "Level: " + Math.floor(api.sign.data.exp/100);
            document.getElementById("exp-bar").style.width = "" + (api.sign.data.exp%100) + "%";
            document.getElementById("exp").innerHTML = "" + (api.sign.data.exp%100) + " / 100";
            if(api.sign.data.last.toMillis() + 86400000 > Date.now()) {
              var timeleft = Math.floor((api.sign.data.last.toMillis() + 86400000 - Date.now())/1000);
              document.getElementById("sign-btn").innerHTML = "Sign again after " + (timeleft > 3600? ("" + Math.floor(timeleft/3600) + " hour(s)") : (timeleft > 60? ("" + Math.floor(timeleft/60) + " minute(s)") : ("" + timeleft + " second(s)")));
              document.getElementById("sign-btn").disabled = true;
            }
            else {
              document.getElementById("sign-btn").innerHTML = "Sign Now";
              document.getElementById("sign-btn").disabled = false;
            }
          }
        }
      });
    }
  },
  gen: {
    docid: function() {
      var mt = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
      var r = "";
      for(var i = 0; i < 28; i++) r += mt[Math.floor(Math.random()*mt.length)];
      return r;
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
    var barrier = document.createElement("div");
    barrier.style.width = "301.3px";
    barrier.style.height = "301.3px";
    barrier.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
    barrier.style.position = "absolute";
    barrier.style.display = "flex";
    barrier.style.justifyContent = "center";
    barrier.style.alignItems = "center";
    var progress = document.createElement("h2");
    var area = JSON.parse(c[collection][0].position);
    for(var i = 0; i < area[0]; i++) {
      var r = document.createElement("tr");
      for(var j = 0; j < area[1]; j++) {
        var d = document.createElement("td");
        r.appendChild(d);
      }
      puzzle.appendChild(r);
    }
    var g = 0;
    for(var i in c[collection]) {
      var speice = c[collection][i];
      var img = document.createElement("img");
      img.src = await fetch("https://game-exchange-2020.firebaseio.com/exchange/puzzle/" + speice.belong + "/" + speice.pid + "/img.json").then(r=>r.json());
      speice.position = [JSON.parse(speice.position)[2],JSON.parse(speice.position)[3]];
      puzzle.children[speice.position[0]].children[speice.position[1]].appendChild(img);
      progress.innerHTML = ""+(Number(i)+1)+" / "+(area[0]*area[1]);
      g = Number(i);
    }
    barrier.appendChild(progress);
    if(g+1 < (area[0]*area[1])) cc.appendChild(barrier);
    cc.appendChild(puzzle);
  }
}

async function getNew() {
  var fulllist = await fetch("https://game-exchange-2020.firebaseio.com/exchange/puzzle.json").then(r => r.json());
  var allow = [];
  for(var puzzle in fulllist) {
    var n = 0;
    for(var i in fulllist[puzzle]) n++;
    for(var i in fulllist[puzzle]) {
      allow.push({
        belong: puzzle,
        pid: i,
        position: JSON.stringify([Math.sqrt(n), Math.sqrt(n), Number(fulllist[puzzle][i].position.split(',')[0]), Number(fulllist[puzzle][i].position.split(',')[1])])
      });
    }
  }
  for(var i = allow.length - 1; i >= 0; i--) {
    for(var j = 0; j < api.collection.data.length; j++) {
      if(allow[i].pid == api.collection.data[j].pid) {
        allow.splice(i, 1);
        break;
      }
    }
  }
  if(allow.length > 0) {
    var selected = Math.floor(Math.random()*allow.length);
    db.collection("exchange").doc(api.gen.docid()).set({
      belong: allow[selected].belong,
      pid: allow[selected].pid,
      position: allow[selected].position,
      shared: 0,
      time: new Date(),
      user: api.account.user().uid
    })
    .then(() => {
      Swal.fire("New Shard", "You got a new shard of "+allow[selected].belong, "success");
    });
  }
  else Swal.fire("WOW", "You Already Got All Shard!", "info");
}

function SIGN() {
  if(api.sign.data.last.toMillis() + 86400000 > Date.now()) {
    console.log("SIGN FAILED");
  }
  else {
    var o_level = Math.floor(api.sign.data.exp/100);
    var increment = Math.floor(20+Math.random()*20);
    document.getElementById("sign-btn").innerHTML = "<span class='spinner-border spinner-border-sm'></span> Signing";
    document.getElementById("sign-btn").disabled = true;
    db.collection("user").doc(api.account.user().uid).update({
      exp: firebase.firestore.FieldValue.increment(increment),
      last: new Date()
    })
    .then(() => {
      Swal.fire('Signed!','You got '+increment+' exp!','success')
      .then(() => {
        if(Math.floor(api.sign.data.exp/100) == o_level+1) {
          Swal.fire('Level Up!', 'You are now level '+Math.floor(api.sign.data.exp/100)+'!', 'success');
          getNew();
        }
      });
    });
  }
}

firebase.auth().onAuthStateChanged(() => {
  if(api.account.user() === null) {
    togglePage("signin");
  }
  else {
    document.getElementsByClassName("nav-sign-out")[0].style.display = "";
    Array.from(document.getElementsByClassName("username")).forEach(elm => {
      elm.innerHTML = api.account.user().displayName;
    });
    window.collection = api.collection.listen(parseCollection);
    window.sign = api.sign.listen();
    togglePage("home");
  }
  document.getElementById("ba").remove();
});
