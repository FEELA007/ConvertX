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

    const mergeFiles = document.getElementById("mergeFiles");
    const selectedFile = document.getElementById("selectedFile");
    const clearFiles = document.getElementById("clearFiles");
    const mergeBtn = document.getElementById("mergeBtn");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    function saveHistory(type, file, details){
        const history = JSON.parse(localStorage.getItem("convertx_history")) || [];
        history.unshift({ type, file, details, date: new Date().toLocaleString() });
        localStorage.setItem("convertx_history", JSON.stringify(history));
    }

    if (mergeFiles) {
        mergeFiles.addEventListener("change", () => {
            const files = mergeFiles.files;
            if (!files.length) {
                selectedFile.innerHTML = "No files selected";
                return;
            }
            selectedFile.innerHTML = Array.from(files).map(file => `📄 ${file.name}`).join("<br>");
        });
    }

    if (clearFiles) {
        clearFiles.addEventListener("click", () => {
            mergeFiles.value = "";
            selectedFile.innerHTML = "No files selected";
        });
    }

    if (mergeBtn) {
        mergeBtn.addEventListener("click", async () => {
            const files = mergeFiles.files;
            if (!files.length) {
                alert("Please choose PDF files to merge");
                return;
            }

            const formData = new FormData();
            for (const file of files) {
                formData.append("file", file);
            }
            formData.append("to", "merge");

            progressContainer.style.display = "block";
            progressBar.style.width = "20%";
            progressText.textContent = "Uploading files...";

            const response = await fetch("https://convertx-aa2j.onrender.com/convert", { method: "POST", body: formData });
            if (!response.ok) {
                const error = await response.text();
                alert(error);
                return;
            }

            progressBar.style.width = "80%";
            progressText.textContent = "Merging PDFs...";

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "merged.pdf";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            saveHistory("Merge", files[0].name, "PDFs merged");

            progressBar.style.width = "100%";
            progressText.textContent = "Completed";
        });
    }
});
