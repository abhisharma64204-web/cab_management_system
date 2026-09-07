import { io } from 'socket.io-client';

const socket = io('http://ec2-65-2-187-91.ap-south-1.compute.amazonaws.com:5000', {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 2000,
});

export default socket;
