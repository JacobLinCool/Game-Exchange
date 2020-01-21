window.exchange = {
  player: {},
  server: {}
};


window.api = {
  account: {
    create: function() {
    firebase.auth().createUserWithEmailAndPassword(email, password).catch(function(error) {
  // Handle Errors here.
  var errorCode = error.code;
  var errorMessage = error.message;
  // ...
});
    }
  }
};
