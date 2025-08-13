# SSE Proof of Concept

A simple Server-Sent Events (SSE) implementation with a Node.js server and HTML frontend for testing real-time event streaming.

## Features

- **SSE Server**: Node.js server with Express.js that generates random numbers every 10 seconds
- **Frontend Interface**: Simple HTML/CSS/JavaScript client to connect to event streams
- **Multi-Client Support**: Multiple clients can connect to the same stream ID
- **Stream Isolation**: Different stream IDs maintain separate event streams
- **Connection Management**: Automatic cleanup when clients disconnect
- **Error Handling**: Graceful handling of connection failures and server errors

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start the Server**
   ```bash
   npm start
   ```
   The server will start on `http://localhost:3000`

3. **Open the Frontend**
   - Navigate to `http://localhost:3000` in your browser
   - Or open `index.html` directly in your browser

4. **Test the Connection**
   - Enter a stream ID (e.g., "test1") in the input field
   - Click "Connect" to start receiving events
   - You should see random numbers appearing every 10 seconds

## API Endpoints

### `GET /sse/{id}`
Establishes a Server-Sent Events connection for the specified stream ID.

**Parameters:**
- `id` (string): Unique identifier for the event stream

**Response:**
- Content-Type: `text/event-stream`
- Events are sent in JSON format every 10 seconds

**Event Format:**
```json
{
  "number": 42,
  "timestamp": "2025-01-13T10:30:00.000Z",
  "id": "stream-id"
}
```

### `GET /`
Serves the main frontend HTML interface.

## Testing Multi-Client Functionality

1. **Same Stream Test**:
   - Open multiple browser tabs to `http://localhost:3000`
   - Connect all tabs to the same stream ID
   - Verify all tabs receive identical events

2. **Different Stream Test**:
   - Connect different tabs to different stream IDs
   - Verify each stream receives independent events

3. **Multi-Client Test Page**:
   - Navigate to `http://localhost:3000/test-multi-client.html`
   - Use the side-by-side interface to test multiple connections

## Project Structure

```
sse-proof-of-concept/
├── server.js              # Main SSE server
├── index.html             # Frontend interface
├── test-multi-client.html # Multi-client testing page
├── package.json           # Node.js dependencies
└── README.md             # This file
```

## How It Works

### Server Side
1. Express.js server listens on port 3000
2. `/sse/{id}` endpoint accepts GET requests and establishes SSE connections
3. Each stream ID maintains its own event generation timer
4. Random numbers (1-1000) are generated every 10 seconds
5. Events are broadcast to all clients connected to the same stream ID
6. Automatic cleanup when clients disconnect

### Client Side
1. HTML interface with input field for stream ID
2. JavaScript uses EventSource API to connect to SSE endpoint
3. Real-time display of incoming events
4. Connection status indicators and error handling
5. Event history with timestamps and visual feedback

## Configuration

### Server Configuration
- **Port**: 3000 (configurable in `server.js`)
- **Event Interval**: 10 seconds (configurable in `startEventGeneration` function)
- **Random Number Range**: 1-1000 (configurable in `generateRandomNumber` function)

### Frontend Configuration
- **Server URL**: `http://localhost:3000` (update in `index.html` if needed)
- **Max Events Display**: 100 events (configurable in `displayEvent` function)

## Troubleshooting

### Common Issues

1. **Connection Failed**
   - Ensure the server is running on port 3000
   - Check if another application is using port 3000
   - Verify firewall settings allow localhost connections

2. **No Events Received**
   - Check browser console for JavaScript errors
   - Verify the stream ID is entered correctly
   - Ensure EventSource API is supported in your browser

3. **CORS Issues**
   - The server includes CORS headers for localhost
   - If accessing from a different domain, update CORS settings in `server.js`

### Browser Compatibility
- Modern browsers with EventSource API support
- Chrome, Firefox, Safari, Edge (recent versions)
- Internet Explorer 11+ (with polyfill)

## Development

### Adding Features
- **Custom Event Types**: Modify the event generation in `startEventGeneration`
- **Authentication**: Add middleware to validate stream access
- **Persistence**: Store events in a database for replay functionality
- **Rate Limiting**: Add rate limiting to prevent abuse

### Debugging
- Server logs all connections and events to console
- Frontend logs events and errors to browser console
- Use browser developer tools to inspect SSE connections

## License

MIT License - Feel free to use this code for learning and development purposes.