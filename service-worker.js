self.addEventListener('install', (event) => {
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(clients.claim());
});

self.addEventListener('push', function(event) {
    if (!event.data) return;

    try {
        const data = event.data.json();
        const options = {
            body: data.message,
            icon: data.type === 'water' ? '/icons/water-icon.png' : '/icons/key-icon.png',
            badge: '/icons/badge-72x72.png',
            vibrate: [100, 50, 100],
            tag: data.type,
            requireInteraction: true,
            actions: [
                {
                    action: 'dismiss',
                    title: 'Dismiss'
                }
            ],
            data: {
                type: data.type,
                timestamp: Date.now()
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (error) {
        console.error('Error processing push event:', error);
    }
});

self.addEventListener('notificationclick', function(event) {
    event.notification.close();

    if (event.action === 'dismiss') {
        return;
    }

    // Focus or open the app when notification is clicked
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then(function(clientList) {
            if (clientList.length > 0) {
                let client = clientList[0];
                for (let i = 0; i < clientList.length; i++) {
                    if (clientList[i].focused) {
                        client = clientList[i];
                    }
                }
                return client.focus();
            }
            return clients.openWindow('/');
        })
    );
}); 