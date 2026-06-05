document.addEventListener("DOMContentLoaded", () => {

    const themeToggle = document.querySelector(".theme-toggle");
    const savedTheme = localStorage.getItem("theme");

    if (savedTheme === "dark") {
        document.documentElement.classList.add("dark");
        document.body.classList.add("dark");
    }

    if (themeToggle) {
        themeToggle.addEventListener("click", () => {
            document.documentElement.classList.toggle("dark");document.body.classList.toggle("dark");
            if (document.documentElement.classList.contains("dark")) {
                localStorage.setItem("theme", "dark");
            } else {
                localStorage.setItem("theme", "light");
            }
        });
    }
    const clearBtn = document.getElementById("clearHistory");
const list =
document.getElementById("historyList");
    const history = JSON.parse(localStorage.getItem("convertx_history")) || [];
    
    if (!list) return;

    if (history.length === 0) {
        list.innerHTML = "<p>No History Yet</p>";
    } else {
        list.innerHTML = "";
        history.forEach(item => {
            list.innerHTML += `
                <div class="history-item glass">
                    <div class="history-header">
                        <strong>${item.file}</strong>
                        <span>${item.type}</span>
                    </div>
                    <div class="history-details">${item.details}</div>
                    <div class="history-date">${item.date}</div>
                </div>
            `;
        });
    }

    if (clearBtn) {
        clearBtn.addEventListener("click", () => {
            localStorage.removeItem("convertx_history");
            if (list) {
                list.innerHTML = "<p>No History Yet</p>";
            }
        });
    }

});