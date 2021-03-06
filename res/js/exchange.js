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
        firebase.database().ref('users/' + api.account.user().uid).set({display: name});
        api.account.user().updateProfile({displayName: name})
        .then(() => {
          console.log("ACCOUNT NAME SET.");
          Swal.fire("Success", "", "success");
          localStorage["page"] = "";
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
        localStorage["page"] = "";
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
      return db.collection("user").doc(api.account.user().uid).onSnapshot({includeMetadataChanges: true}, doc => {
        if(!doc.metadata.hasPendingWrites) {
          document.getElementById("ldd-exp").style.display = "none";
          api.sign.data = doc.data();
          if(api.sign.data === undefined) {
            db.collection("user").doc(api.account.user().uid).set({exp: 0, last: new Date(0)});
          }
          else {
            document.getElementById("level").innerHTML = "Level: " + Math.floor(api.sign.data.exp/100);
            document.getElementById("exp-bar").style.width = "" + (api.sign.data.exp%100) + "%";
            document.getElementById("exp").innerHTML = "" + (api.sign.data.exp%100) + " / 100";
            if(api.sign.data.last.toMillis() + 72000000 > Date.now()) {
              var timeleft = Math.floor((api.sign.data.last.toMillis() + 72000000 - Date.now())/1000);
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
  },
  image: {
    get: async function(belong, pid) {
      if(!localStorage["image-"+belong+"-"+pid]) localStorage["image-"+belong+"-"+pid] = await fetch("https://game-exchange-2020.firebaseio.com/exchange/puzzle/" + belong + "/" + pid + "/img.json").then(r=>r.json());
      return localStorage["image-"+belong+"-"+pid];
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
  localStorage["page"] = page;
}

function signIn() {api.account.signin(document.getElementById("in-email").value, document.getElementById("in-password").value);};
function signUp() {
  if(document.getElementById("up-password").value === document.getElementById("up-password2").value && document.getElementById("up-password").value.length >= 8)
  api.account.signup(document.getElementById("up-email").value, document.getElementById("up-password").value, document.getElementById("up-name").value);
};

async function parseCollection(raw) {
  var c = {};
  for(var i = 0; i < raw.length; i++) {
    if(!c[raw[i].belong]) c[raw[i].belong] = [];
    c[raw[i].belong].push(raw[i]);
  }
  // home page
  var cc = document.getElementsByClassName("collection-container")[0];
  cc.innerHTML = "<span id='ld-c'><span class='spinner-border spinner-border-sm'></span> Loading Your Collections<br></span>";
  for(var collection in c) {
    var puzzle = document.createElement("table");
    var barrier = document.createElement("div");
    barrier.style.width = barrier.style.height = "302.3px";
    barrier.style.backgroundColor = "rgba(255, 255, 255, 0.5)";
    barrier.style.position = "absolute";
    barrier.style.display = "flex";
    barrier.style.justifyContent = barrier.style.alignItems = "center";
    var progress = document.createElement("h2");
    var area = JSON.parse(c[collection][0].position);
    for(var i = 0; i < area[0]; i++) {
      var r = document.createElement("tr");
      for(var j = 0; j < area[1]; j++) {
        var d = document.createElement("td");
        d.style.width = d.style.height = "" + (300 / area[0]) + "px";
        r.appendChild(d);
      }
      puzzle.appendChild(r);
    }
    var g = 0;
    for(var i in c[collection]) {
      var speice = c[collection][i];
      var img = document.createElement("img");
      img.src = await api.image.get(speice.belong, speice.pid);
      img.style.width = img.style.height = "" + (300 / area[0]) + "px";
      speice.position = [JSON.parse(speice.position)[2],JSON.parse(speice.position)[3]];
      puzzle.children[speice.position[0]].children[speice.position[1]].appendChild(img);
      progress.innerHTML = ""+(Number(i)+1)+" / "+(area[0]*area[1]);
      g = Number(i);
    }
    barrier.appendChild(progress);
    if(g+1 < (area[0]*area[1])) cc.appendChild(barrier);
    cc.appendChild(puzzle);
    cc.appendChild(document.createElement("br"));

    // share page
    var cont = document.getElementById("share-container");
    cont.innerHTML = "<span id='ld-c2'><span class='spinner-border spinner-border-sm'></span> Loading<br></span>";
    for(var collection in c) {
      var collec = document.createElement("div");
      var head = document.createElement("h3");
      var list = document.createElement("ul");
      head.innerHTML = collection;
      list.classList.add("list-group");
      for(var i in c[collection]) {
        var speice = c[collection][i];
        var item = document.createElement("li");
        item.classList.add("list-group-item", "list-group-item-action");
        item.style.overflow = "hidden";
        var img = document.createElement("img");
        img.src = await api.image.get(speice.belong, speice.pid);
        img.style.width = img.style.height = "120px";
        var acts = document.createElement("div");
        acts.style.display = "inline-block";
        acts.style.margin = "0 8px";
        var shareCounter = document.createElement("p");
        shareCounter.innerHTML = "Shared: " + speice.shared + " / " + (speice.maxShare || "5");
        var shareBox = document.createElement("div");
        var shareInput = document.createElement("input");
        var shareCopyBox = document.createElement("div");
        var shareCopyBtn = document.createElement("button");
        shareBox.classList.add("input-group", "share-box");
        shareInput.type = "text"; shareInput.classList.add("form-control");
        shareCopyBox.classList.add("input-group-append");
        shareCopyBtn.classList.add("input-group-text", "copyBtn");
        shareCopyBtn.innerHTML = "Copy";
        shareCopyBtn.dataset.clipboardText = shareInput.value = location.origin + location.pathname + "?invitation=" + api.account.user().uid + ";" + speice.pid;
        shareCopyBtn.onclick = function(){Swal.fire("Copied!", "Share the invitation to others!", "success")};
        shareCopyBox.appendChild(shareCopyBtn);
        shareBox.appendChild(shareInput);
        shareBox.appendChild(shareCopyBox);
        acts.appendChild(shareCounter);
        acts.appendChild(shareBox);
        item.appendChild(img);
        item.appendChild(acts);
        list.appendChild(item);
      }
      collec.appendChild(head);
      collec.appendChild(list);
      cont.appendChild(collec);
    }
  }
  document.getElementById("ld-c").remove();
  document.getElementById("ld-c2").remove();
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

async function getShared(invitation) {
  try{history.replaceState({page: "home"}, "Game: Exchange", "./");} catch(e) {}
  Swal.fire("Checking Invitation", "<span class='spinner-border spinner-border-sm'></span>");
  var inv = invitation.split(";");
  var had = await db.collection("exchange").where("user", "==", api.account.user().uid).where("pid", "==", inv[1]).get().then(qs => qs.size);
  if(had) {
    Swal.fire("You have already had that shard");
    return;
  }
  var doc, data;
  var valid = await db.collection("exchange").where("user", "==", inv[0]).where("pid", "==", inv[1]).get().then(qs => {
    if(qs.size) {
      if(qs.docs[0].data.shared >= 5) return 0;
      doc = qs.docs[0].id;
      data = qs.docs[0].data();
    }
    return qs.size;
  });
  if(valid) {
    db.collection("user").doc(data.user).update({shared: firebase.firestore.FieldValue.increment(1)});
    db.collection("exchange").doc(doc).update({shared: firebase.firestore.FieldValue.increment(1)});
    db.collection("exchange").doc(api.gen.docid()).set({
      belong: data.belong,
      pid: data.pid,
      position: data.position,
      shared: 0,
      time: new Date(),
      user: api.account.user().uid,
      from: inv[0]
    }).then(() => {
      Swal.fire("New Shard", "You got a new shard of "+data.belong, "success");
    });
  }
}

function SIGN() {
  if(api.sign.data.last.toMillis() + 72000000 > Date.now()) {
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

new ClipboardJS(".copyBtn");
var GET = (function(){
  var x = location.href;
  var KVs = x.search(/\?/)>-1?x.substr(x.search(/\?/)+1).split("&"):[];
  var m = {};
  for(i in KVs) {
    let KV = KVs[i].split("=");
    m[KV[0]] = KV[1];
  }
  return m;
})();

firebase.auth().onAuthStateChanged(() => {
  if(GET["invitation"]) {
    if(api.account.user() === null) {
      Swal.fire("You got an invitation!", "Sign In or Sign Up to get the shard.", "info");
    }
    else {
      getShared(GET["invitation"]);
    }
  }

  if(api.account.user() === null) {
    Array.from(document.getElementsByClassName("nav-s-in")).forEach(elm => {elm.style.display = "none"});
    togglePage("signin");
  }
  else {
    Array.from(document.getElementsByClassName("nav-s-out")).forEach(elm => {elm.style.display = "none"});
    Array.from(document.getElementsByClassName("username")).forEach(elm => {elm.innerHTML = api.account.user().displayName;});
    window.collection = api.collection.listen(parseCollection);
    window.sign = api.sign.listen();
    togglePage(localStorage["page"] || "home");
  }
  document.getElementById("ba").remove();
});
