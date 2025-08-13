# Design Document

## Overview

The SSE proof of concept consists of two main components: a Node.js server that implements Server-Sent Events endpoints and a simple HTML/JavaScript frontend that connects to these streams. The system uses a basic architecture focused on simplicity and local development.

## Architecture

```
┌─────────────────┐    HTTP/SSE     ┌─────────────────┐
│   Frontend      │ ──────────────► │   SSE Server    │
│   (HTML/JS)     │                 │   (Node.js)     │
│                 │                 │                 │
│ - Input field   │                 │ - /sse/{id}     │
│ - Connect btn   │                 │ - Event streams │
│ - Event display │                 │ - Random gen    │
└─────────────────┘                 └─────────────────┘
```

## Components and Interfaces

### SSE Server Component

**Technology:** Node.js with Express.js
**Port:** 3000 (configurable)

**Endpoints:**
- `GET /sse/{id}` - Establishes SSE connection for specific ID
- `GET /` - Serves the frontend HTML file (optional static serving)

**Key Features:**
- Maintains active connections per ID
- Generates random numbers every 10 seconds
- Proper SSE headers and formatting
- Connection cleanup on client disconnect

### Frontend Component

**Technology:** Vanilla HTML/CSS/JavaScript
**Files:** Single HTML file with embedded CSS and JavaScript

**Key Features:**
- Text input for ID entry
- Connect/Disconnect button functionality
- Real-time event display area
- Basic error handling and connection status

### Event Stream Management

**Stream Format:**
```
data: {"number": 42, "timestamp": "2025-01-13T10:30:00Z", "id": "stream-123"}

```

**Connection Management:**
- Each ID maintains its own event stream
- Multiple clients can connect to the same ID
- Streams are created on-demand when first client connects
- Streams continue until all clients disconnect

## Data Models

### SSE Event Structure
```javascript
{
  number: number,        // Random number (1-1000)
  timestamp: string,     // ISO timestamp
  id: string            // Stream ID
}
```

### Connection Tracking
```javascript
{
  streamId: string,
  clients: Response[],   // Array of Express response objects
  interval: NodeJS.Timer // Timer for event generation
}
```

## Error Handling

### Server-Side Error Handling
- Invalid ID parameters: Return 400 Bad Request
- Connection errors: Log and clean up resources
- Stream generation errors: Continue with next iteration
- Server shutdown: Gracefully close all connections

### Client-Side Error Handling
- Connection failures: Display error message
- Network timeouts: Show reconnection option
- Invalid server responses: Log and continue listening
- Browser compatibility: Basic feature detection

## Testing Strategy

### Manual Testing Approach
1. **Single Connection Test**
   - Start server
   - Open frontend
   - Connect with ID "test1"
   - Verify events received every 10 seconds

2. **Multiple Connection Test**
   - Open multiple browser tabs
   - Connect all to same ID
   - Verify all receive identical events

3. **Different ID Test**
   - Connect different tabs to different IDs
   - Verify each receives independent streams

4. **Disconnect Test**
   - Connect and then close browser tab
   - Verify server handles disconnection gracefully

### Development Testing
- Console logging for connection events
- Error logging for debugging
- Simple health check endpoint (optional)

## Implementation Notes

### Server Implementation Details
- Use Express.js for simplicity
- Implement proper SSE headers:
  - `Content-Type: text/event-stream`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
- Use `setInterval` for event generation
- Store active connections in memory (Map structure)

### Frontend Implementation Details
- Use EventSource API for SSE connections
- Simple DOM manipulation for UI updates
- Basic CSS for clean presentation
- No external dependencies or frameworks

### Local Development Setup
- Server runs on `http://localhost:3000`
- Frontend served from same server or opened directly
- No build process required
- Simple `npm start` or `node server.js` to run
