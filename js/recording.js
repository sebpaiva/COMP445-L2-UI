const webCamContainer = document.getElementById('web-cam-container');
  
const videoMediaConstraints = {
    audio: true,
    video: true
};

const primaryButtonStyle = "btn btn-primary";
const secondaryButtonStyle = "btn btn-secondary";
const blobSegmentTime = 3000;

let chunks = [];

function displayOnScreen(segment){
    var arr = [] 
    arr.push(segment.data)
    var blob = new Blob(arr, { type: "video/mp4" });
    var recordedMedia = document.createElement("video");
    recordedMedia.controls = true;

    var recordedMediaURL = URL.createObjectURL(blob);
    recordedMedia.src = recordedMediaURL;
    console.log(chunks, recordedMedia, blob);

    document.getElementById(`vid-recorder`).append(recordedMedia);
}

async function uploadSegment(segment){
    const response = await fetch("https://.../uploadSegment", { // we can await the fetch
        method: 'POST',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        body: segment,
    });

    response.json().then(data => {
        console.log("Call response: ", JSON.stringify(data));
    });
}

async function getVideoId(){
    const response = await fetch("https://.../createVideo", { // we can await the fetch
        method: 'POST',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
        },
        body: {},
    });

    response.json().then(data => {
        console.log("Call response: ", JSON.stringify(data));
    });
}

function startRecording(thisButton, otherButton) {  
    // Ask for access
    userMedia = navigator.mediaDevices.getUserMedia(videoMediaConstraints);

    // Create video object on backend and return id
    var videoId = getVideoId();

    // If a device for video and audio input is not found, you'll see error "Requested device not found"
    userMedia.then((mediaStream) => {
        // Create a new MediaRecorder instance
        const mediaRecorder = new MediaRecorder(mediaStream);
  
        //Make the mediaStream global
        window.mediaStream = mediaStream;
        //Make the mediaRecorder global
        window.mediaRecorder = mediaRecorder;
  
        mediaRecorder.start(blobSegmentTime);
  
        // Whenever (here when the recorder stops recording) data is available
        // the MediaRecorder emits a "dataavailable" event with the recorded media data.
        mediaRecorder.ondataavailable = (e) => {
            // Push the recorded media data to the chunks array
            var currentChunk = e.data;
            
            var segment = {
                "videoId": videoId,
                "data": currentChunk,
                "sequenceNumber": chunks.size,
                "isDelivered": false
            }
            
            chunks.push(segment);

            // displayOnScreen(segment);
            uploadSegment(segment);
        };

        //mediaRecorder.requestData = (e) => {
            
        //     const chunk = e.data;
        //     const blob = new Blob(chunk, { type: "video/mp4" });
        //     const recordedMedia = document.createElement("video");
        //     recordedMedia.controls = true;

        //     const recordedMediaURL = URL.createObjectURL(blob);
        //     recordedMedia.src = recordedMediaURL;

        //     document.getElementById(`vid-recorder`).append(recordedMedia);
        // }
  
        // When the MediaRecorder stops recording, it emits "stop" event
        mediaRecorder.onstop = () => {
  
            /* A Blob is a File like object. In fact, the File interface is based on Blob. 
            File inherits the Blob interface and expands it to support the files on the user's system. 
            The Blob constructor takes the chunk of media data as the first parameter and constructs 
            a Blob of the type given as the second parameter*/
            const blob = new Blob(
                chunks.map((segment) => segment.data), {
                    type: "video/mp4" 
                });
            chunks = [];
  
            // Create a video or audio element that stores the recorded media
            const recordedMedia = document.createElement("video");
            recordedMedia.controls = true;
  
            // You can not directly set the blob as 
            // the source of the video or audio element
            // Instead, you need to create a URL for blob
            // using URL.createObjectURL() method.
            const recordedMediaURL = URL.createObjectURL(blob);
  
            // Now you can use the created URL as the
            // source of the video or audio element
            recordedMedia.src = recordedMediaURL;
  
            document.getElementById(`vid-recorder`).append(recordedMedia);
        };
  
        // Remember to use the srcObject attribute since the src attribute doesn't support media stream as a value
        webCamContainer.srcObject = mediaStream;
  
        document.getElementById(`vid-record-status`).innerText = "Recording";
  
        thisButton.disabled = true;
        thisButton.className = secondaryButtonStyle;
        otherButton.disabled = false;
        otherButton.className = primaryButtonStyle;
    });
}
  
function stopRecording(thisButton, otherButton) {
    // Stop the recording
    window.mediaRecorder.stop();
  
    // Stop all the tracks in the received media stream
    window.mediaStream.getTracks()
    .forEach((track) => {
        track.stop();
    });
  
    document.getElementById(`vid-record-status`).innerText = "Recording done!";
    thisButton.disabled = true;
    thisButton.className = secondaryButtonStyle;
    otherButton.disabled = false;
    otherButton.className = primaryButtonStyle;
}