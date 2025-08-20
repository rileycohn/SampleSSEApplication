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

// Mock transcript data with sentiment
const mockTranscriptData = [
  { text: "Hello, welcome to our customer service. How can I help you today?", speaker: "Agent", sentiment: "positive" },
  { text: "Hi, I'm having trouble with my recent order. It hasn't arrived yet.", speaker: "Customer", sentiment: "negative" },
  { text: "I'm sorry to hear that. Let me look up your order details right away.", speaker: "Agent", sentiment: "neutral" },
  { text: "Thank you, I really appreciate your help with this.", speaker: "Customer", sentiment: "positive" },
  { text: "I found your order. It looks like there was a delay in shipping.", speaker: "Agent", sentiment: "neutral" },
  { text: "That's frustrating. When will it actually arrive?", speaker: "Customer", sentiment: "negative" },
  { text: "I can see it's now out for delivery and should arrive today by 6 PM.", speaker: "Agent", sentiment: "positive" },
  { text: "Oh wonderful! That's much better than I expected.", speaker: "Customer", sentiment: "positive" },
  { text: "I'm also adding a discount to your account for the inconvenience.", speaker: "Agent", sentiment: "positive" },
  { text: "You've been incredibly helpful. Thank you so much!", speaker: "Customer", sentiment: "positive" },
  { text: "My pleasure! Is there anything else I can help you with today?", speaker: "Agent", sentiment: "positive" },
  { text: "No, that covers everything. Have a great day!", speaker: "Customer", sentiment: "positive" }
];

let transcriptIndex = 0;

// Generate mock transcript entry
function generateTranscriptEntry() {
  const entry = mockTranscriptData[transcriptIndex % mockTranscriptData.length];
  transcriptIndex++;
  
  return {
    ...entry,
    timestamp: new Date().toISOString(),
    id: transcriptIndex
  };
}

// Generate call summary
function generateCallSummary() {
  return {
    type: "summary",
    summary: {
      duration: "8 minutes 45 seconds",
      totalMessages: mockTranscriptData.length,
      resolution: "Order delivery issue resolved successfully",
      customerSatisfaction: "High",
      keyPoints: [
        "Customer reported delayed order delivery",
        "Agent located order and identified shipping delay",
        "Order confirmed for same-day delivery by 6 PM",
        "Discount applied to customer account for inconvenience",
        "Customer expressed satisfaction with resolution"
      ],
      sentimentAnalysis: {
        positive: 7,
        neutral: 3,
        negative: 2,
        overall: "Positive"
      },
      nextActions: [
        "Monitor delivery completion",
        "Follow up with customer if needed"
      ]
    },
    timestamp: new Date().toISOString()
  };
}

// Event generation function
function startEventGeneration(streamId) {
  const stream = activeStreams.get(streamId);
  if (!stream) return;
  
  let messageCount = 0;
  
  stream.interval = setInterval(() => {
    // Check if stream still has clients
    if (stream.clients.length === 0) {
      console.log(`📤 No clients for stream ${streamId}, stopping event generation`);
      clearInterval(stream.interval);
      activeStreams.delete(streamId);
      return;
    }
    
    // Check if we've sent all transcript messages
    if (messageCount >= mockTranscriptData.length) {
      console.log(`📋 Sending call summary for stream ${streamId}`);
      
      // Send summary
      const summaryData = generateCallSummary();
      summaryData.streamId = streamId;
      const summaryMessage = `data: ${JSON.stringify(summaryData)}\n\n`;
      
      // Send summary to all clients
      stream.clients.forEach(client => {
        try {
          client.write(summaryMessage);
        } catch (error) {
          console.log(`Error sending summary to client in stream ${streamId}`);
        }
      });
      
      // Close connections after a brief delay
      setTimeout(() => {
        console.log(`🔌 Closing connections for stream ${streamId} after summary`);
        stream.clients.forEach(client => {
          try {
            client.end();
          } catch (error) {
            console.log(`Error closing client connection in stream ${streamId}`);
          }
        });
        
        // Clean up stream
        clearInterval(stream.interval);
        activeStreams.delete(streamId);
      }, 1000);
      
      return;
    }
    
    // Generate transcript data
    const eventData = {
      type: "transcript",
      ...generateTranscriptEntry(),
      streamId: streamId
    };
    
    messageCount++;
    
    console.log(`📨 Broadcasting to stream ${streamId} (${stream.clients.length} clients): ${eventData.speaker}: "${eventData.text}" (${eventData.sentiment})`);
    
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
  }, 3000); // 3 seconds interval for more realistic transcript timing
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