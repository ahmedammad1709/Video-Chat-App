// Test script for Video Chat App
// Run this in the browser console to test various functions

class VideoChatTester {
    constructor() {
        this.app = window.videoChatApp || null;
    }
    
    // Test connection status
    testConnection() {
        if (!this.app) {
            console.error('Video Chat App not found');
            return;
        }
        
        console.log('Testing connection...');
        console.log('Socket connected:', this.app.socket?.connected);
        console.log('Connection status:', this.app.elements.statusText.textContent);
        console.log('Connected users:', this.app.elements.connectedUsers.children.length);
    }
    
    // Test media permissions
    async testMediaPermissions() {
        if (!this.app) {
            console.error('Video Chat App not found');
            return;
        }
        
        console.log('Testing media permissions...');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            console.log('Media permissions granted');
            console.log('Video tracks:', stream.getVideoTracks().length);
            console.log('Audio tracks:', stream.getAudioTracks().length);
            stream.getTracks().forEach(track => track.stop());
        } catch (error) {
            console.error('Media permission test failed:', error);
        }
    }
    
    // Test WebRTC configuration
    testWebRTCConfig() {
        if (!this.app) {
            console.error('Video Chat App not found');
            return;
        }
        
        console.log('Testing WebRTC configuration...');
        console.log('ICE servers:', this.app.rtcConfig.iceServers);
        console.log('ICE candidate pool size:', this.app.rtcConfig.iceCandidatePoolSize);
    }
    
    // Test server URL detection
    testServerUrl() {
        if (!this.app) {
            console.error('Video Chat App not found');
            return;
        }
        
        console.log('Testing server URL detection...');
        const serverUrl = this.app.getServerUrl();
        console.log('Detected server URL:', serverUrl);
    }
    
    // Run all tests
    async runAllTests() {
        console.log('=== Video Chat App Tests ===');
        
        this.testConnection();
        this.testServerUrl();
        this.testWebRTCConfig();
        await this.testMediaPermissions();
        
        console.log('=== Tests Complete ===');
    }
    
    // Simulate user selection
    simulateUserSelection() {
        if (!this.app) {
            console.error('Video Chat App not found');
            return;
        }
        
        const users = this.app.elements.connectedUsers.children;
        if (users.length > 1) {
            const otherUser = Array.from(users).find(user => !user.classList.contains('self'));
            if (otherUser) {
                otherUser.click();
                console.log('Simulated user selection');
            } else {
                console.log('No other users available for selection');
            }
        } else {
            console.log('Need at least 2 users to test selection');
        }
    }
    
    // Simulate call initiation
    simulateCall() {
        if (!this.app) {
            console.error('Video Chat App not found');
            return;
        }
        
        if (this.app.selectedUser) {
            this.app.initiateCall();
            console.log('Simulated call initiation');
        } else {
            console.log('No user selected for call');
        }
    }
}

// Create global test instance
window.videoChatTester = new VideoChatTester();

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        console.log('Video Chat Tester ready. Use window.videoChatTester.runAllTests() to test the app.');
    }, 2000);
});

console.log('Video Chat Tester loaded. Available commands:');
console.log('- window.videoChatTester.runAllTests()');
console.log('- window.videoChatTester.testConnection()');
console.log('- window.videoChatTester.testMediaPermissions()');
console.log('- window.videoChatTester.simulateUserSelection()');
console.log('- window.videoChatTester.simulateCall()'); 