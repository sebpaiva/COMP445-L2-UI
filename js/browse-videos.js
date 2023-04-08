
const backendUrl = "http://localhost/comp445lab2.com/endpoints";

function getVideoById(videoIdInput) {  
    
    console.log(getVideo(videoIdInput.value));



}

async function getVideo(id){
    var url = backendUrl + "/video-retrieve.php/" + id
    const response = await fetch(url, { 
        method: 'GET',
        // mode: 'cors',
        headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        // 'Access-Control-Allow-Origin': 'http://localhost',
        'Access-Control-Allow-Credentials': 'true'
        }
    });

    console.log(response);
    // response.json().then(data => {
    //     return data;
    // });
}
