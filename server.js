const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Store active connections per stream ID
const activeStreams = new Map();

// Basic error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Serve static files
app.use(express.static(path.join(__dirname)));

// Basic logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Serve frontend at root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// SSE endpoint
app.get('/sse/:id', (req, res) => {
  const streamId = req.params.id;
  
  // Validate ID parameter
  if (!streamId || streamId.trim() === '') {
    return res.status(400).json({ error: 'Invalid stream ID' });
  }
  
  console.log(`🔌 New SSE connection for stream: ${streamId}`);
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });
  
  // Initialize stream if it doesn't exist
  if (!activeStreams.has(streamId)) {
    activeStreams.set(streamId, {
      streamId: streamId,
      clients: [],
      interval: null
    });
  }
  
  const stream = activeStreams.get(streamId);
  stream.clients.push(res);
  
  console.log(`👥 Stream ${streamId} now has ${stream.clients.length} client(s)`);
  
  // Handle client disconnect
  req.on('close', () => {
    console.log(`🔌 Client disconnected from stream: ${streamId}`);
    
    // Remove client from stream
    const clientIndex = stream.clients.indexOf(res);
    if (clientIndex !== -1) {
      stream.clients.splice(clientIndex, 1);
    }
    
    console.log(`Stream ${streamId} now has ${stream.clients.length} client(s)`);
    
    // Clean up stream if no clients left
    if (stream.clients.length === 0) {
      console.log(`Cleaning up empty stream: ${streamId}`);
      if (stream.interval) {
        clearInterval(stream.interval);
      }
      activeStreams.delete(streamId);
    }
  });
  
  // Send initial connection confirmation
  res.write(`data: {"type": "connected", "streamId": "${streamId}", "timestamp": "${new Date().toISOString()}"}\n\n`);
  
  // Start event generation if this is the first client
  if (stream.clients.length === 1 && !stream.interval) {
    console.log(`Starting event generation for stream: ${streamId}`);
    startEventGeneration(streamId);
  }
});

// Random number generator function
function generateRandomNumber() {
  return Math.floor(Math.random() * 1000) + 1;
}

// Event generation function
function startEventGeneration(streamId) {
  const stream = activeStreams.get(streamId);
  if (!stream) return;
  
  stream.interval = setInterval(() => {
    // Check if stream still has clients
    if (stream.clients.length === 0) {
      console.log(`📤 No clients for stream ${streamId}, stopping event generation`);
      clearInterval(stream.interval);
      activeStreams.delete(streamId);
      return;
    }
    
    // Generate event data
    const eventData = {
      number: generateRandomNumber(),
      timestamp: new Date().toISOString(),
      id: streamId
    };
    
    console.log(`📨 Broadcasting to stream ${streamId} (${stream.clients.length} clients): Random number ${eventData.number}`);
    
    // Send event to all clients in this stream
    const message = `data: ${JSON.stringify(eventData)}\n\n`;
    
    // Send to all clients, removing any that have disconnected
    stream.clients = stream.clients.filter(client => {
      try {
        client.write(message);
        return true;
      } catch (error) {
        console.log(`Removing disconnected client from stream ${streamId}`);
        return false;
      }
    });
    
    // Clean up if no clients left
    if (stream.clients.length === 0) {
      console.log(`All clients disconnected from stream ${streamId}, cleaning up`);
      clearInterval(stream.interval);
      activeStreams.delete(streamId);
    }
  }, 10000); // 10 seconds interval
}

// Start server
app.listen(PORT, 'localhost', () => {
  console.log('='.repeat(50));
  console.log('🚀 SSE Proof of Concept Server Started');
  console.log('='.repeat(50));
  console.log(`📡 Server URL: http://localhost:${PORT}`);
  console.log(`📄 Frontend: http://localhost:${PORT}`);
  console.log(`🧪 Multi-client test: http://localhost:${PORT}/test-multi-client.html`);
  console.log(`📋 API Endpoint: http://localhost:${PORT}/sse/{id}`);
  console.log('='.repeat(50));
  console.log('Ready to accept SSE connections...');
  console.log('Press Ctrl+C to stop the server');
  console.log('');
});

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  // Clean up all active streams
  activeStreams.forEach((stream, id) => {
    if (stream.interval) {
      clearInterval(stream.interval);
    }
    stream.clients.forEach(client => {
      client.end();
    });
  });
  activeStreams.clear();
  process.exit(0);
});