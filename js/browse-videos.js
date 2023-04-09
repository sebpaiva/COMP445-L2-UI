
const backendUrl = "http://localhost/comp445lab2.com/endpoints";

function getVideoById(videoIdInput) {  
    getVideo(videoIdInput.value);   
}

async function getVideo(id){
    var url = backendUrl + "/video-retrieve.php/" + id
    const response = await fetch(url, { 
        method: 'GET',
        mode: 'cors',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Credentials': 'true'
        }
    })
    .then(function(response) {
        return response.json();
    }).then(function(response) {
        // Create new video tag
        var video = document.createElement("video");
        video.controls = true;
        
        // Put the received base64 video as the src
        var videoContents = response.data;
        video.src = "data:video/mp4;base64," + videoContents;
        
        // Display
        var getVideoByIdDisplay = document.getElementById(`one-video-display`);
        getVideoByIdDisplay.innerHTML = '';
        getVideoByIdDisplay.append(video);
    });
}
