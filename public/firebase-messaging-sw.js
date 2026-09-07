importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyC5Bv4xyEXw19LCxYARsqKoKD0gPVv9pv4",
  projectId: "bytebreach-void",
  messagingSenderId: "912397976295",
  appId: "1:912397976295:web:b88be264a150a0ab8b1842"
});

const messaging = firebase.messaging();
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || payload.data?.title || "ByteBreach alert";
  const body = payload.notification?.body || payload.data?.body || "You have a new update.";
  self.registration.showNotification(title, {
    body,
    data: payload.data || {}
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
    const existing = clients.find((client) => "focus" in client);
    return existing ? existing.focus() : self.clients.openWindow("/");
  }));
});
