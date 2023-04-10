const webCamContainer = document.getElementById('web-cam-container');

const videoMediaConstraints = {
    audio: true,
    video: true
};

const primaryButtonStyle = "btn btn-primary";
const secondaryButtonStyle = "btn btn-secondary";
const blobSegmentTime = 3000;
const backendUrl = "http://localhost/comp445lab2.com/endpoints";

let chunks = [];

function displayOnScreen(segment) {
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

async function createVideoId() {
    return fetch(backendUrl + "/video-upload.php/getVideoId", {
        method: 'GET',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': 'true'
        }
    }).then(function (response) {
        return response.json();
    }).then(function (response) {
        if (response.error || !response.id) {
            console.log(error)
            return;
        }
        return response.id;
    });
}

async function uploadSegment(segment) {
    console.log(segment);
    fetch(backendUrl + "/video-upload.php/uploadSegment", {
        method: 'POST',
        mode: 'cors',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': 'true'
        },
        body: segment,
    }).then(function (response) {
        return response.json();
    }).then(function (response) {
        if (response.error) {
            console.log(response);
            // displayError(response);
            return;
        }

        // might not work if this is not a reference
        segment.isDelivered = true;
        console.log(reference);
    });
}

function uploadPendingSegments() {
    chunks.forEach((segment) => {
        if (!segment.isDelivered) {
            uploadSegment(segment);
        }
    });
}

async function startRecording(thisButton, otherButton) {
    // Ask for access
    userMedia = navigator.mediaDevices.getUserMedia(videoMediaConstraints);

    // Create video object on backend and return id
    var videoId = await createVideoId();

    // If a device for video and audio input is not found, you'll see error "Requested device not found"
    userMedia.then((mediaStream) => {
        const mediaRecorder = new MediaRecorder(mediaStream);

        //Make vars global
        window.mediaStream = mediaStream;
        window.mediaRecorder = mediaRecorder;

        mediaRecorder.start(blobSegmentTime);

        // Whenever (here when the recorder stops recording) data is available
        // the MediaRecorder emits a "dataavailable" event with the recorded media data.
        mediaRecorder.ondataavailable = (e) => {
            var currentChunk = e.data;

            var segment = {
                "videoId": videoId,
                "data": currentChunk,
                "sequenceNumber": chunks.length,
                "isDelivered": false
            }

            chunks.push(segment);

            // displayOnScreen(segment);

            // SHUOLD BE THE OTHER ONE
            uploadSegment(segment);
            // uploadPendingSegments();
        };

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

            const recordedMedia = document.createElement("video");
            recordedMedia.controls = true;

            const recordedMediaURL = URL.createObjectURL(blob);
            recordedMedia.src = recordedMediaURL;

            document.getElementById(`vid-recorder`).append(recordedMedia);
        };

        webCamContainer.srcObject = mediaStream;

        document.getElementById(`vid-record-status`).innerText = "Recording";

        thisButton.disabled = true;
        thisButton.className = secondaryButtonStyle;
        otherButton.disabled = false;
        otherButton.className = primaryButtonStyle;
    });
}

function stopRecording(thisButton, otherButton) {
    window.mediaRecorder.stop();

    // Stop all the tracks in the received media stream
    window.mediaStream.getTracks().forEach((track) => {
        track.stop();
    });

    document.getElementById(`vid-record-status`).innerText = "Recording done!";
    thisButton.disabled = true;
    thisButton.className = secondaryButtonStyle;
    otherButton.disabled = false;
    otherButton.className = primaryButtonStyle;
}