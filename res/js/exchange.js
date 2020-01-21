window.exchange = {
  player: {},
  server: {}
};


window.api = {
  account: {
    create: function(email, password) {
      firebase.auth().createUserWithEmailAndPassword(email, password)
      .catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      })
      .then(user => {
        console.log("ACCOUNT CREATED. "+user);
      });
    },
    signin: function(email, password) {
      firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      })
      .then(user => {
        console.log("ACCOUNT LOGGED IN. "+user);
      });
    },
    signout: function() {
      firebase.auth().signOut()
      .then(() => {
        console.log("ACCOUNT LOGGED OUT.");
      }).catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      });
    }
  }
};
