# Video Chat App

A complete 2-person peer-to-peer video chat web application built with WebRTC and Socket.IO.

## Features

- 🔥 **Real-time video chat** using WebRTC peer-to-peer connections
- 📱 **Responsive design** that works on desktop and mobile
- 🎥 **Camera and microphone controls** (mute/unmute, video on/off)
- 👥 **User management** with connected users list
- 🔄 **Automatic reconnection** with Socket.IO
- 🎨 **Modern UI** with a clean Zoom-like interface
- 🌐 **Cross-platform** - works on any modern browser

## Project Structure

```
video-chat-app/
├── client/
│   ├── index.html      # Main HTML file
│   ├── style.css       # Styling and responsive design
│   └── script.js       # WebRTC and Socket.IO client logic
├── server/
│   ├── index.js        # Express + Socket.IO server
│   └── package.json    # Node.js dependencies
└── README.md           # This file
```

## Quick Start

### 1. Install Server Dependencies

```bash
cd server
npm install
```

### 2. Start the Server

```bash
npm start
```

The server will run on `http://localhost:3000`

### 3. Open the Client

Open `client/index.html` in your web browser, or serve it using a local server:

```bash
# Using Python 3
cd client
python -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000
```

Then visit `http://localhost:8000`

### 4. Test the App

1. Open the app in two different browser windows/tabs
2. Grant camera and microphone permissions when prompted
3. You should see both users in the "Connected Users" sidebar
4. Click on a user and press "Call" to start a video chat
5. Use the video/audio toggle buttons to control your media

## How It Works

### Backend (Server)

The server uses **Express.js** and **Socket.IO** to handle:

- **Client connections** and disconnections
- **WebRTC signaling** (offer/answer/ICE candidates)
- **User management** with connected clients tracking
- **CORS support** for cross-origin requests

### Frontend (Client)

The client uses **WebRTC** and **Socket.IO** for:

- **Media capture** (camera and microphone)
- **Peer-to-peer connections** with WebRTC
- **Real-time signaling** via Socket.IO
- **User interface** with modern responsive design

### WebRTC Flow

1. **User A** clicks "Call" on **User B**
2. **User A** creates an offer and sends it to the server
3. Server forwards the offer to **User B**
4. **User B** creates an answer and sends it back
5. Both users exchange ICE candidates for NAT traversal
6. Direct peer-to-peer video/audio stream is established

## Deployment

### Frontend (GitHub Pages)

1. Push the `client/` folder to a GitHub repository
2. Enable GitHub Pages in repository settings
3. Update the server URL in `client/script.js`:

```javascript
const serverUrl = 'https://your-server-domain.com';
```

### Backend (Render/Railway)

1. Push the `server/` folder to a GitHub repository
2. Deploy to Render or Railway:
   - **Render**: Connect your GitHub repo and deploy as a Web Service
   - **Railway**: Connect your GitHub repo and deploy as a Node.js app
3. Set environment variables if needed
4. Update the client's server URL to your deployed server

## Configuration

### Server Configuration

Edit `server/index.js` to customize:

- **Port**: Change `PORT` variable (default: 3000)
- **CORS**: Modify CORS settings for production
- **STUN servers**: Add more ICE servers for better connectivity

### Client Configuration

Edit `client/script.js` to customize:

- **Server URL**: Change `serverUrl` for production deployment
- **WebRTC config**: Modify `rtcConfig` for different ICE servers
- **Media constraints**: Adjust video/audio quality settings

## Browser Support

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 11+
- ✅ Edge 79+

## Troubleshooting

### Common Issues

1. **"Unable to access camera and microphone"**
   - Make sure you're using HTTPS (required for getUserMedia)
   - Check browser permissions for camera/microphone
   - Try refreshing the page

2. **"Connection failed"**
   - Check if the server is running on the correct port
   - Verify the server URL in `script.js`
   - Check browser console for error messages

3. **"No video/audio in call"**
   - Ensure both users have granted camera/microphone permissions
   - Check if video/audio tracks are enabled
   - Try refreshing the page and reconnecting

4. **"ICE connection failed"**
   - This is normal for some network configurations
   - The app will try to establish connection using STUN servers
   - Consider adding TURN servers for better connectivity

### Debug Mode

Open browser developer tools and check the console for detailed logs about:
- Socket.IO connection status
- WebRTC signaling messages
- Media stream status
- Peer connection state

## Development

### Running in Development Mode

```bash
# Server with auto-restart
cd server
npm run dev

# Client with live reload (optional)
cd client
npx live-server
```

### Adding Features

- **Screen sharing**: Add `getDisplayMedia()` support
- **Chat functionality**: Implement text messaging via Socket.IO
- **Multiple participants**: Extend to support group calls
- **Recording**: Add media recording capabilities
- **File sharing**: Implement file transfer between peers

## License

MIT License - feel free to use this project for your own applications!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

Built with ❤️ using WebRTC, Socket.IO, and modern web technologies. 