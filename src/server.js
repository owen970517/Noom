import http from "http";
import WebSocket from "ws";
import express from "express";
import { parse } from "path";

const app = express();
app.set("view engine" , "pug");
app.set("views" , __dirname + "/public/views");
app.use("/public" , express.static(__dirname + "/public"));
app.get("/" , (req,res)=> res.render("home"));
app.get("/*" , (req,res)=>res.redirect("/"));

// ws:// 으로도 실행가능 
const handleListen = ()=> console.log(`Listening on http://localhost:3000`);

// 같은 서버에서 http와 websocket 둘 다 실행시킴 
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const sockets = [];

//socket으로 frontend와 실시간으로 소통 가능 , 연결된 브라우저를 뜻함
//on 메소드는 backend에서 연결된 사람의 정보를 제공
// vsCode의 terminal 창에서 나타남
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
});
server.listen(3000,handleListen);