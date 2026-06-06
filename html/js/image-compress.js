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

    const imageFile = document.getElementById("imageFile");
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

    if (imageFile) {
        imageFile.addEventListener("change", () => {
            if (imageFile.files.length) {
                selectedFile.innerHTML = `📄 ${imageFile.files[0].name}`;
            } else {
                selectedFile.innerHTML = "No file selected";
            }
        });
    }

    if (clearFiles) {
        clearFiles.addEventListener("click", () => {
            imageFile.value = "";
            selectedFile.innerHTML = "No file selected";
            qualitySelect.value = "70";
        });
    }

    if (compressBtn) {
        compressBtn.addEventListener("click", async () => {
            if (!imageFile.files.length) {
                alert("Please choose an image file");
                return;
            }

            const formData = new FormData();
            formData.append("file", imageFile.files[0]);
            formData.append("quality", qualitySelect.value);

            progressContainer.style.display = "block";
            progressBar.style.width = "20%";
            progressText.textContent = "Uploading image...";

            const response = await fetch("https://convertx-aa2j.onrender.com/compress_image", { method: "POST", body: formData });
            if (!response.ok) {
                const error = await response.text();
                alert(error);
                return;
            }

            progressBar.style.width = "80%";
            progressText.textContent = "Compressing image...";

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `compressed_${imageFile.files[0].name}`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            saveHistory("Image Compression", imageFile.files[0].name, `Quality ${qualitySelect.value}`);

            progressBar.style.width = "100%";
            progressText.textContent = "Completed";
        });
    }
});
