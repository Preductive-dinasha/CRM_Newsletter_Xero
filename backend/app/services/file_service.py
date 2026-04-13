import os
import uuid
from typing import Optional
from werkzeug.datastructures import FileStorage
from werkzeug.utils import secure_filename
from flask import current_app


class FileError(Exception):
    pass


class FileService:
    def __init__(self) -> None:
        pass

    def allowed_file(self, filename: str) -> bool:
        allowed = current_app.config.get("ALLOWED_EXTENSIONS", set())
        return "." in filename and filename.rsplit(".", 1)[1].lower() in allowed

    def save_file(self, file: FileStorage) -> str:
        if not file or not file.filename:
            raise FileError("No file provided.")
        if not self.allowed_file(file.filename):
            raise FileError("File type not allowed.")

        upload_folder = current_app.config.get("UPLOAD_FOLDER", "uploads")
        os.makedirs(upload_folder, exist_ok=True)

        filename = secure_filename(file.filename)
        unique_name = f"{uuid.uuid4().hex}_{filename}"
        filepath = os.path.join(upload_folder, unique_name)
        file.save(filepath)

        return f"/api/uploads/{unique_name}"
