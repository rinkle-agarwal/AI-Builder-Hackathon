import os
import zipfile

def create_zip():
    zip_filename = "trustlens-cloud.zip"
    excluded_dirs = {"node_modules", ".git", "__pycache__", "runs"}
    excluded_files = {".env", "trustlens-cloud.zip", "bun.lock", "create_deploy_zip.py"}
    
    with zipfile.ZipFile(zip_filename, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for root, dirs, files in os.walk('.'):
            # Prune excluded directories
            dirs[:] = [d for d in dirs if d not in excluded_dirs and not d.startswith('.')]
            
            for file in files:
                if file in excluded_files or file.endswith('.pyc'):
                    continue
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, '.')
                print(f"Adding: {arcname}")
                zipf.write(file_path, arcname)

    print(f"\nSuccessfully created {zip_filename} ({os.path.getsize(zip_filename) / (1024*1024):.2f} MB)")

if __name__ == "__main__":
    create_zip()
