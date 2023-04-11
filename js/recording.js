/*
___________________________________________________________________________

                        Variables and Settings

___________________________________________________________________________
*/
const webCamContainer = document.getElementById('web-cam-container');

const primaryButtonStyle = "btn btn-primary";
const secondaryButtonStyle = "btn btn-secondary";
const blobSegmentTime = 3000;
const backendUrl = "http://localhost/comp445lab2.com/endpoints";

let chunks = [];


const videoMediaConstraints = {
    audio: true,
    video: {
        frameRate: 30,
        width: 1280,
        height: 720
    }
};

var recordingOptions = {
    // https://developer.mozilla.org/en-US/docs/Web/Media/Formats/Video_codecs#avc_(h.264)
    // Advanced Video Coding (AVC), also referred to as.0 H.264
    // Alternative: 'video/webm;codecs=h264'
    mimeType: 'video/x-matroska;codecs=avc1',
    audioBitsPerSecond: 128000,
    videoBitsPerSecond: 5000000
};

/*
___________________________________________________________________________

                        Backend Calls

___________________________________________________________________________
*/
async function createVideoId() {
    return await fetch(backendUrl + "/video-upload.php/getVideoId", {
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
        console.log(response.id)
        if (response.error || !response.id) {
            console.log(error);
            return;
        }
        return response.id;
    });
}

async function uploadSegment(segment) {
    const jsonString = JSON.stringify(segment)
    await fetch(backendUrl + "/video-upload.php/uploadSegment", {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': 'true'
        },
        //body: segment,
        body: jsonString,
    }).then(function (response) {
        return response.json();
    }).then(function (response) {
        if (response.error) {
            console.log(response);
            return;
        }

        // might need to be adjusted if this is not a reference to the segment in the `chunks` array
        segment.isDelivered = true;
    });
}

function finishUpload(videoID) {
    fetch(backendUrl + "/video-upload.php/finishUpload/" + videoID, {
        method: 'GET',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': 'true'
        }
    }).then(function (response) {
        return response.json();
    }).then(function (response) {
        console.log(response);
    });
}

/*
___________________________________________________________________________

                        Button onclicks

___________________________________________________________________________
*/
async function startRecording(thisButton, otherButton) {
    // Ask for access
    // If devices for video and audio input are not available, you'll see error "Requested device not found"
    userMedia = navigator.mediaDevices.getUserMedia(videoMediaConstraints);

    // Create video object on backend and return id
    var videoId = await createVideoId();

    userMedia.then((mediaStream) => {
        const mediaRecorder = new MediaRecorder(mediaStream, recordingOptions);

        //Make vars global
        window.mediaStream = mediaStream;
        window.mediaRecorder = mediaRecorder;

        mediaRecorder.start(blobSegmentTime);

        mediaRecorder.ondataavailable = (e) => {
            var currentChunk = e.data;

            var segment = {
                "videoId": videoId,
                "sequenceNumber": chunks.length,
                "isDelivered": false,
                "data": currentChunk
            }

            console.log(segment);

            chunks.push(segment);
            uploadSegment(segment);

            // For debugging if needed:
            // displayOnScreen(segment);
        };

        mediaRecorder.onstop = async () => {
            // For bonus points, we guarantee that all segments are received
            await uploadPendingSegments();

            // Notify backend that segments uploading is done
            finishUpload(videoId);
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

    thisButton.disabled = true;
    thisButton.className = secondaryButtonStyle;
    otherButton.disabled = false;
    otherButton.className = primaryButtonStyle;
}

/*
___________________________________________________________________________

                        Helper functions

___________________________________________________________________________
*/
async function uploadPendingSegments() {
    document.getElementById(`vid-record-status`).innerText = "Finishing segment uploads...";

    for (var segment of chunks) {
        while (!segment.isDelivered) {
            console.log("Segment with sequenceNumber:", segment.sequenceNumber, "was not uploaded, attempting to reupload..");
            await uploadSegment(segment);
        }
    }

    document.getElementById(`vid-record-status`).innerText = "Video uploaded successfully!";
}

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
