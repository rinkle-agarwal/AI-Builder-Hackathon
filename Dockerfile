# ==============================================================================
# TrustLens AI - Production Dockerfile for Google Cloud Run
# Python 3.11 + Playwright Chromium + FastAPI Agent Orchestrator + React Vite SPA
# ==============================================================================

FROM mcr.microsoft.com/playwright/python:v1.49.0-jammy

ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    HEADLESS=true \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Ensure Playwright browser dependencies are present
RUN playwright install chromium

# Copy prebuilt frontend React SPA
COPY dist ./dist

# Copy application backend code & assets
COPY public ./public
COPY db ./db
COPY navigator_agent ./navigator_agent
COPY report_generator.py .
COPY server.py .

# Prepare directories for evidence and screenshots
RUN mkdir -p /app/runs /app/public/runs && chmod -R 777 /app/runs /app/public/runs

EXPOSE 8080

CMD ["python", "server.py"]
