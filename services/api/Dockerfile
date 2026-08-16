FROM python:3.12-slim

WORKDIR /srv
COPY services/api/requirements.txt ./requirements.txt
COPY packages/pricing ./packages/pricing
RUN pip install --no-cache-dir -r requirements.txt ./packages/pricing

COPY services/api/app ./app
COPY services/api/scripts ./scripts
COPY seeds ./seeds
ENV SEEDS_DIR=/srv/seeds

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
