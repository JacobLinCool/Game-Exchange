window.exchange = {
  player: {},
  server: {}
};


window.api = {
  account: {
    user: function() {
      return firebase.auth().currentUser;
    },
    create: function(email, password) {
      return firebase.auth().createUserWithEmailAndPassword(email, password)
      .catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      })
      .then(user => {
        console.log("ACCOUNT CREATED. "+user);
      });
    },
    signin: function(email, password) {
      return firebase.auth().signInWithEmailAndPassword(email, password)
      .catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      })
      .then(user => {
        console.log("ACCOUNT LOGGED IN. "+user);
      });
    },
    signout: function() {
      return firebase.auth().signOut()
      .then(() => {
        console.log("ACCOUNT LOGGED OUT.");
      }).catch(error => {
        console.error("FIREBASE AUTH ERROR: "+error.code);
      });
    }
  }
};
