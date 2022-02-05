//io 함수를 통해 socket.io가 실행하고 있는 서버를 알아서 찾아줌
const socket = io();

const welcome = document.getElementById('welcome');
const form  = document.querySelector('form');
const room = document.getElementById('room');

room.hidden = true;
let roomName;
function addMessage(message) {
    const ul = room.querySelector('ul');
    const li = document.createElement('li');
    li.innerText = message;
    ul.appendChild(li);
}
function handleMessageSubmit(e) {
    e.preventDefault();
    const input = room.querySelector('#msg input');
    const value = input.value;
    socket.emit("new_message" , input.value , roomName, ()=> {
        addMessage(`You : ${value}` );
    });
    input.value = "";
}
function handleNameSubmit(e) {
    e.preventDefault();
    const input = room.querySelector('#name input');
    socket.emit("nickname" , input.value);
}
function showRoom() {
    welcome.hidden = true;
    room.hidden = false;
    const h3 = document.querySelector('h3');
    h3.innerText =`Room ${roomName}`;
    const msgForm = room.querySelector('#msg');
    const nameForm = room.querySelector('#name');
    msgForm.addEventListener('submit' , handleMessageSubmit);
    nameForm.addEventListener('submit' , handleNameSubmit)
}

// socket.io 는 직접 만든 이벤트를 사용가능 , object를 전달해줌
function handleSubmit(e) {
    e.preventDefault();
    const input = form.querySelector('input');
    socket.emit("enter_room" , input.value , showRoom);
    roomName = input.value;
    input.value = "";
}
form.addEventListener('submit' , handleSubmit);

socket.on("welcome" , (user,newCount)=> {
    const h3 = document.querySelector('h3');
    h3.innerText =`Room ${roomName} (${newCount})`;
    addMessage(`${user} Joined!!`);
})

socket.on("bye" , (left ,newCount)=> {
    const h3 = document.querySelector('h3');
    h3.innerText =`Room ${roomName} (${newCount})`;
    addMessage(`${left} left ㅠㅠ ` );
})

socket.on("new_message" , addMessage)

socket.on("room_change" , (rooms) => {
    const roomList = welcome.querySelector('ul');
    roomList.innerHTML = "";
    if(rooms.length ===0) {
        return;
    }
    rooms.forEach(room=> {
        const li = document.createElement('li');
        li.innerText = room;
        roomList.appendChild(li);
    })
} );