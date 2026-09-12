"""Paths independent of the shell working directory."""
import os
from pathlib import Path
ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = Path(os.getenv("THREATFORECAST_MODEL_DIR", str(ROOT / "ml/models")))
DATABASE = Path(os.getenv("THREATFORECAST_DATABASE", str(ROOT / "data/runtime/analyses.db")))
FRONTEND = ROOT / "frontend/dist"
