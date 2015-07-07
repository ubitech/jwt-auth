(function () {
    'use strict';
    var app = angular.module('app', [], function($httpProvider){
        $httpProvider.interceptors.push('AuthInterceptor');
    });

    app.constant('API_URL', 'http://localhost:3000');

    app.controller('MainCtrl', function MainCtrl(RandomUserFactory, UserFactory) {
        'use strict';
        var vm = this;
        vm.getRandomUser = getRandomUser;
        vm.login = login;
        vm.logout = logout;

        // INIT
        UserFactory.getUser().then(function success(response){
            vm.user = response.data;
        })

        function getRandomUser() {
            RandomUserFactory.getUser().then(function success(response) {
                vm.randomUser = response.data;
            }, handleError);
        }

        function login(username, password) {
            UserFactory.login(username, password).then(function success(response) {
                vm.user = response.data.user;
                //alert(response.data.token)
            }, handleError);
        }

        function logout() {
            UserFactory.logout();
            vm.user = null;
        }

        function handleError(response) {
            alert('Error: ' + response.data);
        }

    });

    // RandomUserFactory
    app.factory('RandomUserFactory', function RandomUserFactory($http, API_URL) {
        'use strict';
        return {
            getUser: getUser
        };

        function getUser() {
            return $http.get(API_URL + '/random-user');
        }
    });

    // UserFactory
    app.factory('UserFactory', function UserFactory($http, API_URL, AuthTokenFactory, $q) {
        'use strict';
        return {
            login: login,
            logout: logout,
            getUser: getUser
        };

        function login(username, password) {
            return $http.post(API_URL + '/login', {
                username: username,
                password: password
            }).then(function success(response){
                AuthTokenFactory.setToken(response.data.token);
                return response;
            });
        }

        function logout(){
            AuthTokenFactory.setToken();
        }

        function getUser(){
            if (AuthTokenFactory.getToken()){
                return $http.get(API_URL + '/me');
            } else {
                return $q.reject({data: 'client has no auth token'});
            }
        }
    });

    // AuthTokenFactory
    app.factory('AuthTokenFactory', function AuthTockenFactory($window){
        'use strict';
        var store = $window.localStorage;
        var key = 'auth-token';

        return{
            getToken: getToken,
            setToken: setToken
        };

        function getToken(){
            return store.getItem(key);
        }

        function setToken(token){
            if (token){
                store.setItem(key, token);
            } else {
                store.removeItem(key);
            }
        }
    });

    // AuthInterceptor
    app.factory('AuthInterceptor', function AuthInterceptor(AuthTokenFactory) {
        'use strict';
        return {
            request: addToken
        };

        function addToken(config){
            var token = AuthTokenFactory.getToken();
            if (token){
                config.headers = config.headers || {};
                config.headers.Authorization = 'Bearer ' + token;
            }
            return config;
        }
    });

})();