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
    // video/x-matroska;codecs=avc1
    mimeType: 'video/webm;codecs=h264',
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


// Helper Function
const blobToBase64 = (blob) => {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            resolve(reader.result);
        };
    });
};

// This function takes a segment object as input and uploads it to the backend server
async function uploadSegment(segment) {
    // Convert the binary data of the segment to base64
    const base64data = await blobToBase64(segment.data);
    // Create a new object with the base64 data and other properties from the original segment object
    const segmentObject = {
        videoId: segment.videoId,
        sequenceNumber: segment.sequenceNumber,
        isDelivered: segment.isDelivered,
        data: base64data,
    };
    // Convert the segment object to a JSON string
    const jsonString = JSON.stringify(segmentObject);

    // Log some information about the segment for debugging purposes
    // console.log(segmentObject.videoId);
    // console.log(segmentObject.sequenceNumber);
    // console.log(segmentObject.isDelivered);
    // console.log(segmentObject.data);
    // console.log(jsonString);

    // Send a POST request to the backend server to upload the segment
    fetch(backendUrl + "/video-upload.php/uploadSegment", {
        method: 'POST',
        mode: 'cors',
        credentials: 'include',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Credentials': 'true'
        },
        // Set the request body to the JSON string of the segment object
        body: jsonString,
    }).then(function (response) {
        // Convert the response to a JSON object
        return response.json();
    }).then(function (response) {
        // Check if the response contains an error
        if (response.error) {
            console.log(response);
            return;
        }
        // Mark the segment as delivered if the upload was successful
        // Note that this may need to be adjusted if the `segment` variable is not a reference to the original object
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
            //await uploadPendingSegments();

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
