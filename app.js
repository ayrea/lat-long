// Register the service worker with self-update support
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js').then(registration => {
            console.log('Service Worker registered:', registration);

            registration.onupdatefound = () => {
                const newWorker = registration.installing;
                newWorker.onstatechange = () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('New version found, activating...');
                        newWorker.postMessage({ action: 'skipWaiting' });
                    }
                };
            };
        });

        // Refresh the page once the new service worker takes control
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            window.location.reload();
        });
    });
}

// Get and display the user's location
function showLocation() {
    const locationDisplay = document.getElementById('location');

    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                locationDisplay.textContent = `Latitude: ${latitude}, Longitude: ${longitude}`;
            },
            error => {
                locationDisplay.textContent = `Error: ${error.message}`;
            }
        );
    } else {
        locationDisplay.textContent = 'Geolocation is not supported.';
    }
}

showLocation();
