// URLs for the Teachable Machine models
const WATER_MODEL_URL = "https://teachablemachine.withgoogle.com/models/HMHHWzV40/";
const DOOR_MODEL_URL = "https://teachablemachine.withgoogle.com/models/LC7nD1PQc/";

let isListening = false;
let notificationPermission = false;
let waterModel, doorModel;

// Debug function to log notification state
function checkNotificationState() {
    console.log('Notification State Check:');
    console.log('- Notification supported:', 'Notification' in window);
    console.log('- Permission status:', Notification.permission);
    console.log('- notificationPermission var:', notificationPermission);
}

// Initialize notification permission
document.getElementById('enable-notifications').addEventListener('click', async () => {
    console.log('Enable notifications clicked');
    checkNotificationState();

    try {
        if (!('Notification' in window)) {
            console.error('Notifications not supported in this browser');
            alert('This browser does not support notifications');
            return;
        }

        const permission = await Notification.requestPermission();
        console.log('Permission request result:', permission);

        if (permission === 'granted') {
            notificationPermission = true;
            console.log('Creating test notification...');
            try {
                const testNotification = new Notification('Notifications Enabled', {
                    body: 'Test notification - Sound detection is ready!',
                    requireInteraction: false,
                    silent: false
                });
                console.log('Test notification created successfully');
                
                setTimeout(() => testNotification.close(), 3000);
            } catch (notifError) {
                console.error('Error creating test notification:', notifError);
            }
        } else {
            console.warn('Notification permission denied');
            alert('Please enable notifications to receive alerts.');
        }
    } catch (error) {
        console.error('Error in notification setup:', error);
        alert('Error setting up notifications: ' + error.message);
    }

    checkNotificationState();
});

function showNotification(title, message) {
    console.group('Notification Attempt');
    console.log('Title:', title);
    console.log('Message:', message);
    console.log('Current permission:', Notification.permission);
    console.log('notificationPermission var:', notificationPermission);

    if (Notification.permission !== 'granted') {
        console.warn('Notifications not permitted');
        console.groupEnd();
        return;
    }

    try {
        const notification = new Notification(title, {
            body: message,
            requireInteraction: false,
            silent: false,
            timestamp: Date.now()
        });

        console.log('Notification object created:', notification);

        notification.addEventListener('show', () => {
            console.log('Notification shown successfully');
        });

        notification.addEventListener('error', (e) => {
            console.error('Notification error:', e);
        });

        notification.onclick = () => {
            console.log('Notification clicked');
            window.focus();
            notification.close();
        };

        setTimeout(() => {
            notification.close();
            console.log('Notification closed after timeout');
        }, 5000);

    } catch (error) {
        console.error('Error creating notification:', error);
    }

    console.groupEnd();
}

function processResult(result, type) {
    const scores = result.scores;
    const maxScore = Math.max(...scores);
    const maxIndex = scores.indexOf(maxScore);

    updateConfidenceBar(maxScore);
    console.log(`Sound detection - Type: ${type}, Score: ${maxScore.toFixed(2)}, Index: ${maxIndex}`);

    if (maxScore > 0.3) {
        console.group('Sound Detection Event');
        console.log(`${type} sound detected above threshold`);
        console.log('Confidence:', `${(maxScore * 100).toFixed(1)}%`);
        
        if (type === 'water' && maxIndex === 1) {
            showNotification(
                'Water Reminder', 
                `Water detected (${(maxScore * 100).toFixed(1)}% confident)`
            );
        } else if (type === 'door' && maxIndex === 1) {
            showNotification(
                'Keys Reminder', 
                `Door sound detected (${(maxScore * 100).toFixed(1)}% confident)`
            );
        }
        console.groupEnd();
    }
}

async function initialize() {
    try {
        // Load sound models
        waterModel = await createModel(WATER_MODEL_URL);
        doorModel = await createModel(DOOR_MODEL_URL);
        
        document.getElementById('status').textContent = 'Ready to start!';
    } catch (error) {
        console.error('Error initializing:', error);
        document.getElementById('status').textContent = 'Error loading models. Please refresh.';
    }
}

async function createModel(modelURL) {
    const checkpointURL = modelURL + "model.json";
    const metadataURL = modelURL + "metadata.json";

    const recognizer = speechCommands.create(
        "BROWSER_FFT",
        undefined,
        checkpointURL,
        metadataURL
    );

    await recognizer.ensureModelLoaded();
    return recognizer;
}

function updateConfidenceBar(confidence) {
    const confidenceFill = document.querySelector('.confidence-fill');
    const confidenceText = document.querySelector('.confidence-text');
    
    confidenceFill.style.width = `${confidence * 100}%`;
    confidenceText.textContent = `${Math.round(confidence * 100)}%`;
}

document.getElementById('start-button').addEventListener('click', async () => {
    if (!waterModel || !doorModel) {
        alert('Models not loaded yet. Please wait.');
        return;
    }

    const startButton = document.getElementById('start-button');
    const statusElement = document.getElementById('status');

    if (!isListening) {
        isListening = true;
        startButton.innerHTML = '<span class="material-icons">mic_off</span>Stop Listening';
        startButton.classList.add('active');

        waterModel.listen(result => processResult(result, 'water'), { probabilityThreshold: 0.3 });
        doorModel.listen(result => processResult(result, 'door'), { probabilityThreshold: 0.3 });
        
        statusElement.textContent = 'Listening for sounds... (30% threshold)';
    } else {
        isListening = false;
        startButton.innerHTML = '<span class="material-icons">mic</span>Start Listening';
        startButton.classList.remove('active');
        
        waterModel.stopListening();
        doorModel.stopListening();
        
        statusElement.textContent = 'Listening stopped';
    }
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initialize();
    checkNotificationState();
});

document.getElementById('test-notification').addEventListener('click', () => {
    console.group('Test Notification');
    console.log('Current permission:', Notification.permission);
    
    if (Notification.permission === 'granted') {
        try {
            const notification = new Notification('Test Notification', {
                body: 'This is a test notification.',
                requireInteraction: false,
                silent: false,
                timestamp: Date.now()
            });

            console.log('Test notification created successfully');

            notification.addEventListener('show', () => {
                console.log('Test notification shown');
            });

            notification.addEventListener('error', (e) => {
                console.error('Test notification error:', e);
            });

            notification.onclick = () => {
                console.log('Test notification clicked');
                window.focus();
                notification.close();
            };

            setTimeout(() => {
                notification.close();
                console.log('Test notification closed');
            }, 5000);

        } catch (error) {
            console.error('Error creating test notification:', error);
        }
    } else {
        console.warn('Notification permission not granted');
        alert('Please enable notifications first!');
    }
    
    console.groupEnd();
}); 