// firebase-messaging-sw.js
// MUSÍ být v kořenové složce — vedle index.html!

importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey:            "AIzaSyDLjV9havKCkXSQVLZx7Dx5IXfaBsQSmYE",
  authDomain:        "mesenger-aplikace-vc-adm-jirik.firebaseapp.com",
  projectId:         "mesenger-aplikace-vc-adm-jirik",
  storageBucket:     "mesenger-aplikace-vc-adm-jirik.firebasestorage.app",
  messagingSenderId: "543388043871",
  appId:             "1:543388043871:web:a3bddecf15a35f583ae9ea"
});

const messaging = firebase.messaging();

// Notifikace když je browser na pozadí nebo zavřený
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification?.title || "LCARS Messenger",
    {
      body:    payload.notification?.body || "Nová zpráva na můstku!",
      icon:    "/icon-192.png",   // volitelné — můžeš vynechat
      badge:   "/icon-192.png",
      tag:     "lcars-msg",       // nahradí předchozí notifikaci místo hromadění
      vibrate: [200, 100, 200]
    }
  );
});
