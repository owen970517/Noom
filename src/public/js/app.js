//io 함수를 통해 socket.io가 실행하고 있는 서버를 알아서 찾아줌
const socket = io();

const myFace = document.getElementById('myFace');
const mute  =document.getElementById('mute');
const camera = document.getElementById('camera');
const cameraSelect = document.getElementById('cameras');
const welcome = document.getElementById('welcome');
const call = document.getElementById('call');


call.hidden=true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;

async function getCameras() {
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device=>device.kind === "videoinput");
        const curCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement('option');
            option.value = camera.deviceId;
            option.innerText = camera.label;
            if(curCamera.label === camera.label) {
                option.selected = true;
            }
            cameraSelect.appendChild(option);
            console.log(cameras);
        })
    }catch{
        console.log(e);
    }
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio :true,
        video : {facingMode : "user"}
    }
    const cameraConstrains = {
        audio : true , 
        video : { deviceId : {exact : deviceId}}
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstrains : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId) {
            await getCameras();
        }
        await getCameras();
    }catch(e) {
        console.log(e)
    }
}

function handleMuteBtn() {
    myStream.getAudioTracks().forEach((track)=>(track.enabled = !track.enabled));
    if(!muted) {
        mute.innerText = "Unmute";
        muted = true
    } else {
        mute.innerText = "Mute";
        muted = false
    }
}
function handleCameraBtn() {
    myStream.getVideoTracks().forEach((track)=>(track.enabled = !track.enabled));
    if(cameraOff) {
        camera.innerText = "Camera off"
        cameraOff = false
    } else {
        camera.innerText = "Camera On"
        cameraOff = true
    }
}
async function handleCameraChange() {
    await getMedia(cameraSelect.value);
}
mute.addEventListener('click' , handleMuteBtn);
camera.addEventListener('click' , handleCameraBtn);
cameraSelect.addEventListener('input' , handleCameraChange);

welcomeForm = welcome.querySelector('form');

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(e) {
    e.preventDefault();
    const input = welcomeForm.querySelector('input');
    await initCall();
    socket.emit("join_room" , input.value );
    roomName =input.value;
    input.value = "";
}

welcomeForm.addEventListener('submit' ,handleWelcomeSubmit );

// 이 코드는 방을 만드는 브라우저에서 실행되는 코드
socket.on("welcome" , async ()=> {
   const offer = await myPeerConnection.createOffer();
   myPeerConnection.setLocalDescription(offer);
   console.log("send offer")
   socket.emit("offer" , offer, roomName);
})
// 이 코드는 방에 입장하는 브라우저에서 실행되는 코드
socket.on("offer" , async (offer)=> {
    myPeerConnection.setRemoteDescription(offer);
    console.log("receive offer");
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer" , answer , roomName);
    console.log("sent answer");
})

socket.on("answer" , (answer)=> {
    console.log("received answer");
    myPeerConnection.setRemoteDescription(answer);
})
socket.on("ice" , (ice)=> {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
})

//iceCandidate는 브라우저가 서로 소통할 수 있게 해주는 방법
function makeConnection() {
    myPeerConnection = new RTCPeerConnection();
    myPeerConnection.addEventListener('icecandidate' , handleIce);
    myPeerConnection.addEventListener("addstream" , handleAddStream)
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track , myStream));
}

function handleIce(data) {
    console.log("send candidate");
    socket.emit("ice",data.candidate , roomName);
}

function handleAddStream(data) {
    const peerStream = document.getElementById('peerFace');
    peerStream.srcObject = data.stream;
    console.log(data)
}
