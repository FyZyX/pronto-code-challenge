FROM tiangolo/uvicorn-gunicorn-fastapi:python3.11

WORKDIR /usr/src/app
ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

# Install system dependencies required for a local install of psycopg
# This includes gcc for the C compiler, python3-dev for Python headers,
# and libpq-dev for PostgreSQL client development headers and pg_config
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    python3-dev \
    libpq-dev

COPY ./api/requirements.txt requirements.txt

RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY ./api/main.py main.py

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080"]
