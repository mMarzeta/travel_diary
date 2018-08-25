/**
 * Created by maciejmarzeta on 25.08.2018.
 */
'use strict';

const SockJS = require('sockjs-client');
require('stompjs');

function register(registrations) {
    let socket = SockJS('/place');
    let stompClient = Stomp.over(socket);
    stompClient.connect({}, function(frame) {
        registrations.forEach(function (registration) {
            stompClient.subscribe(registration.route, registration.callback);
        });
    });
}

module.exports.register = register;
