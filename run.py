"""Start the built dashboard and API: python run.py."""
import os
from pathlib import Path
import uvicorn

if __name__ == '__main__':
    os.chdir(Path(__file__).resolve().parent)
    uvicorn.run('backend.app:app', host=os.getenv('HOST', '127.0.0.1'), port=int(os.getenv('PORT', '8000')))
