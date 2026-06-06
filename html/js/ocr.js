document.addEventListener("DOMContentLoaded", () => {

    const ocrFile =
    document.getElementById("ocrFile");

    const selectedFile =
    document.getElementById("selectedFile");

    const clearBtn =
    document.getElementById("clearFiles");

    const ocrBtn =
    document.getElementById("ocrBtn");

    const progressContainer =
    document.getElementById("progressContainer");

    const progressBar =
    document.getElementById("progressBar");

    const progressText =
    document.getElementById("progressText");

    function saveHistory(type, file, details){

        const history = JSON.parse(localStorage.getItem("convertx_history")) || [];

        history.unshift({

            type: type,
            file: file,
            details: details,
            date: new Date().toLocaleString()

        });

        localStorage.setItem("convertx_history", JSON.stringify(history));

    }

    /* FILE NAME */

    if(ocrFile){

        ocrFile.addEventListener("change", () => {

            if(ocrFile.files.length){

                selectedFile.innerHTML =
                `📄 ${ocrFile.files[0].name}`;

            }

        });

    }

    /* CLEAR */

    if(clearBtn){

        clearBtn.addEventListener("click", () => {

            ocrFile.value = "";

            selectedFile.innerHTML =
            "No image selected";

        });

    }

document.getElementById("ocrResult").style.display = "none";
    /* OCR */
    const ocrResult = document.getElementById("ocrResult");
    if (ocrResult) ocrResult.style.display = "none";
    if(ocrBtn){

        ocrBtn.addEventListener("click", async() => {

            if(!ocrFile.files.length){

                alert("Choose an image");

                return;

            }

            try{

                const formData =
                new FormData();

                formData.append(
                    "file",
                    ocrFile.files[0]
                );

                progressContainer.style.display =
                "block";

                progressText.style.display =
                "block";

                progressBar.style.width =
                "25%";

                progressText.textContent =
                "Uploading image...";

                const response =
                await fetch(

                    "https://convertx-3z99.onrender.com/ocr",

                    "https://convertx-aa2j.onrender.com/ocr",

                    {
                        method:"POST",
                        body:formData
                    }
                );


                progressBar.style.width = "80%";
                progressText.textContent = "Extracting text...";
                if(!response.ok){
                    const error = await response.text();
                    alert(error);
                    return;
                }

                const data = await response.json();
                // show result wrapper and populate extractedBox
                if (ocrResult) ocrResult.style.display = "block";
                const extractedBox = document.getElementById('extractedBox');
                if (extractedBox) extractedBox.textContent = data.text || 'No text extracted';
                if (ocrFile && ocrFile.files.length){
                    saveHistory(
                        "OCR",
                        ocrFile.files[0].name,
                        "Text Extracted"
                    );
                }

                progressBar.style.width = "100%";
                progressText.textContent = "Completed";

                // copy / clear handlers
                const copyExtracted = document.getElementById('copyExtracted');
                const clearExtracted = document.getElementById('clearExtracted');
                if (copyExtracted && extractedBox) {
                    copyExtracted.onclick = async () => {
                        try {
                            await navigator.clipboard.writeText(extractedBox.textContent || '');
                            copyExtracted.textContent = 'Copied';
                            setTimeout(() => (copyExtracted.textContent = 'Copy'), 1200);
                        } catch (err) {
                            console.error('Copy failed', err);
                        }
                    };
                }
                if (clearExtracted && extractedBox) {
                    clearExtracted.onclick = () => {
                        extractedBox.textContent = 'No extracted text yet';
                    };
                }

            } catch(error){

                console.error(error);

                alert(error);

            }

        });

    }

});
