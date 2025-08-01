// Video Chat App - Client Side JavaScript
// Handles WebRTC peer-to-peer video chat with Socket.IO signaling

class VideoChatApp {
    constructor() {
        // Initialize properties
        this.socket = null;
        this.localStream = null;
        this.remoteStream = null;
        this.peerConnection = null;
        this.selectedUser = null;
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isInCall = false;
        this.callState = 'idle'; // idle, calling, incoming, connected
        this.callTimeout = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Enhanced WebRTC configuration with TURN servers for better connectivity
        this.rtcConfig = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' },
                { urls: 'stun:stun3.l.google.com:19302' },
                { urls: 'stun:stun4.l.google.com:19302' }
                // Add TURN servers here for production:
                // { urls: 'turn:your-turn-server.com:3478', username: 'username', credential: 'password' }
            ],
            iceCandidatePoolSize: 10,
            iceTransportPolicy: 'all',
            bundlePolicy: 'max-bundle',
            rtcpMuxPolicy: 'require'
        };
        
        // DOM elements
        this.elements = {
            localVideo: document.getElementById('localVideo'),
            remoteVideo: document.getElementById('remoteVideo'),
            remoteVideoContainer: document.getElementById('remoteVideoContainer'),
            remoteVideoLabel: document.getElementById('remoteVideoLabel'),
            waitingMessage: document.getElementById('waitingMessage'),
            connectedUsers: document.getElementById('connectedUsers'),
            statusIndicator: document.getElementById('status-indicator'),
            statusText: document.getElementById('status-text'),
            toggleVideo: document.getElementById('toggleVideo'),
            toggleAudio: document.getElementById('toggleAudio'),
            callBtn: document.getElementById('callBtn'),
            hangUpBtn: document.getElementById('hangUpBtn'),
            permissionModal: document.getElementById('permissionModal'),
            grantPermission: document.getElementById('grantPermission'),
            skipPermission: document.getElementById('skipPermission'),
            closePermissionModal: document.getElementById('closePermissionModal')
        };
        
        // Initialize the app
        this.init();
    }
    
    async init() {
        console.log('Initializing Video Chat App...');
        
        // Show permission modal first
        this.showPermissionModal();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize Socket.IO connection
        this.initSocketConnection();
    }
    
    showPermissionModal() {
        this.elements.permissionModal.classList.remove('hidden');
    }
    
    hidePermissionModal() {
        this.elements.permissionModal.classList.add('hidden');
    }
    
    setupEventListeners() {
        // Permission grant button
        this.elements.grantPermission.addEventListener('click', () => {
            this.requestMediaPermissions();
        });
        
        // Skip permission button
        this.elements.skipPermission.addEventListener('click', () => {
            this.skipPermissions();
        });
        
        // Close modal button
        this.elements.closePermissionModal.addEventListener('click', () => {
            this.skipPermissions();
        });
        
        // Control buttons
        this.elements.toggleVideo.addEventListener('click', async () => {
            await this.toggleVideo();
        });
        
        this.elements.toggleAudio.addEventListener('click', async () => {
            await this.toggleAudio();
        });
        
        this.elements.callBtn.addEventListener('click', () => {
            if (this.isInCall) {
                this.endCall();
            } else {
                this.initiateCall();
            }
        });
        
        this.elements.hangUpBtn.addEventListener('click', () => {
            this.endCall();
        });
        
        // Handle page unload
        window.addEventListener('beforeunload', () => {
            if (this.isInCall) {
                this.endCall();
            }
            if (this.socket) {
                this.socket.disconnect();
            }
        });
        
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isInCall) {
                console.log('Page hidden, ending call');
                this.endCall();
            }
        });
        
        // Handle online/offline events
        window.addEventListener('online', () => {
            console.log('Browser went online');
            if (!this.socket || !this.socket.connected) {
                this.initSocketConnection();
            }
        });
        
        window.addEventListener('offline', () => {
            console.log('Browser went offline');
            this.updateConnectionStatus('disconnected');
        });
    }
    
    async requestMediaPermissions() {
        try {
            console.log('Requesting media permissions...');
            
            // Request camera and microphone access with better constraints
            const constraints = {
                video: {
                    width: { ideal: 1280, max: 1920 },
                    height: { ideal: 720, max: 1080 },
                    frameRate: { ideal: 30, max: 60 }
                },
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true
                }
            };
            
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Display local video
            this.elements.localVideo.srcObject = this.localStream;
            
            // Hide permission modal
            this.hidePermissionModal();
            
            console.log('Media permissions granted');
            
        } catch (error) {
            console.error('Error accessing media devices:', error);
            this.handleMediaError(error);
        }
    }
    
    handleMediaError(error) {
        console.error('Media access error:', error);
        
        let message = '';
        if (error.name === 'NotAllowedError') {
            message = 'Camera and microphone access denied. You can still connect and chat, but video/audio features will be limited.';
        } else if (error.name === 'NotFoundError') {
            message = 'No camera or microphone found. Please connect a device and refresh the page.';
        } else if (error.name === 'NotReadableError') {
            message = 'Camera or microphone is already in use by another application.';
        } else if (error.name === 'OverconstrainedError') {
            message = 'Camera or microphone does not meet the required specifications.';
        } else {
            message = 'Unable to access camera and microphone. Please check your browser permissions and refresh the page.';
        }
        
        alert(message);
        this.createTestStream();
        this.hidePermissionModal();
    }
    
    createTestStream() {
        try {
            // Create a test canvas for video fallback
            const canvas = document.createElement('canvas');
            canvas.width = 640;
            canvas.height = 480;
            const ctx = canvas.getContext('2d');
            
            // Draw a test pattern
            ctx.fillStyle = '#667eea';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = 'white';
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Test Video', canvas.width/2, canvas.height/2);
            
            // Create a MediaStream from the canvas
            const stream = canvas.captureStream(30);
            
            // Add a silent audio track
            const audioContext = new AudioContext();
            const oscillator = audioContext.createOscillator();
            const destination = audioContext.createMediaStreamDestination();
            oscillator.connect(destination);
            oscillator.frequency.setValueAtTime(0, audioContext.currentTime);
            oscillator.start();
            
            // Combine video and audio streams
            const tracks = [...stream.getTracks(), ...destination.stream.getTracks()];
            this.localStream = new MediaStream(tracks);
            
            // Display the test video
            this.elements.localVideo.srcObject = this.localStream;
            
            console.log('Created test media stream for fallback');
        } catch (error) {
            console.error('Error creating test stream:', error);
        }
    }
    
    skipPermissions() {
        console.log('Skipping permissions for now');
        this.hidePermissionModal();
        // User can still connect and chat, just without video/audio initially
    }
    
    getServerUrl() {
        // Improved server URL detection
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        const port = '3000'; // Default server port
        
        // For local development
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '') {
            return `${protocol}//${hostname}:${port}`;
        }
        
        // For production - you can customize this based on your deployment
        // If your client is served from the same domain as the server
        if (window.location.port === '') {
            return `${protocol}//${hostname}`;
        }
        
        // For different ports or subdomains
        return `${protocol}//${hostname}:${port}`;
    }
    
    initSocketConnection() {
        // Connect to Socket.IO server with improved configuration
        const serverUrl = this.getServerUrl();
        
        console.log('Connecting to server:', serverUrl);
        
        this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionAttempts: this.maxReconnectAttempts,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            timeout: 20000,
            forceNew: true,
            upgrade: true
        });
        
        // Socket connection events
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.reconnectAttempts = 0;
            this.updateConnectionStatus('connected');
        });
        
        this.socket.on('disconnect', (reason) => {
            console.log('Disconnected from server:', reason);
            this.updateConnectionStatus('disconnected');
            
            if (reason === 'io server disconnect') {
                // Server disconnected us, try to reconnect
                this.socket.connect();
            }
        });
        
        this.socket.on('connect_error', (error) => {
            console.error('Connection error:', error);
            this.reconnectAttempts++;
            this.updateConnectionStatus('error');
            
            if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                console.error('Max reconnection attempts reached');
                this.showConnectionError();
            }
        });
        
        this.socket.on('reconnect', (attemptNumber) => {
            console.log('Reconnected after', attemptNumber, 'attempts');
            this.updateConnectionStatus('connected');
        });
        
        this.socket.on('reconnect_error', (error) => {
            console.error('Reconnection error:', error);
        });
        
        this.socket.on('reconnect_failed', () => {
            console.error('Reconnection failed');
            this.showConnectionError();
        });
        
        // Handle connected clients list
        this.socket.on('connected-clients', (clients) => {
            console.log('Received connected clients:', clients);
            this.updateConnectedUsers(clients);
        });
        
        // Handle new user joining
        this.socket.on('user-joined', (user) => {
            console.log('User joined:', user);
            this.addConnectedUser(user);
            this.updateWaitingMessage();
        });
        
        // Handle user leaving
        this.socket.on('user-left', (userId) => {
            console.log('User left:', userId);
            this.removeConnectedUser(userId);
            this.updateWaitingMessage();
            
            // If the leaving user was our peer, end the call
            if (this.peerConnection && this.selectedUser === userId) {
                this.endCall();
            }
        });
        
        // WebRTC signaling events
        this.socket.on('offer', (data) => {
            console.log('Received offer from:', data.from);
            this.handleIncomingCall(data);
        });
        
        this.socket.on('answer', (data) => {
            console.log('Received answer from:', data.from);
            this.handleAnswer(data);
        });
        
        this.socket.on('ice-candidate', (data) => {
            console.log('Received ICE candidate from:', data.from);
            this.handleIceCandidate(data);
        });
        
        this.socket.on('call-rejected', (data) => {
            console.log('Call rejected by:', data.from);
            this.handleCallRejected(data);
        });
        
        this.socket.on('call-ended', (data) => {
            console.log('Call ended by:', data.from);
            this.handleCallEnded(data);
        });
    }
    
    showConnectionError() {
        const message = 'Unable to connect to the server. Please check your internet connection and refresh the page.';
        alert(message);
    }
    
    updateConnectionStatus(status) {
        const indicator = this.elements.statusIndicator;
        const text = this.elements.statusText;
        
        indicator.className = 'status-dot ' + status;
        
        switch (status) {
            case 'connected':
                text.textContent = 'Connected';
                break;
            case 'disconnected':
                text.textContent = 'Disconnected';
                break;
            case 'error':
                text.textContent = 'Connection Error';
                break;
            default:
                text.textContent = 'Connecting...';
        }
    }
    
    updateConnectedUsers(users) {
        this.elements.connectedUsers.innerHTML = '';
        
        users.forEach(user => {
            this.addConnectedUser(user);
        });
        
        this.updateWaitingMessage();
    }
    
    addConnectedUser(user) {
        // Don't add if already exists
        if (document.querySelector(`[data-user-id="${user.id}"]`)) {
            return;
        }
        
        const userElement = document.createElement('div');
        userElement.className = 'user-item';
        userElement.setAttribute('data-user-id', user.id);
        
        // Check if this is the current user
        const isSelf = user.id === this.socket.id;
        if (isSelf) {
            userElement.classList.add('self');
        }
        
        userElement.innerHTML = `
            <div class="user-avatar">${user.id.slice(0, 2).toUpperCase()}</div>
            <div class="user-info">
                <div class="user-name">${isSelf ? 'You' : 'User ' + user.id.slice(0, 6)}</div>
                <div class="user-status">${isSelf ? 'Online' : 'Available'}</div>
            </div>
        `;
        
        // Add click handler for non-self users
        if (!isSelf) {
            userElement.addEventListener('click', () => {
                this.selectUser(user);
            });
        }
        
        this.elements.connectedUsers.appendChild(userElement);
    }
    
    removeConnectedUser(userId) {
        const userElement = document.querySelector(`[data-user-id="${userId}"]`);
        if (userElement) {
            userElement.remove();
        }
    }
    
    selectUser(user) {
        // Don't allow selection if in a call
        if (this.isInCall) {
            return;
        }
        
        // Remove previous selection
        document.querySelectorAll('.user-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Add selection to clicked user
        const userElement = document.querySelector(`[data-user-id="${user.id}"]`);
        if (userElement) {
            userElement.classList.add('selected');
        }
        
        this.selectedUser = user.id;
        this.elements.callBtn.disabled = false;
        
        console.log('Selected user:', user.id);
    }
    
    updateWaitingMessage() {
        const userCount = this.elements.connectedUsers.children.length;
        
        if (userCount <= 1) {
            this.elements.waitingMessage.style.display = 'block';
        } else {
            this.elements.waitingMessage.style.display = 'none';
        }
    }
    
    async initiateCall() {
        if (!this.selectedUser) {
            console.error('No user selected');
            return;
        }
        
        // If no local stream, try to get basic permissions
        if (!this.localStream) {
            try {
                console.log('Requesting basic media permissions for call...');
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                this.elements.localVideo.srcObject = this.localStream;
                this.isVideoEnabled = true;
                this.isAudioEnabled = true;
            } catch (error) {
                console.error('Error accessing media devices for call:', error);
                this.handleMediaError(error);
                return;
            }
        }
        
        console.log('Initiating call with:', this.selectedUser);
        
        try {
            this.callState = 'calling';
            this.updateCallButton();
            
            // Set a timeout for the call attempt
            this.callTimeout = setTimeout(() => {
                if (this.callState === 'calling') {
                    console.log('Call timeout - no response received');
                    this.handleCallFailed();
                }
            }, 30000); // 30 second timeout
            
            // Create peer connection
            this.peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Add local stream tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }
            
            // Handle incoming remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('Received remote stream');
                this.remoteStream = event.streams[0];
                this.elements.remoteVideo.srcObject = this.remoteStream;
                this.elements.remoteVideoContainer.style.display = 'block';
            };
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate');
                    this.socket.emit('ice-candidate', {
                        candidate: event.candidate,
                        target: this.selectedUser
                    });
                }
            };
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    this.isInCall = true;
                    this.callState = 'connected';
                    this.updateCallButton();
                    if (this.callTimeout) {
                        clearTimeout(this.callTimeout);
                        this.callTimeout = null;
                    }
                } else if (this.peerConnection.connectionState === 'failed') {
                    this.handleCallFailed();
                } else if (this.peerConnection.connectionState === 'disconnected') {
                    this.handleCallDisconnected();
                }
            };
            
            // Handle ICE connection state changes
            this.peerConnection.oniceconnectionstatechange = () => {
                console.log('ICE connection state:', this.peerConnection.iceConnectionState);
                if (this.peerConnection.iceConnectionState === 'failed') {
                    this.handleCallFailed();
                }
            };
            
            // Handle ICE gathering state changes
            this.peerConnection.onicegatheringstatechange = () => {
                console.log('ICE gathering state:', this.peerConnection.iceGatheringState);
            };
            
            // Create and send offer
            const offer = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(offer);
            
            this.socket.emit('offer', {
                offer: offer,
                target: this.selectedUser
            });
            
            console.log('Call initiated');
            
        } catch (error) {
            console.error('Error initiating call:', error);
            this.handleCallFailed();
        }
    }
    
    handleIncomingCall(data) {
        console.log('Handling incoming call from:', data.from);
        
        // Show call confirmation modal
        this.showCallConfirmation(data);
    }
    
    showCallConfirmation(data) {
        // Create modal if it doesn't exist
        let modal = document.getElementById('callConfirmationModal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'callConfirmationModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <h2>Incoming Call</h2>
                    <p>User ${data.from.slice(0, 6)} is calling you...</p>
                    <div class="modal-buttons">
                        <button id="acceptCall" class="btn-primary">Accept</button>
                        <button id="rejectCall" class="btn-secondary">Decline</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            
            // Add event listeners
            document.getElementById('acceptCall').addEventListener('click', () => {
                this.acceptCall(data);
            });
            
            document.getElementById('rejectCall').addEventListener('click', () => {
                this.rejectCall(data.from);
            });
        }
        
        modal.classList.remove('hidden');
    }
    
    hideCallConfirmation() {
        const modal = document.getElementById('callConfirmationModal');
        if (modal) {
            modal.classList.add('hidden');
        }
    }
    
    async acceptCall(data) {
        console.log('Accepting call from:', data.from);
        
        this.hideCallConfirmation();
        
        // If no local stream, try to get permissions
        if (!this.localStream) {
            try {
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                this.elements.localVideo.srcObject = this.localStream;
                this.isVideoEnabled = true;
                this.isAudioEnabled = true;
            } catch (error) {
                console.error('Error accessing media devices for incoming call:', error);
                this.handleMediaError(error);
                return;
            }
        }
        
        try {
            this.callState = 'incoming';
            this.selectedUser = data.from;
            
            // Create peer connection
            this.peerConnection = new RTCPeerConnection(this.rtcConfig);
            
            // Add local stream tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => {
                    this.peerConnection.addTrack(track, this.localStream);
                });
            }
            
            // Handle incoming remote stream
            this.peerConnection.ontrack = (event) => {
                console.log('Received remote stream');
                this.remoteStream = event.streams[0];
                this.elements.remoteVideo.srcObject = this.remoteStream;
                this.elements.remoteVideoContainer.style.display = 'block';
            };
            
            // Handle ICE candidates
            this.peerConnection.onicecandidate = (event) => {
                if (event.candidate) {
                    console.log('Sending ICE candidate');
                    this.socket.emit('ice-candidate', {
                        candidate: event.candidate,
                        target: data.from
                    });
                }
            };
            
            // Handle connection state changes
            this.peerConnection.onconnectionstatechange = () => {
                console.log('Connection state:', this.peerConnection.connectionState);
                if (this.peerConnection.connectionState === 'connected') {
                    this.isInCall = true;
                    this.callState = 'connected';
                    this.updateCallButton();
                } else if (this.peerConnection.connectionState === 'failed') {
                    this.handleCallFailed();
                }
            };
            
            // Set remote description and create answer
            await this.peerConnection.setRemoteDescription(data.offer);
            const answer = await this.peerConnection.createAnswer();
            await this.peerConnection.setLocalDescription(answer);
            
            // Send answer
            this.socket.emit('answer', {
                answer: answer,
                target: data.from
            });
            
            console.log('Call accepted');
            
        } catch (error) {
            console.error('Error accepting call:', error);
            this.handleCallFailed();
        }
    }
    
    rejectCall(callerId) {
        console.log('Rejecting call from:', callerId);
        
        this.hideCallConfirmation();
        
        // Notify the caller
        this.socket.emit('call-rejected', {
            target: callerId
        });
    }
    
    handleCallRejected(data) {
        console.log('Call was rejected by:', data.from);
        this.callState = 'idle';
        this.updateCallButton();
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }
        alert('Call was rejected by the other user.');
    }
    
    handleCallEnded(data) {
        console.log('Call ended by:', data.from);
        this.endCall();
    }
    
    async handleAnswer(data) {
        console.log('Handling answer from:', data.from);
        
        try {
            await this.peerConnection.setRemoteDescription(data.answer);
            console.log('Call established');
            
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }
    
    async handleIceCandidate(data) {
        console.log('Handling ICE candidate from:', data.from);
        
        try {
            if (this.peerConnection) {
                await this.peerConnection.addIceCandidate(data.candidate);
            }
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }
    
    handleCallFailed() {
        console.log('Call failed');
        this.callState = 'idle';
        this.isInCall = false;
        this.updateCallButton();
        if (this.callTimeout) {
            clearTimeout(this.callTimeout);
            this.callTimeout = null;
        }
        alert('Call failed. Please try again.');
        this.cleanupPeerConnection();
    }
    
    handleCallDisconnected() {
        console.log('Call disconnected');
        this.callState = 'idle';
        this.isInCall = false;
        this.updateCallButton();
        alert('Call disconnected. The other user may have left.');
        this.cleanupPeerConnection();
    }
    
    endCall() {
        console.log('Ending call');
        
        // Notify the other user if we're in a call
        if (this.selectedUser && this.isInCall) {
            this.socket.emit('call-ended', {
                target: this.selectedUser
            });
        }
        
        this.cleanupPeerConnection();
        
        this.remoteStream = null;
        this.selectedUser = null;
        this.isInCall = false;
        this.callState = 'idle';
        this.elements.remoteVideoContainer.style.display = 'none';
        this.updateCallButton();
        
        // Remove selection from UI
        document.querySelectorAll('.user-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        console.log('Call ended');
    }
    
    cleanupPeerConnection() {
        if (this.peerConnection) {
            this.peerConnection.close();
            this.peerConnection = null;
        }
    }
    
    updateCallButton() {
        const callBtn = this.elements.callBtn;
        const hangUpBtn = this.elements.hangUpBtn;
        const btnIcon = callBtn.querySelector('.btn-icon');
        const btnText = callBtn.querySelector('.btn-text');
        
        switch (this.callState) {
            case 'calling':
                callBtn.disabled = true;
                hangUpBtn.style.display = 'none';
                btnIcon.textContent = '⏳';
                btnText.textContent = 'Calling...';
                break;
            case 'incoming':
                callBtn.disabled = true;
                hangUpBtn.style.display = 'none';
                btnIcon.textContent = '📞';
                btnText.textContent = 'Incoming...';
                break;
            case 'connected':
                callBtn.style.display = 'none';
                hangUpBtn.style.display = 'flex';
                break;
            default:
                callBtn.style.display = 'flex';
                hangUpBtn.style.display = 'none';
                callBtn.disabled = !this.selectedUser;
                btnIcon.textContent = '📞';
                btnText.textContent = 'Call';
        }
    }
    
    async toggleVideo() {
        // If no local stream, try to get video permission
        if (!this.localStream) {
            try {
                console.log('Requesting video permission...');
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: false
                });
                this.elements.localVideo.srcObject = this.localStream;
                this.isVideoEnabled = true;
                this.elements.toggleVideo.classList.add('active');
                this.elements.toggleVideo.querySelector('.btn-icon').textContent = '📹';
                return;
            } catch (error) {
                console.error('Error accessing video:', error);
                alert('Unable to access camera. Please check your browser permissions.');
                return;
            }
        }
        
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
            videoTrack.enabled = !videoTrack.enabled;
            this.isVideoEnabled = videoTrack.enabled;
            
            // Update button state
            this.elements.toggleVideo.classList.toggle('active', this.isVideoEnabled);
            this.elements.toggleVideo.querySelector('.btn-icon').textContent = this.isVideoEnabled ? '📹' : '🚫';
        }
    }
    
    async toggleAudio() {
        // If no local stream, try to get audio permission
        if (!this.localStream) {
            try {
                console.log('Requesting audio permission...');
                this.localStream = await navigator.mediaDevices.getUserMedia({
                    video: false,
                    audio: true
                });
                this.isAudioEnabled = true;
                this.elements.toggleAudio.classList.add('active');
                this.elements.toggleAudio.querySelector('.btn-icon').textContent = '🎤';
                return;
            } catch (error) {
                console.error('Error accessing audio:', error);
                alert('Unable to access microphone. Please check your browser permissions.');
                return;
            }
        }
        
        const audioTrack = this.localStream.getAudioTracks()[0];
        if (audioTrack) {
            audioTrack.enabled = !audioTrack.enabled;
            this.isAudioEnabled = audioTrack.enabled;
            
            // Update button state
            this.elements.toggleAudio.classList.toggle('active', this.isAudioEnabled);
            this.elements.toggleAudio.querySelector('.btn-icon').textContent = this.isAudioEnabled ? '🎤' : '🚫';
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Video Chat App');
    window.videoChatApp = new VideoChatApp();
}); 