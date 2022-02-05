import http from "http";
//import WebSocket from "ws";
import {Server} from "socket.io";
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
const wsServer = new Server(httpServer, {
    cors: {
        origin : ["https://admin.socket.io"],
        credentials :true,
    },
});
instrument(wsServer, {
    auth: false
});

function publicRooms() {
    const {sockets : {adapter : {sids, rooms}, }, } =wsServer;
    const publicRooms = [];
    rooms.forEach((_,key)=> {
        if(sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName) {
   return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

wsServer.on('connection' , (socket)=> {
    socket["nickname"] = "Anon";
    socket.onAny((e)=> {
        console.log(`Socket Event:${e}`);
    });
    socket.on('enter_room' , (roomName , done) => {
        socket.join(roomName);
        done();
        // app.js 에서 만든 welcome 이벤트를 roomName의 방에 메세지를 전달
        socket.to(roomName).emit("welcome" , socket.nickname , countRoom(roomName));
        wsServer.sockets.emit("room_change" , publicRooms());
    });
    socket.on("disconnecting" , ()=> {
        socket.rooms.forEach(room=>socket.to(room).emit("bye",socket.nickname , countRoom(room) -1));
    })
    socket.on('disconnect' ,()=> {
        wsServer.sockets.emit("room_change" , publicRooms());
    } )
    socket.on("new_message" , (msg ,room,done)=> {
        socket.to(room).emit("new_message" , `${socket.nickname} : ${msg}`);
        done();
    })
    socket.on('nickname' , (nickname) => (socket["nickname"] = nickname))
});

//socket으로 frontend와 실시간으로 소통 가능 , 연결된 브라우저를 뜻함
//on 메소드는 backend에서 연결된 사람의 정보를 제공
// vsCode의 terminal 창에서 나타남
/* webSocket을 이용한 서버 운용
const sockets = [];
const wss = new WebSocket.Server({ server });
wss.on("connection" , (socket)=> {
    sockets.push(socket);
    socket["nickname"] = "Anon";
    console.log("브라우저랑 연결됨");
    socket.on("close" , ()=> {
        console.log("브라우저와 연결이 끊어짐");
    })
    socket.on("message" , (msg)=> {
        const message = JSON.parse(msg);
        switch(message.type) {
            case "new_message": sockets.forEach(aSocket => aSocket.send(`${socket.nickname} : ${message.payload}`));
            case "nickname" : socket["nickname"] = message.payload;
        }
    });
});*/


// ws:// 으로도 실행가능 
const handleListen = ()=> console.log(`Listening on http://localhost:3000`);

httpServer.listen(3000,handleListen);