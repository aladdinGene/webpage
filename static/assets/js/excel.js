var excelImported = false,
    directoryImported = false,
    sheet_data = [],
    imgNameNum = 0,
    imageFiles = [],
    folderChoice,
    folderNames = [],
    selectedFolderNames = [],
    imageNames = [];

async function presentImage(){
    $('.image-card-wrap').empty();
    $("#next-btn").removeClass('hide');
    $('.image-wrap').removeClass('hide');
    if(imgNameNum == (imageNames.length - 1)) {
        $('#output-btn').removeClass('hide');
        $("#next-btn").addClass('hide');
    }
    var firstImageFiles = imageFiles.filter(imageFile => imageFile.name.includes(imageNames[imgNameNum]) && selectedFolderNames.includes(imageFile.dirName[0]));
    for(let i=0;i<firstImageFiles.length;i++) {
        let file2 = await firstImageFiles[i].handle.getFile();
        let fr = new FileReader();
        var re = /(?:\.([^.]+))?$/;
        var ext = re.exec(firstImageFiles[i].name)[1];
        if(ext.toLowerCase() == 'tif' || ext.toLowerCase() == 'tiff') {
            var reader = new FileReader();
            reader.onload = (function (theFile) {
                return function (e) {
                    let buffer = e.target.result;
                    let tiff = new Tiff({buffer: buffer});
                    let canvas = tiff.toCanvas();
                    let width = tiff.width();
                    let height = tiff.height();
                    if (canvas) {
                        $('.image-card-wrap').append(
                            $('<div />').addClass('image-card')
                                .append($('<p />').addClass('dir-name').text(firstImageFiles[i].dirName.join('-')))
                                .append($(canvas).addClass('img-preview'))
                        )
                    }
                };
            })(file2);
            reader.readAsArrayBuffer(file2);
        } else {
            fr.readAsDataURL(file2);
            fr.onloadend = async function() {
                $('.image-card-wrap').append(
                    $('<div />').addClass('image-card')
                        .append($('<p />').addClass('dir-name').text(firstImageFiles[i].dirName.join('-')))
                        .append($('<img />').addClass('img-preview').attr('src', fr.result))
                )
            }
        }
    }
    
}

async function listAllFilesAndDirs(dirHandle, dirName) {
    const files = [];
    for await (let [name, handle] of dirHandle) {
        const {kind} = handle;
        if (handle.kind === 'directory') {
            let tempDirName = dirName.slice();
            tempDirName.push(name);
            if(tempDirName.length == 1) folderNames.push(name);
            files.push(...await listAllFilesAndDirs(handle, tempDirName));
        } else {
            files.push({name, handle, kind, dirName});
        }
    }
    return files;
}

async function selectShow() {
    $("#folder-choice").removeClass('hide');
    $("#show-btn").removeClass('hide');
    for(let folderName of folderNames) {
        $("#folder-choice").append($('<option />').val(folderName).text(folderName))
    }
    folderChoice = new Choices('#folder-choice', {removeItemButton: true});
}

$("#show-btn").click(function(){
    selectedFolderNames = folderChoice.getValue(true);
    $("#show-btn").addClass('hide');
    $(".choices__inner").hide();
    presentImage();
})

async function onClickHandler(e) {
    try {
        const directoryHandle = await window.showDirectoryPicker()
        const files = await listAllFilesAndDirs(directoryHandle, []);
        imageFiles = files.slice();
        directoryImported = true;
        if(excelImported && directoryImported) {
            sheet_data[0] = sheet_data[0].concat(['Category', 'Comment']);
            selectShow();
        }
    }catch(e) {
        console.log(e);
    }
}

$("#next-btn").click(function(){
    let selectedCategoryEle = document.querySelector("input[name='category']:checked");
    let selectedCommentEle = document.querySelector("input[name='option']:checked");
    let selectedCategory = selectedCategoryEle.value;
    let selectedComment = selectedCommentEle.value;
    imgNameNum++;
    sheet_data[imgNameNum] = sheet_data[imgNameNum].concat([selectedCategory, selectedComment]);
    presentImage();
})

$("#input-btn").click(onClickHandler);

$("#output-btn").click(function(){
    let selectedCategoryEle = document.querySelector("input[name='category']:checked");
    let selectedCommentEle = document.querySelector("input[name='option']:checked");
    let selectedCategory = selectedCategoryEle.value;
    let selectedComment = selectedCommentEle.value;
    sheet_data[imgNameNum+1] = sheet_data[imgNameNum+1].concat([selectedCategory, selectedComment]);
    var wb = XLSX.utils.book_new();
    var ws = XLSX.utils.aoa_to_sheet(sheet_data);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "output.xlsx", {numbers: XLSX_ZAHL_PAYLOAD, compression: true});
})

const excel_file = document.getElementById('excel_file');

excel_file.addEventListener('change', (event) => {

    if(!['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'].includes(event.target.files[0].type))
    {

        excel_file.value = '';

        return false;
    }

    var reader = new FileReader();

    reader.readAsArrayBuffer(event.target.files[0]);

    reader.onload = function(event){

        var data = new Uint8Array(reader.result);

        var work_book = XLSX.read(data, {type:'array'});

        var sheet_name = work_book.SheetNames;

        sheet_data = XLSX.utils.sheet_to_json(work_book.Sheets[sheet_name[0]], {header:1});
        var workIdNum = 0;
        var sheet_header = sheet_data[0];
        for(var i=0; i<sheet_header.length; i++) {
            if(sheet_header[i] === 'WorkID') {
                workIdNum = i;
                break;
            }
        }
        for(i=1;i<sheet_data.length;i++) {
            imageNames.push(sheet_data[i][workIdNum]);
        }
        excelImported = true;
        if(excelImported && directoryImported) {
            sheet_data[0] = sheet_data[0].concat(['Category', 'Comment']);
            selectShow();
        }
        excel_file.value = '';

    }

});