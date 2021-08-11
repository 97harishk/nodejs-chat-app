const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const app = express();
const cors  = require('cors');
const port = 8080;
const router = require('./router/route.js');

const { addUser, removeUser, getUser, getUsersInRoom } = require('./user');
const server = http.createServer(app);
const io = socketio(server);
app.use(cors());
app.use(router)
io.on('connection', (socket) =>{
    socket.on('join', ({ name, room}, callback) =>{
        const { error, user } = addUser(socket.id, name, room);
        if(error) return callback(error);
        console.log('Client Connected', user);
        socket.emit('message', { user: 'admin', text: `${user.name} welcome to the room ${user.room}`});
        socket.broadcast.to(user.room).emit('message', { user: 'admin', text: `${user.name} has joined room` });
        socket.join(user.room)
        io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
    })
    socket.on('sendMessage', (message, callback) =>{
        const user = getUser(socket.id);
        console.log(user, message)
        io.to(user.room).emit('message', {user: user.name, text: message})
        callback();
    })
    socket.on('disconnect', () =>{
        const user = removeUser(socket.id);
        console.log('disconnet');
        if(user){
            io.to(user.room).emit('message', { user: 'admin', text: `${user.name} has left!`});
            io.to(user.room).emit('roomData', { room: user.room, users: getUsersInRoom(user.room) })
        }
    })
})

server.listen(port, (err) =>{
    if(!err){
        console.log(`Express Server is running on port: ${port}`);
        return;
    }
    console.log('Express server failed to run!');
})