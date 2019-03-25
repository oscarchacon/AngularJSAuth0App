(function () {

  'use strict';

  angular
    .module('app')
    .service('authService', authService);

  authService.$inject = ['$state', 'angularAuth0', '$timeout'];

  function authService($state, angularAuth0, $timeout) {

    var accessToken;
    var idToken;
    var expiresAt;

    var userProfile;

    var tokenRenewalTimeout;

    function getIdToken() {
      return idToken;
    }

    function getAccessToken() {
      return accessToken;
    }

    function login() {
      angularAuth0.authorize();
    }

    function handleAuthentication() {
      angularAuth0.parseHash(function(err, authResult) {
        if (authResult && authResult.accessToken && authResult.idToken) {
          localLogin(authResult);
          $state.go('home');
        } else if (err) {
          $timeout(function() {
            $state.go('home');
          });
          console.log(err);
          alert('Error: ' + err.error + '. Check the console for further details.');
        }
      });
    }

    function localLogin(authResult) {
      // Set isLoggedIn flag in localStorage
      localStorage.setItem('isLoggedIn', 'true');
      // Set the time that the access token will expire at
      expiresAt = (authResult.expiresIn * 1000) + new Date().getTime();
      accessToken = authResult.accessToken;
      idToken = authResult.idToken;
    }

    function renewTokens() {
      angularAuth0.checkSession({},
        function(err, result) {
          if (err) {
            console.log(err);
          } else {
            localLogin(result);
          }
        }
      );
    }

    function logout() {
      // Remove isLoggedIn flag from localStorage
      localStorage.removeItem('isLoggedIn');
      // Remove tokens and expiry time
      accessToken = '';
      idToken = '';
      expiresAt = 0;
      clearTimeout(tokenRenewalTimeout);
      localStorage.clear();
      angularAuth0.logout({
        returnTo: AUTH0_LOGOUT_URL,
        clientID: AUTH0_CLIENT_ID
      });
      $state.go('home');
    }

    function isAuthenticated() {
      // Check whether the current time is past the
      // access token's expiry time
      return localStorage.getItem('isLoggedIn') === 'true' && new Date().getTime() < expiresAt;
    }

    function scheduleRenewal() {
      var delay = expiresAt - Date.now();
      if (delay > 0) {
        tokenRenewalTimeout = setTimeout(function() {
          renewTokens();
        }, delay);
      }
    }

    function getProfile(cb) {
      if (!accessToken) {
        throw new Error('Access Token must exist to fetch profile');
      }
      angularAuth0.client.userInfo(accessToken, function(err, profile) {
        if (profile) {
          setUserProfile(profile);
        }
        cb(err, profile);
      });
    }

    function setUserProfile(profile) {
      userProfile = profile;
    }

    function getCachedProfile() {
      return userProfile;
    }

    return {
      login: login,
      getIdToken: getIdToken,
      getAccessToken: getAccessToken,
      handleAuthentication: handleAuthentication,
      logout: logout,
      isAuthenticated: isAuthenticated,
      renewTokens: renewTokens,
      scheduleRenewal: scheduleRenewal,
      getCachedProfile: getCachedProfile,
      getProfile: getProfile,
    }
  }
})();
