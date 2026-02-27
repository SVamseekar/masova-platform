FROM python:3.11-slim

WORKDIR /app
RUN pip install --no-cache-dir pika requests

COPY cleverbot_bot.py .

CMD ["python", "cleverbot_bot.py"]
