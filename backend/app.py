from datetime import datetime
import os
import subprocess
import traceback
import zipfile
import traceback
from flask import Flask, request, send_file
from flask_cors import CORS
from PIL import Image
from pdf2image import convert_from_path
from PyPDF2 import PdfReader, PdfMerger, PdfWriter
from pdf2docx import Converter
from typing import List

import pytesseract

app = Flask(__name__)
CORS(app)


BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
OUTPUT_FOLDER = os.path.join(BASE_DIR, "converted")

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

LIBREOFFICE_PATH = r"C:\Program Files\LibreOffice\program\soffice.exe"
POPPLER_PATH = r"C:\poppler-26.02.0\Library\bin"


@app.route("/check3")
def check3():
   

    return {
        "tesseract": subprocess.getoutput("tesseract --version"),
        "libreoffice": subprocess.getoutput("libreoffice --version"),
        "soffice": subprocess.getoutput("soffice --version")
    }

def cleanup_old_files(folder: str, minutes: int) -> None:
    now = datetime.now().timestamp()

    for file_name in os.listdir(folder):
        file_path = os.path.join(folder, file_name)
        if not os.path.isfile(file_path):
            continue

        age = now - os.path.getmtime(file_path)
        if age > minutes * 60:
            os.remove(file_path)


def image_to_text(input_path: str, output_dir: str, filename: str) -> str:
    image = Image.open(input_path)
    text = pytesseract.image_to_string(image)

    output_file = os.path.join(output_dir, f"{filename}.txt")
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(text)

    return output_file


def convert_image_to_pdf(input_path: str, output_path: str) -> None:
    image = Image.open(input_path)
    if image.mode != "RGB":
        image = image.convert("RGB")
    image.save(output_path, "PDF")


def convert_pdf_to_images(input_path: str, output_dir: str, filename: str, to_format: str) -> List[str]:
    images = convert_from_path(input_path, poppler_path=POPPLER_PATH)
    converted_files: List[str] = []
    ext = "jpg" if to_format in {"jpg", "jpeg"} else "png"
    save_format = "JPEG" if ext == "jpg" else "PNG"

    for i, image in enumerate(images, start=1):
        output_file = os.path.join(output_dir, f"{filename}_{i}.{ext}")
        image.save(output_file, save_format)
        converted_files.append(output_file)

    return converted_files


def convert_with_libreoffice(input_path: str, output_dir: str, to_format: str) -> List[str]:
    subprocess.run(
        [
            LIBREOFFICE_PATH,
            "--headless",
            "--convert-to",
            to_format,
            "--outdir",
            output_dir,
            input_path,
        ],
        check=True,
    )

    filename = os.path.splitext(os.path.basename(input_path))[0]
    converted_files: List[str] = []
    for f in os.listdir(output_dir):
        if f.startswith(filename) and f != os.path.basename(input_path):
            converted_files.append(os.path.join(output_dir, f))

    return converted_files


def convert_pdf_to_txt(input_path: str, output_dir: str, filename: str) -> str:
    output_file = os.path.join(output_dir, f"{filename}.txt")
    reader = PdfReader(input_path)
    text = "".join(page.extract_text() or "" for page in reader.pages)

    with open(output_file, "w", encoding="utf-8") as f:
        f.write(text)

    return output_file


def convert_pdf_to_docx(input_path: str, output_dir: str, filename: str) -> str:
    output_file = os.path.join(output_dir, f"{filename}.docx")
    cv = Converter(input_path)
    cv.convert(output_file)
    cv.close()
    return output_file


def parse_page_range(page_range: str, num_pages: int) -> List[int]:
    parts = page_range.replace(' ', '').split('-')
    if len(parts) == 1:
        start = end = int(parts[0])
    elif len(parts) == 2:
        start = int(parts[0])
        end = int(parts[1])
    else:
        raise ValueError("Page range must be single page or range like 1-5")

    if start < 1 or end < start or end > num_pages:
        raise ValueError(f"Page range must be between 1 and {num_pages}")

    return list(range(start, end + 1))


def split_pdf(input_path: str, output_dir: str, filename: str, page_range: str) -> str:
    reader = PdfReader(input_path)
    page_numbers = parse_page_range(page_range, len(reader.pages))
    writer = PdfWriter()

    for page_num in page_numbers:
        writer.add_page(reader.pages[page_num - 1])

    output_file = os.path.join(output_dir, f"{filename}_pages_{page_range}.pdf")
    with open(output_file, "wb") as f:
        writer.write(f)

    return output_file


def compress_pdf_file(input_path, output_dir, filename, quality="screen"):
    print("USING GHOSTSCRIPT")
    output_file = os.path.join(
        output_dir,
        f"{filename}_compressed.pdf"
    )

    subprocess.run([
        GHOSTSCRIPT_PATH,
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        f"-dPDFSETTINGS=/{quality}",
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        f"-sOutputFile={output_file}",
        input_path
    ], check=True)

    return output_file


def compress_image_file(input_path: str, output_dir: str, filename: str, quality: int = 70) -> str:
    image = Image.open(input_path)
    print("USING GHOSTSCRIPT")
    print("PATH:", GHOSTSCRIPT_PATH)
    output_ext = os.path.splitext(input_path)[1].lower()
    output_file = os.path.join(output_dir, f"{filename}_compressed{output_ext}")

    if output_ext in {".jpg", ".jpeg"}:
        image.save(output_file, "JPEG", quality=quality, optimize=True)
    elif output_ext == ".png":
        image.save(output_file, "PNG", optimize=True, compress_level=9)
    elif output_ext == ".webp":
        image.save(output_file, "WEBP", quality=quality, optimize=True)
    else:
        image.save(output_file)

    return output_file


@app.route("/convert", methods=["POST"])
def convert():
    try:
        cleanup_old_files(UPLOAD_FOLDER, 30)
        cleanup_old_files(OUTPUT_FOLDER, 30)

        files = request.files.getlist("file")
        to_format = request.form.get("to", "").strip().lower()

        if not files:
            return {"error": "No files uploaded"}, 400
        if not to_format:
            return {"error": "Target format is required"}, 400

        converted_files: List[str] = []
        pdf_input_paths: List[str] = []

        for file in files:
            filename = os.path.splitext(file.filename)[0]
            ext = os.path.splitext(file.filename)[1].lower()
            input_path = os.path.join(UPLOAD_FOLDER, file.filename)
            file.save(input_path)

            if to_format == "merge":
                if ext != ".pdf":
                    return {"error": "Merge supports PDF files only."}, 400
                pdf_input_paths.append(input_path)
                continue

            if ext in {".jpg", ".jpeg", ".png"} and to_format == "pdf":
                output_file = os.path.join(OUTPUT_FOLDER, f"{filename}.pdf")
                convert_image_to_pdf(input_path, output_file)
                converted_files.append(output_file)
                continue

            if ext == ".pdf" and to_format in {"jpg", "jpeg", "png"}:
                converted_files.extend(convert_pdf_to_images(input_path, OUTPUT_FOLDER, filename, to_format))
                continue

            if ext == ".pdf" and to_format == "txt":
                output_file = convert_pdf_to_txt(input_path, OUTPUT_FOLDER, filename)
                converted_files.append(output_file)
                continue

            if ext == ".pdf" and to_format == "docx":
                output_file = convert_pdf_to_docx(input_path, OUTPUT_FOLDER, filename)
                converted_files.append(output_file)
                continue

            supported_libreoffice_formats = {"docx", "pptx", "xlsx", "odt", "ods", "odp", "pdf", "txt"}
            supported_libreoffice_sources = {".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx", ".odt", ".ods", ".odp", ".pdf"}

            if to_format not in supported_libreoffice_formats:
                return {"error": f"Unsupported conversion target '{to_format}'."}, 400
            if ext not in supported_libreoffice_sources:
                return {"error": f"Unsupported source file type '{ext}' for this conversion."}, 400

            converted_files.extend(convert_with_libreoffice(input_path, OUTPUT_FOLDER, to_format))

        if to_format == "merge":
            if not pdf_input_paths:
                return {"error": "No PDF files provided for merge."}, 400
            output_file = os.path.join(OUTPUT_FOLDER, f"merged_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf")
            merger = PdfMerger()
            for path in pdf_input_paths:
                merger.append(path)
            merger.write(output_file)
            merger.close()
            converted_files.append(output_file)

        if not converted_files:
            return {"error": "No files converted"}, 500

        if len(converted_files) == 1:
            return send_file(converted_files[0], as_attachment=True)

        zip_name = f"ConvertX_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        zip_path = os.path.join(OUTPUT_FOLDER, zip_name)
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for file_path in converted_files:
                zipf.write(file_path, os.path.basename(file_path))

        return send_file(zip_path, as_attachment=True, download_name=zip_name)
    
    
    except Exception as e:
        traceback.print_exc()
        return {"error": str(e)}, 500


@app.route("/split", methods=["POST"])
def split():
    try:
        file = request.files.get("file")
        page_range = request.form.get("pages", "").strip()

        if not file:
            return {"error": "No file uploaded"}, 400
        if not page_range:
            return {"error": "Page range is required"}, 400

        input_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(input_path)

        filename = os.path.splitext(file.filename)[0]
        output_file = split_pdf(input_path, OUTPUT_FOLDER, filename, page_range)

        return send_file(output_file, as_attachment=True)
    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}, 500

@app.route("/compress_pdf", methods=["POST"])
def compress_pdf():
    try:
        print("COMPRESS PDF ROUTE HIT")

        file = request.files.get("file")

        if not file:
            return {"error": "No file uploaded"}, 400

        quality_map = {
            "85": "prepress",
            "70": "ebook",
            "55": "screen"
        }

        quality = quality_map.get(
            request.form.get("quality", "70"),
            "ebook"
        )

        input_path = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )

        file.save(input_path)

        filename = os.path.splitext(
            file.filename
        )[0]

        output_file = compress_pdf_file(
            input_path,
            OUTPUT_FOLDER,
            filename,
            quality
        )

        return send_file(
            output_file,
            as_attachment=True
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e)}, 500


@app.route("/compress_image", methods=["POST"])
def compress_image():
    try:
        file = request.files.get("file")
        quality = int(request.form.get("quality", 70))

        if not file:
            return {"error": "No file uploaded"}, 400

        input_path = os.path.join(UPLOAD_FOLDER, file.filename)
        file.save(input_path)

        filename = os.path.splitext(file.filename)[0]
        output_file = compress_image_file(input_path, OUTPUT_FOLDER, filename, quality)

        return send_file(output_file, as_attachment=True)
    except Exception as e:
        print("ERROR:", str(e))
        return {"error": str(e)}, 500


@app.route("/ocr", methods=["POST"])
def ocr():

    try:

        file = request.files.get("file")

        if not file:
            return {"error": "No file uploaded"}, 400

        input_path = os.path.join(
            UPLOAD_FOLDER,
            file.filename
        )

        file.save(input_path)

        image = Image.open(input_path)

        text = pytesseract.image_to_string(image)

        return {
            "text": text
        }

    except Exception as e:

        return {
            "error": str(e)
        }, 500
@app.route("/")
def home():
    return {
        "status": "online",
        "message": "ConvertX API is running"
    }

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )
