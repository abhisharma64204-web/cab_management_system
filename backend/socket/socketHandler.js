module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // Client joins a ride room for targeted updates
    socket.on('joinRide', (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`📍 Socket ${socket.id} joined room: ride_${rideId}`);
    });

    socket.on('leaveRide', (rideId) => {
      socket.leave(`ride_${rideId}`);
    });

    // Relay events from client → broadcast to all
    socket.on('rideRequested', (data) => {
      io.emit('rideRequested', data);
    });

    socket.on('driverLocationUpdate', (data) => {
      // Broadcast driver's mock GPS to customer
      io.to(`ride_${data.rideId}`).emit('driverLocationUpdate', data);
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });
};
