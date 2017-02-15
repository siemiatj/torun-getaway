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
  var PL = {
    method: 'feed',
    link: 'https://apps.facebook.com/borgetaway/',
    caption: 'Zagraj w BOR Getaway !',
    name: 'Mój rekord w BOR Getaway to ' + n + '!!!',
    description: (facebookUser.gender === 'male' ? 'Przejechałem ' : 'Przejechałam ') + n + ' w BOR Getaway bez karambolu! A ty?',
    picture: 'https://saskla.cz/games/torun_getaway/public/images/feedpic.png'
  };
  var EN = {
    method: 'feed',
    link: 'https://apps.facebook.com/borgetaway/',
    caption: 'Play BOR Getaway !',
    name: 'My best score in BOR Getaway is ' + n + '!!!',
    description: 'I scored ' + n + ' in BOR Getaway without crashing! Can you beat it?',
    picture: 'https://saskla.cz/games/torun_getaway/public/images/feedpic.png'
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
