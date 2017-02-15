var facebookUser = {};

window.fbAsyncInit = function() {
  FB.init({
    appId      : '381311015570822',
    xfbml      : true,
    version    : 'v2.8'
  });

  // ADD ADDITIONAL FACEBOOK CODE HERE
  FB.getLoginStatus(function(response) {
    if (response.status == 'connected') {
      onLogin(response);
    } else {
      FB.login(function(response) {
        onLogin(response)
      }, { scope: 'user_friends, email' });
    }
  });
};

function onLogin(response) {
  if (response.status == "connected") {
    FB.api("/me?fields=first_name,locale,gender", function(data) {
      facebookUser.firstName = data.first_name;
      facebookUser.gender = data.gender;
      facebookUser.locale = data.locale;
    });
  }
}
 
function shareScore(n){
  FB.ui({
    method: 'feed',
    link: 'https://apps.facebook.com/borgetaway/',
    caption: 'Zagraj w BOR Getaway !',
    name: 'Moj rekord w BOR Getaway to ' + n + '!!!!',
    description: 'Przejechałem ' + n + ' w BOR Getaway bez karambolu! A ty?',
    picture: 'https://www.feronato.com/facebook/risky-steps/assets/pictures/feedpic.png'
  }, function(response){});
}

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) { return; }
  js = d.createElement(s); js.id = id;
  js.src = '//connect.facebook.net/en_US/sdk.js';
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
