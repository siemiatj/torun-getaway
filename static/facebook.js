var facebookUser = {};

window.fbAsyncInit = function() {
  FB.init({
    appId      : '381311015570822',
    xfbml      : true,
    version    : 'v2.8'
  });

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
 
function shareScore(n, callback){
  var common = {
    method: 'feed',
    link: 'https://apps.facebook.com/borgetaway/',
    picture: 'https://saskla.cz/games/torun_getaway/public/images/feed.png',
  };
  var PL = {
    method: common.method,
    link: common.link,
    caption: 'Zagraj w BOR Getaway !',
    name: 'Mój rekord w BOR Getaway to ' + n + 's !!!',
    description: (facebookUser.gender === 'male' ? 'Przejechałem ' : 'Przejechałam ') + n + 's w BOR Getaway bez karambolu! A ty?',
    picture: common.picture,
  };
  var EN = {
    method: common.method,
    link: common.link,
    caption: 'Play BOR Getaway !',
    name: 'My best time in BOR Getaway is ' + n + 's !!!',
    description: 'I survived ' + n + 's in BOR Getaway without crashing! Can you beat it?',
    picture: common.picture,
  };

  if (facebookUser.locale === 'pl_PL') {
    FB.ui(PL, callback);
  } else {
    FB.ui(EN, callback);
  }
}

(function(d, s, id){
  var js, fjs = d.getElementsByTagName(s)[0];
  if (d.getElementById(id)) { return; }
  js = d.createElement(s); js.id = id;
  js.src = '//connect.facebook.net/en_US/sdk.js';
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));
