
const backendUrl = "http://localhost/comp445lab2.com/endpoints";

function getVideoById(videoIdInput) {
    getVideo(videoIdInput.value);
}

function getAllVideos() {
    getAllVideos();
}

async function getVideo(id) {
    var url = backendUrl + "/video-retrieve.php/" + id
    fetch(url, {
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
        if (response.error) {
            displayVideoLoadError(response);
            return;
        }
        displayVideo(response);
    });
}

function displayVideoLoadError(response) {
    // Create error message
    var errorMessage = document.createElement("h5");
    errorMessage.innerHTML = "Error: " + response.error;
    errorMessage.style = "color: red";

    // Display
    var getVideoByIdDisplay = document.getElementById(`one-video-display`);
    getVideoByIdDisplay.innerHTML = '';
    getVideoByIdDisplay.append(document.createElement("hr"));
    getVideoByIdDisplay.append(errorMessage);
}

function displayVideo(response) {
    // Create new video tag
    var video = document.createElement("video");
    video.controls = true;
    var title = document.createElement("h3");
    title.innerHTML = response.name;

    video.src = parseVideo(response.data);

    // Display
    var getVideoByIdDisplay = document.getElementById(`one-video-display`);
    getVideoByIdDisplay.innerHTML = '';
    getVideoByIdDisplay.append(document.createElement("hr"));
    getVideoByIdDisplay.append(title);
    getVideoByIdDisplay.append(video);
}

function parseVideo(videoContents) {
    // Put the received base64 video as the src
    return "data:video/mp4;base64," + videoContents;
}

async function getAllVideos() {
    var url = backendUrl + "/video-retrieve.php/"
    fetch(url, {
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
        if (response.error) {
            displayError(response);
            return;
        }
        displayAllVideos(response);
    });
}

function displayAllVideos(response) {
    var getVideoByIdDisplay = document.getElementById(`multiple-video-display`);
    // Clear the display for each button press
    getVideoByIdDisplay.innerHTML = "";

    response.forEach(element => {
        // Create new video tag
        var video = document.createElement("video");
        video.controls = true;
        var title = document.createElement("h3");
        title.innerHTML = element.name;

        video.src = parseVideo(element.data);

        // Display
        getVideoByIdDisplay.append(document.createElement("hr"));
        getVideoByIdDisplay.append(title);
        getVideoByIdDisplay.append(video);
    });
}
