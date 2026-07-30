const fileProgress = document.querySelector('.file-progress');
const fileProgressSpan = document.querySelector('.file-progress span');

const container = document.querySelector('.container');
const dropSection = document.querySelector('.drop-section');
const listSection = document.querySelector('.list-section');
const listContainer = document.querySelector('.list');
const fileSelector = document.querySelector('.file-selector');
const fileSelectorInput = document.querySelector('.file-selector-input');
const submitBtn = document.querySelector('.submit-btn button');
let pendingFiles = [];

const overlayContainter = document.querySelector('.overlay');
const resubmitBtn = document.querySelector('.resubmit');
const exportBtn = document.querySelector('.export');
const itemContainer = document.querySelector('.items');
const optionContainer = document.querySelector('.option-section');
const cancelResubmitBtn = document.querySelector('.cancel-resubmit');
const confirmResubmitBtn = document.querySelector('.confirm-resubmit');
let resultFiles = [];
let totalRequests = 0;
let completedRequests = 0;

const resubmitOverlay = document.querySelector('.resubmit-overlay');
const resubmitDropSection = document.querySelector('.resubmit-drop-section');
const resubmitListSection = document.querySelector('.resubmit-list-section');
const resubmitListContainer = document.querySelector('.resubmit-list');
const resubmitFileSelector = document.querySelector('.resubmit-file-selector');
const resubmitFileSelectorInput = document.querySelector('.resubmit-file-selector-input');
const goBackBtn = document.querySelector('.go-back-btn button');
const resubmitSubmitBtn = document.querySelector('.resubmit-submit-btn button');
let resubmitFiles = [];

fileSelector.onclick = () => fileSelectorInput.click()
fileSelectorInput.onchange = () => {
    [...fileSelectorInput.files].forEach((file) => {
        if(typeValidation(file.type))
            listFile(file);
    })
}
dropSection.ondragover = (e) => {
    e.preventDefault();
    [...e.dataTransfer.items].forEach((item) => {
        if(typeValidation(item.type)){
            dropSection.classList.add('drag-over-effect');
        }
    })
}
dropSection.ondragleave = (e) => {
    e.preventDefault();
    dropSection.classList.remove('drag-over-effect');
}
dropSection.ondrop = (e) => {
    e.preventDefault();
    dropSection.classList.remove('drop-over-effect')
    if(e.dataTransfer.files){
        [...e.dataTransfer.files].forEach((file) => {
            if(typeValidation(file.type)){
                listFile(file);
            }
        })
    }else{
        console.log("These files can't be added", e.dataTransfer.files);
    }
}

function typeValidation(type){
    var splitType = type.split('/')[0];
    if(splitType == 'image'){
        return true;
    }
}

function listFile(file){
    if (pendingFiles.some(item => item.file.name === file.name)) {
        alert(`ไฟล์ชื่อ "${file.name}" มีอยู่ในรายการแล้ว`);
        return; 
    }
    listSection.classList.add('active');
    var li = document.createElement('li');
    li.classList.add('pending');

    const previewURL = URL.createObjectURL(file);
    li.innerHTML = `
        <div class="col">
            <img src="${previewURL}" alt="preview">
        </div>

        <div class="col">
            <div class="file-name">
                <div class="name">${file.name}</div>
            </div>
            <div class="file-size">${(file.size/(1024*1024)).toFixed(2)} MB</div>
        </div>

        <div class="col">
            <svg xmlns="http://www.w3.org/2000/svg" class="cross" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
        </div>
    `;
    listContainer.prepend(li);
    pendingFiles.push({ file, li, resubmitStatus: false });

    li.querySelector('.cross').onclick = () => {
        pendingFiles = pendingFiles.filter(item => item.li !== li);
        li.remove();
        // Free memory by revoking the object URL
        URL.revokeObjectURL(previewURL);

        if(listContainer.children.length === 0){
            listSection.classList.remove('active');
        }
    };
}

function listResult(file, li) {
    // // fetch is more modern syntax but can't track progress like XMLHttpRequest
    // const data = new FormData();
    // data.append('file', file);
    // fetch('/detection', {
    //     method: 'POST',
    //     body: data
    // })
    // .then(res => res.json())
    // .then(result => {
    //     var div = document.createElement('div');
    //     div.classList.add('result');
    //     if(result["detection error"]){
    //         div.innerHTML = `
    //         <div class="icons">
    //             <svg xmlns="http://www.w3.org/2000/svg" class="cross" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
    //             <svg xmlns="http://www.w3.org/2000/svg" class="check-icon" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
    //         </div>

    //         <div class="preview">
    //             <img src="/static/img/signs-close-icon.jpg" alt="preview">
    //         </div>
            
    //         <div>
    //             <div class="result-file-name">${file.name}</div>
    //         </div>
    //         `
    //     }else{
    //         div.innerHTML = `
    //         <div class="icons">
    //             <svg xmlns="http://www.w3.org/2000/svg" class="cross" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
    //             <svg xmlns="http://www.w3.org/2000/svg" class="check-icon" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
    //         </div>

    //         <div class="preview">
    //             <img src="${result.predicted_img}" alt="preview">
    //         </div>
            
    //         <div>
    //             <div class="result-file-name">${file.name}</div>
    //         </div>

    //         <div>
    //             <div class="meter-number">เลขมิเตอร์ : ${result.digit}</div>
    //         </div>

    //         <div>
    //             <div class="room-number">เลขห้อง : ${result.room}</div>
    //         </div>
    //         `
    //     }
        
    //     div.querySelector('.cross').onclick = () => {
    //         pendingFiles = pendingFiles.filter(item => item.li !== li);
    //         resultFiles = resultFiles.filter(item => item.li !== li);

    //         li.remove();
    //         div.remove();

    //         if(checkEmptyResult){
    //             overlayContainter.classList.remove('active');
    //             container.style.display = "block";
    //         };
    //         if(listContainer.children.length === 0){
    //             listSection.classList.remove('active');
    //         }
    //     };

    //     div.querySelector('.check-icon').onclick = () => {
    //         const resubmitIndex = pendingFiles.findIndex(item => item.li === li);
    //         pendingFiles[resubmitIndex].resubmitStatus = !pendingFiles[resubmitIndex].resubmitStatus;
    //         div.classList.toggle('checked');
    //     }

    //     itemContainer.append(div);
    //     resultFiles.push({ 
    //         predicted_img: result.predicted_img,
    //         digit: result.digit,
    //         room: result.room,
    //         div,
    //         li
    //     });
    // })
    // .catch(err => console.error("Error occured:", err));

    const data = new FormData();
    data.append('file', file);
    const http = new XMLHttpRequest();
    http.open("POST", "/detection", true);

    // When the response comes back
    http.onreadystatechange = function () {
        if (http.readyState === 4) {
            var div = document.createElement('div');
            div.classList.add('result');

            let isResultError = false;
            if (http.status === 200) {
                // Parse JSON response
                const jsonResponse = JSON.parse(http.responseText);

                const digitStr = String(jsonResponse.digit || "").trim();
                const roomStr = String(jsonResponse.room || "").trim();
                
                isResultError = (digitStr.length !== 4 || roomStr.length !== 3);

                if (digitStr.length !== 4 || roomStr.length !== 3) {
                    div.style.border = "2px solid red"; 
                    div.style.backgroundColor = "#ffe6e6";
                }
                // const errorStyle = 'border: 2px solid red;';

                // const meterStyle = digitStr.length !== 4 ? `style="${errorStyle}"` : '';
                // const roomStyle = roomStr.length !== 3 ? `style="${errorStyle}"` : '';

                // console.log("Prediction:", jsonResponse);
                div.innerHTML = `
                <div class="icons">
                    <svg xmlns="http://www.w3.org/2000/svg" class="cross" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" class="check-icon" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                </div>

                <div class="preview">
                    <img src="${jsonResponse.predicted_img}" alt="preview">
                </div>
                
                <div>
                    <div class="result-file-name">${file.name}</div>
                </div>

                <div>
                    <div class="meter-number">เลขมิเตอร์ : ${jsonResponse.digit}</div>
                </div>

                <div>
                    <div class="room-number">เลขห้อง : ${jsonResponse.room}</div>
                </div>
                `
                resultFiles.push({ 
                    predicted_img: jsonResponse.predicted_img,
                    digit: jsonResponse.digit,
                    room: jsonResponse.room,
                    div,
                    li
                });
            } else {
                console.error("Error:", http.responseText);
                isResultError = true;
                div.innerHTML = `
                <div class="icons">
                    <svg xmlns="http://www.w3.org/2000/svg" class="cross" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" class="check-icon" height="24px" viewBox="0 -960 960 960" width="24px"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>
                </div>

                <div class="preview">
                    <img src="/static/img/signs-close-icon.jpg" alt="preview">
                </div>
                
                <div>
                    <div class="result-file-name">${file.name}</div>
                </div>
                `
                resultFiles.push({ 
                    predicted_img: null,
                    digit: null,
                    room: null,
                    div,
                    li
                });
            }
            div.querySelector('.cross').onclick = () => {
                pendingFiles = pendingFiles.filter(item => item.li !== li);
                resultFiles = resultFiles.filter(item => item.li !== li);

                li.remove();
                div.remove();

                if(itemContainer.children.length === 0){
                    overlayContainter.classList.remove('active');
                    container.style.display = "block";
                };
                if(listContainer.children.length === 0){
                    listSection.classList.remove('active');
                }
            };
            div.querySelector('.check-icon').onclick = () => {
                const resubmitIndex = pendingFiles.findIndex(item => item.li === li);
                pendingFiles[resubmitIndex].resubmitStatus = !pendingFiles[resubmitIndex].resubmitStatus;
                div.classList.toggle('checked');
            }
            // itemContainer.append(div);
            if (isResultError) {
                div.classList.add('error-result');
                div.style.border = "2px solid red";
                div.style.backgroundColor = "#ffe6e6";
                itemContainer.append(div); 
            } else {
                const firstErrorNode = itemContainer.querySelector('.error-result');
                
                if (firstErrorNode) {
                    itemContainer.insertBefore(div, firstErrorNode);
                } else {
                    itemContainer.append(div);
                }
            }
            completedRequests++;
            fileProgressSpan.innerHTML = `${completedRequests}/${totalRequests}`
            if(totalRequests === completedRequests){
                fileProgress.style.display = "none";
                totalRequests = 0;
                completedRequests = 0;
            }
        }
    };
    http.send(data);
}

function checkEmptyResult() {
    return itemContainer.children.length === 0;
}

function listResubmit(file){
    if (resubmitFiles.some(item => item.file.name === file.name)) {
        alert(`ไฟล์ชื่อ "${file.name}" มีอยู่ในรายการแล้ว`);
        return; // ออกจากฟังก์ชันทันทีหากชื่อซ้ำ
    }
    resubmitListSection.classList.add('active');
    var li = document.createElement('li');
    li.classList.add('resubmit-pending');

    const previewURL = URL.createObjectURL(file);
    li.innerHTML = `
        <div class="col">
            <img src="${previewURL}" alt="preview">
        </div>

        <div class="col">
            <div class="file-name">
                <div class="name">${file.name}</div>
            </div>
            <div class="file-size">${(file.size/(1024*1024)).toFixed(2)} MB</div>
        </div>

        <div class="col">
            <svg xmlns="http://www.w3.org/2000/svg" class="resubmit-cross" height="24px" viewBox="0 -960 960 960" width="24px"><path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z"/></svg>
        </div>
    `;
    resubmitListContainer.prepend(li);
    resubmitFiles.push({ file, li });

    li.querySelector('.resubmit-cross').onclick = () => {
        resubmitFiles = resubmitFiles.filter(item => item.li !== li);
        li.remove();

        // Free memory by revoking the object URL
        URL.revokeObjectURL(previewURL);
        if(resubmitListContainer.children.length === 0){
            resubmitListSection.classList.remove('active');
        }
    };
}

submitBtn.onclick = () => {
    // "this send each image file to server to upload to folder named 'uploads'."
    // pendingFiles.forEach(({file, li}) => {
    //     const data = new FormData();
    //     data.append('file', file);

    //     const http = new XMLHttpRequest;
    //     http.open('POST', '/upload', true);
    //     http.onload = () => {
    //         if (http.status === 200) {
    //             console.log("Upload success:", http.responseText);
    //         } else {
    //             console.error("Upload failed:", http.status);
    //         }
    //     };
    //     http.onerror = () => console.error("Network error");
    //     http.send(data);
    // });
    fileProgress.style.display = "block";
    totalRequests = pendingFiles.length;
    fileProgressSpan.innerHTML = `${completedRequests}/${totalRequests}`
    pendingFiles.forEach(({ file, li, resubmitStatus }) => {
        listResult(file, li);
    });
    overlayContainter.classList.add('active');
    container.style.display = "none";
}


resubmitBtn.onclick = () => {
    itemContainer.classList.add('select-resubmit');
    optionContainer.classList.add('resubmit-option');
    
}
exportBtn.onclick = () => {
    //////////////////////////////////////////////////
    //////////////////////////////////////////////////
    //////////////////////////////////////////////////
    //////////////////////////////////////////////////
    //////////////////////////////////////////////////
    //////////////////////////////////////////////////
    //////////////////////////////////////////////////
}

cancelResubmitBtn.onclick = () => {
    pendingFiles.forEach(file => {
        file.resubmitStatus = false;
    });
    itemContainer.classList.remove('select-resubmit');
    optionContainer.classList.remove('resubmit-option');
}

confirmResubmitBtn.onclick = () => {
    pendingFiles.forEach(({ file, li, resubmitStatus }) => {
        if(resubmitStatus){
            listResubmit(file);
        }
    });
    itemContainer.classList.remove('select-resubmit');
    optionContainer.classList.remove('resubmit-option');
    overlayContainter.style.display = "none";
    resubmitOverlay.style.display = "block";
}



resubmitFileSelector.onclick = () => resubmitFileSelectorInput.click()
resubmitFileSelectorInput.onchange = () => {
    [...resubmitFileSelectorInput.files].forEach((file) => {
        if(typeValidation(file.type))
            listResubmit(file);
    })
}
resubmitDropSection.ondragover = (e) => {
    e.preventDefault();
    [...e.dataTransfer.items].forEach((item) => {
        if(typeValidation(item.type)){
            resubmitDropSection.classList.add('drag-over-effect');
        }
    })
}
resubmitDropSection.ondragleave = (e) => {
    e.preventDefault();
    resubmitDropSection.classList.remove('drag-over-effect');
}
resubmitDropSection.ondrop = (e) => {
    e.preventDefault();
    resubmitDropSection.classList.remove('drop-over-effect')
    if(e.dataTransfer.files){
        [...e.dataTransfer.files].forEach((file) => {
            if(typeValidation(file.type)){
                listResubmit(file);
            }
        })
    }else{
        console.log("These files can't be added", e.dataTransfer.files);
    }
}
goBackBtn.onclick = () => {
    pendingFiles.forEach(file => {
        if(file.resubmitStatus){
            file.resubmitStatus = false;
        }
    });
    resultFiles.forEach(({ div }) => {
        div.classList.remove('checked');
    });
    resubmitFiles.length = 0;
    resubmitOverlay.style.display = "none";
    overlayContainter.style.display = "Block";
}
resubmitSubmitBtn.onclick = () => {
    pendingFiles.forEach(({ file, li, resubmitStatus }) => {
        if(resubmitStatus){
            //remove li from first page
            li.remove();

            //match li from first page with resultFiles to remove div in second page
            const match = resultFiles.find(item => item.li === li);
            if (match && match.div) {
                match.div.remove(); // remove the div from DOM
            }
            
            pendingFiles = pendingFiles.filter(item => item.li !== li);
            resultFiles = resultFiles.filter(item => item.li !== li);
        }
    });
    fileProgress.style.display = "block";
    totalRequests = resubmitFiles.length;
    fileProgressSpan.innerHTML = `${completedRequests}/${totalRequests}`
    resubmitFiles.forEach(({ file, li }) => {
        const liClone = li.cloneNode(true);
        li.remove();
        listResult(file, liClone);
        listContainer.prepend(liClone);
        pendingFiles.push({ file,
                            li: liClone,
                            resubmitStatus: false });
    });
    resubmitFiles.length = 0;
    resubmitOverlay.style.display = "none";
    overlayContainter.style.display = "Block";
}