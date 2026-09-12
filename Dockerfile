FROM node:24-bookworm-slim AS frontend
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM python:3.14-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
RUN useradd --create-home appuser && mkdir -p /app/data/runtime && chown -R appuser:appuser /app
COPY --chown=appuser:appuser backend/ backend/
COPY --chown=appuser:appuser ml/ ml/
COPY --from=frontend --chown=appuser:appuser /build/dist frontend/dist
USER appuser
EXPOSE 8000
HEALTHCHECK --interval=30s --start-period=60s --timeout=5s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/api/ready', timeout=4)"
CMD ["python", "-m", "uvicorn", "backend.app:app", "--host", "0.0.0.0", "--port", "8000"]
