const ul = document.querySelector('ul');
const msg  =  document.querySelector('#msg');
const urname = document.querySelector('#name');

//socket은 서버로의 연결을 뜻함
// 새로운 창으로 열리는 페이지의 개발자툴에서 나타남
const socket = new WebSocket(`ws://${window.location.host}`);


function makeMessage(type , payload) {
    const msg = {type , payload};
    return JSON.stringify(msg);
}
socket.addEventListener("open" ,()=> {
    console.log("서버랑 연결됬음");
} )

socket.addEventListener("message" , (message)=> {
    const li = document.createElement('li');
    li.innerText = message.data;
    ul.append(li);
})

socket.addEventListener('close' , ()=> {
    console.log("서버랑 연결이 끊어짐");
})
/*
setTimeout(()=> {
    socket.send("hello from the browser");
},10000) */

msg.addEventListener('submit' , (e)=> {
    e.preventDefault();
    const input = msg.querySelector('input');
    socket.send(makeMessage("new_message" , input.value));
    const li = document.createElement('li');
    li.innerText = `You : ${input.value}`;
    ul.append(li);
    input.value = "";
})
urname.addEventListener('submit' , (e)=> {
    e.preventDefault();
    const input = urname.querySelector('input');
    socket.send(makeMessage("nickname" , input.value));
    input.value= "";
})