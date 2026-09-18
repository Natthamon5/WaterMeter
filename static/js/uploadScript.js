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
const maxPendingFiles = 20;

const overlayContainter = document.querySelector('.overlay');
const resubmitBtn = document.querySelector('.resubmit');
const exportBtn = document.querySelector('.export');
const exportModalOverlay = document.querySelector('.export-modal-overlay');
const btnXlsx = document.querySelector('.btn-xlsx');
const btnCsv = document.querySelector('.btn-csv');
const closeExportModalBtn = document.querySelector('.close-export-modal');
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
    totalRequests = fileSelectorInput.files.length;
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
    dropSection.classList.remove('drop-over-effect');
    if(e.dataTransfer.files){
        totalRequests = e.dataTransfer.files.length;
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
    submitBtn.style.display = "none";
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

        if(checkEmptyList(itemContainer)){
            overlayContainter.classList.remove('active');
            container.style.display = "block";
        }
    };
    completedRequests++;
    if (checkAndShowProgress()) {
        setTimeout(() => {
            submitBtn.style.display = "inline-block";
        }, 1000);
    }
}

async function processImgSequentially(Files) {
    for (const file of Files) {
        await listResult(file.file, file.li); // will start the next img after found resolve(); in function listResult
    }
}
function listResult(file, li) {
    return new Promise((resolve) => {
        optionContainer.style.display = "none";
        const data = new FormData();
        data.append('file', file);
        const http = new XMLHttpRequest();
        http.open("POST", "/detections", true);

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
                    let status = "Success";
                    let errorMsg = "-";
                    
                    if (digitStr.length !== 4 || roomStr.length !== 3) {
                        status = "Error";
                        errorMsg = "เลขมิเตอร์หรือเลขห้องไม่ครบตามกำหนด";
                    }
                    console.log("ข้อมูลจาก API:", jsonResponse);
                    resultFiles.push({ 
                        file_name: file.name,
                        predicted_img: jsonResponse.predicted_img,
                        digit: digitStr,
                        room: roomStr,
                        confidence: jsonResponse.confidence ?? "-", 
                        status: status,
                        error_msg: errorMsg,
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
                        file_name: file.name,
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

                    if(checkEmptyList(itemContainer)){
                        overlayContainter.classList.remove('active');
                        container.style.display = "block";
                    }
                    if(checkEmptyList(listContainer)){
                        listSection.classList.remove('active');
                    }
                };
                div.querySelector('.check-icon').onclick = () => {
                    const resubmitIndex = pendingFiles.findIndex(item => item.li === li);
                    pendingFiles[resubmitIndex].resubmitStatus = !pendingFiles[resubmitIndex].resubmitStatus;
                    div.classList.toggle('checked');
                }
                
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
                if (checkAndShowProgress()) {
                    setTimeout(() => {
                        optionContainer.style.display = "inline-block";
                    }, 1000);
                }
                // Resolve the promise so the next file can start
                resolve();
            }
        };
        http.send(data);
    });
}

function checkEmptyList(List) {
    return List.children.length === 0;
}
function checkAndShowProgress() {
    if (completedRequests === totalRequests) {
        fileProgressSpan.innerHTML = `${completedRequests}/${totalRequests}`
        setTimeout(() => {
            fileProgress.style.display = "none";
            totalRequests = 0;
            completedRequests = 0;
        }, 1000);
        return true;
    } else {
        fileProgress.style.display = "block";
        fileProgressSpan.innerHTML = `${completedRequests}/${totalRequests}`
        return false;
    }
}
function exceededFilesLimit() {
    if (pendingFiles.length > maxPendingFiles) return true; // exceeded pendingFiles limit
    else return false;
}

function listResubmit(file){
    if (resubmitFiles.some(item => item.file.name === file.name)) {
        alert(`ไฟล์ชื่อ "${file.name}" มีอยู่ในรายการแล้ว`);
        return; 
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
        if(checkEmptyList(resubmitListContainer)){
            resubmitListSection.classList.remove('active');
        }
    };
    completedRequests++;
    if (checkAndShowProgress()) {
        setTimeout(() => {
            resubmitSubmitBtn.style.display = "inline-block";
            goBackBtn.style.display = "block";
        }, 1000);
    }
}

submitBtn.onclick = () => {
    if (exceededFilesLimit()) {
        alert(`Can't submit more than 20 images, please remove some images before submit again; currently ${pendingFiles.length} images`);
        return
    }
    totalRequests = pendingFiles.length;
    processImgSequentially(pendingFiles);
    overlayContainter.classList.add('active');
    container.style.display = "none";
}

resubmitBtn.onclick = () => {
    itemContainer.classList.add('select-resubmit');
    optionContainer.classList.add('resubmit-option');
    
}
exportBtn.onclick = () => {
    exportBtn.onclick = () => {
    if (resultFiles.length === 0) {
        alert('ยังไม่มีผลลัพธ์ให้ส่งออก');
        return;
    }
    exportModalOverlay.classList.add('active'); 
}
closeExportModalBtn.onclick = () => {
    exportModalOverlay.classList.remove('active');
}
function handleExport(format) {
    exportModalOverlay.classList.remove('active'); 

    const results = resultFiles.map(r => ({
        file_name: r.file_name || '',
        digit: r.digit || '',
        room: r.room || '',
        predicted_img: r.predicted_img || '',
        confidence: r.confidence || '-',
        status: r.status || 'Success',
        error_message: r.error_msg || '-'
    }));
    

    exportBtn.disabled = true; 
    const downloadTask = fetch('/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results, format })
    })
    .then((response) => {
        if (!response.ok) throw new Error('Export request failed');
        return response.blob();
    })
    .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `detections.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    });
    const sheetTask = fetch('/export_sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
    })
    .then(res => {
        if (!res.ok) throw new Error('Sheet upload failed');
        return res.json();
    });

    Promise.all([downloadTask, sheetTask])
        .then(() => {
            console.log('ดาวน์โหลดและอัปโหลด Sheet สำเร็จ');
        })
        .catch((err) => {
            console.error('Task error:', err);
            alert('เกิดข้อผิดพลาดบางอย่างในการดาวน์โหลดหรืออัปโหลดข้อมูล');
        })
        .finally(() => {
            exportBtn.disabled = false; 
        });
}

btnXlsx.onclick = () => handleExport('xlsx');
btnCsv.onclick = () => handleExport('csv');

cancelResubmitBtn.onclick = () => {
    pendingFiles.forEach(file => {
        file.resubmitStatus = false;
    });
    itemContainer.querySelectorAll('.result').forEach(div => {
        div.classList.remove('checked');
    })
    itemContainer.classList.remove('select-resubmit');
    optionContainer.classList.remove('resubmit-option');
}

confirmResubmitBtn.onclick = () => {
    goBackBtn.style.display = "none";
    const filesToResubmit = pendingFiles.filter(item => item.resubmitStatus);
    if (filesToResubmit) {
        totalRequests = filesToResubmit.length;
        filesToResubmit.forEach(({ file, li, resubmitStatus }) => {
            if(resubmitStatus){
                listResubmit(file);
            }
        });
    }
    itemContainer.classList.remove('select-resubmit');
    optionContainer.classList.remove('resubmit-option');
    overlayContainter.style.display = "none";
    resubmitOverlay.style.display = "block";
}



resubmitFileSelector.onclick = () => resubmitFileSelectorInput.click()
resubmitFileSelectorInput.onchange = () => {
    goBackBtn.style.display = "none";
    totalRequests = resubmitFileSelectorInput.files.length;
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
        goBackBtn.style.display = "none";
        totalRequests = e.dataTransfer.files.length;
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
    resubmitFiles.forEach(({ file, li }) => {
        li.remove(); // clear resubmitList
    });
    resubmitFiles.length = 0;
    resubmitOverlay.style.display = "none";
    overlayContainter.style.display = "Block";
}
resubmitSubmitBtn.onclick = () => {
    if (exceededFilesLimit()) {
        alert(`Can't submit more than 20 images, please remove some images before submit again; currently ${pendingFiles.length} images`);
        return
    }
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
    totalRequests = resubmitFiles.length;
    const filesToProcess = [];
    resubmitFiles.forEach(({ file, li }) => {
        const liClone = li.cloneNode(true);
        li.remove();
        filesToProcess.push({file, liClone});
        listContainer.prepend(liClone);
        pendingFiles.push({ file,
                            li: liClone,
                            resubmitStatus: false });
    });
    processImgSequentially(filesToProcess);
    resubmitFiles.length = 0;
    resubmitOverlay.style.display = "none";
    overlayContainter.style.display = "Block";
}
}

const btnSheet = document.querySelector('.btn-sheet');

btnSheet.onclick = () => {
    exportModalOverlay.classList.remove('active');
    
    const results = resultFiles.map(r => ({
        file_name: r.file_name,
        digit: r.digit,
        room: r.room,
        confidence: r.confidence,
        status: r.status,
        error_message: r.error_msg
    }));

    fetch('/export_sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results })
    })
    .then(res => res.json())
    .then(data => alert('บันทึกลง Google Sheets สำเร็จ!'))
    .catch(err => alert('เกิดข้อผิดพลาดในการบันทึก'));
}