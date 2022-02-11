import http from "http";
//import WebSocket from "ws";
import SocketIO from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";
import { parse } from "path";

const app = express();
app.set("view engine" , "pug");
app.set("views" , __dirname + "/public/views");
app.use("/public" , express.static(__dirname + "/public"));
app.get("/" , (req,res)=> res.render("home"));
app.get("/*" , (req,res)=>res.redirect("/"));


// 같은 서버에서 http와 websocket 둘 다 실행시킴 
const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

wsServer.on("connection" , socket => {
    socket.on("join_room" , (roomName ) => {
        socket.join(roomName);
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer" , (offer , roomName)=>{
        socket.to(roomName).emit("offer" , offer);
    })
    socket.on("answer" , (answer,roomName)=> {
        socket.to(roomName).emit("answer" , answer);
    })
    socket.on("ice" , (ice,roomName)=> {
        socket.to(roomName).emit("ice" ,ice);
    })
    socket.on('disconnect' , (roomName) => {
        socket.to(roomName).emit("leave_room" );
    })
    socket.on('nickname' , (nickname) => (socket["nickname"] = nickname))
    socket.on("new_message" , (msg ,roomName,done)=> {
        socket.to(roomName).emit("new_message" , `${socket.nickname} : ${msg}`);
        done();
    })
    
    
});
 

const handleListen = ()=> console.log(`Listening on http://localhost:3000`);

httpServer.listen(3000,handleListen);