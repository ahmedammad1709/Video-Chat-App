# Video Chat App - Testing Instructions

## Quick Setup

1. **Start the server:**
   ```bash
   cd server
   npm install
   npm start
   ```

2. **Open the client:**
   - Open `client/index.html` in your browser
   - Or serve it with a local server:
     ```bash
     cd client
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

## Testing Scenarios

### ✅ Basic Connection Test
1. Open the app in two different browser tabs/windows
2. Verify both instances connect to the server (green status dot)
3. Check that both users appear in the "Connected Users" list

### ✅ Call Flow Test
1. In Tab 1: Click on the other user's name in the sidebar
2. Click "Call" button
3. In Tab 2: You should see an "Incoming Call" modal
4. Click "Accept" in Tab 2
5. Verify video streams appear in both tabs
6. Test the "Hang Up" button to end the call

### ✅ Call Rejection Test
1. In Tab 1: Click on the other user and click "Call"
2. In Tab 2: Click "Decline" in the incoming call modal
3. Verify Tab 1 shows "Call was rejected" message

### ✅ Media Controls Test
1. Start a call between two tabs
2. Test the video toggle button (📹/🚫)
3. Test the audio toggle button (🎤/🚫)
4. Verify the remote user sees the changes

### ✅ Permission Handling Test
1. Open the app in a new tab
2. Click "Skip for Now" in the permission modal
3. Verify you can still connect and see other users
4. Try to make a call - it should prompt for permissions again

### ✅ Mobile Test
1. Open the app on a mobile device
2. Test touch interactions with the user list
3. Verify the responsive design works properly
4. Test camera/microphone permissions on mobile

### ✅ Connection Stability Test
1. Start a call between two tabs
2. Refresh one of the tabs
3. Verify the other user gets notified and the call ends gracefully
4. Reconnect and test another call

### ✅ Error Handling Test
1. Block camera/microphone permissions in browser settings
2. Open the app and verify it shows the fallback test video
3. Try to make a call - it should still work with the test stream

## Expected Behavior

### ✅ Working Features
- ✅ Real-time user list updates
- ✅ Call confirmation modal with accept/decline
- ✅ WebRTC peer-to-peer video/audio streaming
- ✅ Hang up functionality
- ✅ Video/audio toggle controls
- ✅ Mobile-responsive design
- ✅ Graceful error handling
- ✅ Connection status indicators
- ✅ Call timeout handling (30 seconds)
- ✅ Page unload cleanup

### 🔧 Technical Features
- ✅ Multiple STUN servers for better connectivity
- ✅ ICE candidate exchange
- ✅ Connection state monitoring
- ✅ Media permission fallback
- ✅ Socket.IO reconnection
- ✅ Cross-browser compatibility

## Troubleshooting

### Common Issues

1. **"Unable to access camera/microphone"**
   - Check browser permissions
   - Try refreshing the page
   - The app will show a test video if permissions are denied

2. **"Call failed"**
   - Check if both users are connected to the server
   - Try refreshing both tabs
   - Check browser console for error messages

3. **"Connection Error"**
   - Verify the server is running on port 3000
   - Check if the server URL is correct in script.js
   - Try refreshing the page

4. **No video/audio in call**
   - Ensure both users granted camera/microphone permissions
   - Check if video/audio tracks are enabled
   - Try refreshing and reconnecting

### Debug Mode
Open browser developer tools (F12) and check the console for detailed logs about:
- Socket.IO connection status
- WebRTC signaling messages
- Media stream status
- Peer connection state changes

## Browser Support
- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+
- ✅ Mobile browsers (iOS Safari, Chrome Mobile) 