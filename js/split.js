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

    const splitFile = document.getElementById("splitFile");
    const selectedFile = document.getElementById("selectedFile");
    const clearFiles = document.getElementById("clearFiles");
    const splitBtn = document.getElementById("splitBtn");
    const pageRange = document.getElementById("pageRange");
    const progressContainer = document.getElementById("progressContainer");
    const progressBar = document.getElementById("progressBar");
    const progressText = document.getElementById("progressText");

    function saveHistory(type, file, details){
        const history = JSON.parse(localStorage.getItem("convertx_history")) || [];
        history.unshift({ type, file, details, date: new Date().toLocaleString() });
        localStorage.setItem("convertx_history", JSON.stringify(history));
    }

    if (splitFile) {
        splitFile.addEventListener("change", () => {
            if (splitFile.files.length) {
                selectedFile.innerHTML = `📄 ${splitFile.files[0].name}`;
            } else {
                selectedFile.innerHTML = "No file selected";
            }
        });
    }

    if (clearFiles) {
        clearFiles.addEventListener("click", () => {
            splitFile.value = "";
            selectedFile.innerHTML = "No file selected";
            pageRange.value = "";
        });
    }

    if (splitBtn) {
        splitBtn.addEventListener("click", async () => {
            if (!splitFile.files.length) {
                alert("Please choose a PDF file");
                return;
            }
            if (!pageRange.value.trim()) {
                alert("Please enter the page range");
                return;
            }

            const formData = new FormData();
            formData.append("file", splitFile.files[0]);
            formData.append("pages", pageRange.value.trim());

            progressContainer.style.display = "block";
            progressBar.style.width = "20%";
            progressText.textContent = "Uploading file...";

            const response = await fetch("http://127.0.0.1:5000/split", { method: "POST", body: formData });
            if (!response.ok) {
                const error = await response.text();
                alert(error);
                return;
            }

            progressBar.style.width = "80%";
            progressText.textContent = "Splitting PDF...";

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `split_${pageRange.value}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);

            saveHistory("Split", splitFile.files[0].name, `Pages ${pageRange.value}`);

            progressBar.style.width = "100%";
            progressText.textContent = "Completed";
        });
    }
});