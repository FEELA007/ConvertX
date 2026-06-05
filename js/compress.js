document.addEventListener("DOMContentLoaded", () => {
    const themeToggle = document.querySelector(".theme-toggle");
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "dark") { document.documentElement.classList.add("dark"); document.body.classList.add("dark"); }
    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark");document.body.classList.toggle("dark");
            localStorage.setItem("theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
        });
    }

    const compressFile = document.getElementById("compressFile");
    const selectedFile = document.getElementById("selectedFile");
    const clearFiles = document.getElementById("clearFiles");
    const compressBtn = document.getElementById("compressBtn");
    const qualitySelect = document.getElementById("qualitySelect");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    function saveHistory(type, file, details){
        const history = JSON.parse(localStorage.getItem("convertx_history")) || [];
        history.unshift({ type, file, details, date: new Date().toLocaleString() });
        localStorage.setItem("convertx_history", JSON.stringify(history));
    }

    if (compressFile) {
        compressFile.addEventListener("change", () => {
            if (compressFile.files.length) {
                selectedFile.innerHTML = `📄 ${compressFile.files[0].name}`;
            } else {
                selectedFile.innerHTML = "No file selected";
            }
        });
    }

    if (clearFiles) {
        clearFiles.addEventListener("click", () => {
            compressFile.value = "";
            selectedFile.innerHTML = "No file selected";
            qualitySelect.value = "70";
        });
    }

    if (compressBtn) {
        compressBtn.addEventListener("click", async () => {
            if (!compressFile.files.length) {
                alert("Please choose a PDF file");
                return;
            }

            const formData = new FormData();
            formData.append("file", compressFile.files[0]);
            formData.append("quality", qualitySelect.value);

            progressContainer.style.display = "block";
            progressBar.style.width = "20%";
            progressText.textContent = "Uploading file...";

            const response = await fetch("https://convertx-cfki.onrender.com/compress_pdf", { method: "POST", body: formData });
            if (!response.ok) {
                const error = await response.text();
                alert(error);
                return;
            }

            progressBar.style.width = "80%";
            progressText.textContent = "Compressing PDF...";

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `compressed_${compressFile.files[0].name}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            saveHistory("Compress", compressFile.files[0].name, `Quality ${qualitySelect.value}`);

            progressBar.style.width = "100%";
            progressText.textContent = "Completed";
        });
    }
});