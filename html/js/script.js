
document.addEventListener("DOMContentLoaded", () => {
    
    window.addEventListener("beforeunload", () => {
    console.log("PAGE RELOAD DETECTED");
    });
    console.log("ConvertX Loaded");

    /* ========================= */
    /* UNIVERSAL DARK MODE */
    /* ========================= */

    const themeToggle = document.querySelector(".theme-toggle");

    const savedTheme = localStorage.getItem("theme");

if(savedTheme === "dark"){

    document.documentElement.classList.add("dark");

}

if(themeToggle){

    themeToggle.addEventListener("click", () => {

        document.documentElement.classList.toggle("dark");

        if(document.documentElement.classList.contains("dark")){

            localStorage.setItem("theme","dark");

        }else{

            localStorage.setItem("theme","light");

        }

    });

}

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

    /* ========================= */
    /* RECENT CONVERSIONS */
    /* ========================= */

    const recentSection = document.getElementById("recentSection");

    const recentList = document.getElementById("recentList");

    const recentConversions = [];

    if(recentSection && recentList){

        if(recentConversions.length === 0){

            recentSection.style.display = "none";

        }else{

            recentConversions.forEach(file => {

                recentList.innerHTML += `

                <div class="recent-item">

                    <span>${file.name}</span>

                    <span class="status">

                        ${file.status}

                    </span>

                </div>

                `;

            });

        }

    }

    /* ========================= */
    /* CONVERTER */
    /* ========================= */
const convertBtn = document.getElementById("convertBtn");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");
    const fileInput = document.getElementById("fileUpload");

    const selects = document.querySelectorAll(".convert-select");
    if (convertBtn && fileInput && selects.length >= 2) {
        convertBtn.addEventListener("click", async (e) => {
            
            e.preventDefault();
console.log("BUTTON CLICKED");
            const file = fileInput.files[0];

            if (!file) {
                alert("Please choose a file");
                return;
            }

            const fromFormat = selects[0].value.toLowerCase();
            const toFormat = selects[1].value.toLowerCase();
            const formData = new FormData();

            for (const file of fileInput.files) {
                formData.append("file", file);
            }

            formData.append("from", fromFormat);
            formData.append("to", toFormat);
            
            try {
                convertBtn.textContent = "Converting...";
                console.log("Sending request...");
                

progressBar.style.width = "10%";
progressText.textContent = "Uploading...";
                const response = await fetch(
                    "https://convertx-3z99.onrender.com/convert",
                    {
                        method: "POST",
                        body: formData
                    }
                );
                console.log("Response received", response);
                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(errorText);
                    alert(errorText);
                    convertBtn.textContent = "Start Conversion";
                    return;
                }
progressBar.style.width = "40%";
progressText.textContent = "Converting...";
const blob = await response.blob();
                progressBar.style.width = "90%";
                progressText.textContent = "Preparing download...";
                const disposition = response.headers.get("Content-Disposition");

let filename = "download";

if (disposition) {
    const match = disposition.match(/filename="?([^"]+)"?/);
    if (match) {
        filename = match[1];
    }
}

                // If the returned file is a text file, show it inline in the extracted box
                const extractedBox = document.getElementById("extractedBox");
                if (filename.toLowerCase().endsWith('.txt')) {
                    const text = await blob.text();
                    if (extractedBox) extractedBox.textContent = text || 'No text extracted';
                }

                if (file) {
                    saveHistory(
                        "Conversion",
                        file.name,
                        `${fromFormat.toUpperCase()} → ${toFormat.toUpperCase()}`
                    );
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                progressBar.style.width = "100%";
                progressText.textContent = "Completed!";
                setTimeout(() => URL.revokeObjectURL(url), 1000);

                convertBtn.textContent = "Start Conversion";
                alert("Conversion completed");
            } catch (error) {
                console.error("FULL ERROR:", error);
                alert("ERROR: " + error);
                convertBtn.textContent = "Start Conversion";
            }
        });
    }
setTimeout(() => {

    if(progressBar){
        progressBar.style.width = "0%";
    }

    if(progressText){
        progressText.textContent = "";
    }

}, 2000);

        // Extracted text actions (copy / clear)
        const copyExtracted = document.getElementById('copyExtracted');
        const clearExtracted = document.getElementById('clearExtracted');
        const extractedBox = document.getElementById('extractedBox');

        if (copyExtracted && extractedBox) {
            copyExtracted.addEventListener('click', async () => {
                try {
                    await navigator.clipboard.writeText(extractedBox.textContent || '');
                    copyExtracted.textContent = 'Copied';
                    setTimeout(() => (copyExtracted.textContent = 'Copy'), 1200);
                } catch (err) {
                    console.error('Copy failed', err);
                }
            });
        }

        if (clearExtracted && extractedBox) {
            clearExtracted.addEventListener('click', () => {
                extractedBox.textContent = 'No extracted text yet';
            });
        }
    /* ========================= */
    /* FILE NAME DISPLAY */
    /* ========================= */

     const selectedFile = document.getElementById("selectedFile");
if(fileInput && selectedFile){

    fileInput.addEventListener("change", ()=>{

        const files = fileInput.files;
        const count = files.length;

        if(count === 0){

            selectedFile.innerHTML = "No files selected";

        }

        else if(count === 1){

            selectedFile.innerHTML =
                `📄 ${files[0].name}`;

        }

        else if(count === 2){

            selectedFile.innerHTML =
                `📄 ${files[0].name}<br>
                 📄 ${files[1].name}`;

        }

        else{

            selectedFile.innerHTML =
                `📁 <strong>${count} Files Selected</strong><br>
                 Ready for Conversion`;

        }

    });

}


    /* ========================= */
    /* QUICK CONVERT AUTO SELECT */
    /* ========================= */

    const params = new URLSearchParams(window.location.search);

    const from = params.get("from");

    const to = params.get("to");

    if(from && to && selects.length >= 2){

        selects[0].value = from;

        selects[1].value = to;

    }

    /* ========================= */
    /* SMART FORMAT OPTIONS */
    /* ========================= */

   const conversionMap = {

    PDF: ["DOCX", "TXT", "PNG", "JPG"],

    DOCX: ["PDF", "TXT"],

    PPTX: ["PDF"],

    XLSX: ["PDF", "CSV"],

    JPG: ["PDF", "PNG"],

    JPEG: ["PDF", "PNG"],

    PNG: ["PDF", "JPG"]

};

    if(selects.length >= 2){

        const fromSelect = selects[0];

        const toSelect = selects[1];

        function updateFormats(){

            const selected = fromSelect.value;

            const formats = conversionMap[selected];

            if(!formats){

                return;

            }

            toSelect.innerHTML = "";

            formats.forEach(format => {

                const option = document.createElement("option");

                option.value = format;

                option.textContent = format;

                toSelect.appendChild(option);

            });

        }

        fromSelect.addEventListener("change", updateFormats);

        updateFormats();

    }

const clearBtn = document.getElementById("clearFiles");


if(clearBtn && fileInput && selectedFile){

    clearBtn.addEventListener("click", () => {

        fileInput.value = "";

        selectedFile.innerHTML = "No files selected";

        console.log("Files cleared");

    });

}
const dropZone = document.getElementById("dropZone");

if(dropZone && fileInput){

    dropZone.addEventListener("dragover", (e) => {

        e.preventDefault();

        dropZone.classList.add("dragover");

    });

    dropZone.addEventListener("dragleave", () => {

        dropZone.classList.remove("dragover");

    });

    dropZone.addEventListener("drop", (e) => {

        e.preventDefault();

        dropZone.classList.remove("dragover");

        fileInput.files = e.dataTransfer.files;

        fileInput.dispatchEvent(new Event("change"));

    });

}
});
