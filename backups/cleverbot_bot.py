"""
docker/cleverbot_bot.py
RabbitMQ Cleverbot bot — uses topic exchange pattern.
Listens on 'chat.user.*' routing key, replies on 'chat.bot.reply'.

Run via docker-compose -f docker/docker-compose.yml up --build
Or locally: RABBITMQ_HOST=localhost python cleverbot_bot.py
"""

import pika
import os
import time
import logging

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

RABBITMQ_HOST = os.environ.get('RABBITMQ_HOST', 'localhost')
RABBITMQ_USER = os.environ.get('RABBITMQ_USER', 'admin')
RABBITMQ_PASS = os.environ.get('RABBITMQ_PASS', 'admin')

EXCHANGE = 'chat_exchange'
USER_ROUTING_KEY = 'chat.user.#'
BOT_ROUTING_KEY = 'chat.bot.reply'


def get_cleverbot_reply(message: str) -> str:
    """
    Echo-based stub — demonstrates message flow.
    To use real Cleverbot API: POST to https://www.cleverbot.com/getreply?key=YOUR_KEY&input=...
    """
    return f"[Bot] You said: {message}"


def on_message(channel, method, properties, body):
    message = body.decode('utf-8')
    logger.info(f"Received [{method.routing_key}]: {message}")

    reply = get_cleverbot_reply(message)
    logger.info(f"Replying: {reply}")

    channel.basic_publish(
        exchange=EXCHANGE,
        routing_key=BOT_ROUTING_KEY,
        body=reply.encode('utf-8'),
    )
    channel.basic_ack(delivery_tag=method.delivery_tag)


def connect_with_retry(max_retries: int = 10, delay: int = 3) -> pika.BlockingConnection:
    credentials = pika.PlainCredentials(RABBITMQ_USER, RABBITMQ_PASS)
    params = pika.ConnectionParameters(
        host=RABBITMQ_HOST,
        credentials=credentials,
        heartbeat=60,
        blocked_connection_timeout=300,
    )
    for attempt in range(1, max_retries + 1):
        try:
            conn = pika.BlockingConnection(params)
            logger.info(f"Connected to RabbitMQ at {RABBITMQ_HOST} (attempt {attempt})")
            return conn
        except Exception as e:
            logger.warning(f"Connection attempt {attempt}/{max_retries} failed: {e}")
            if attempt < max_retries:
                time.sleep(delay)
    raise RuntimeError("Could not connect to RabbitMQ after retries")


def main():
    conn = connect_with_retry()
    channel = conn.channel()

    # Declare durable topic exchange
    channel.exchange_declare(exchange=EXCHANGE, exchange_type='topic', durable=True)

    # Exclusive queue — auto-deleted when bot disconnects
    result = channel.queue_declare(queue='', exclusive=True)
    queue_name = result.method.queue
    channel.queue_bind(exchange=EXCHANGE, queue=queue_name, routing_key=USER_ROUTING_KEY)

    logger.info(f"Waiting for messages on exchange='{EXCHANGE}' routing_key='{USER_ROUTING_KEY}'...")
    channel.basic_consume(queue=queue_name, on_message_callback=on_message)
    channel.start_consuming()


if __name__ == '__main__':
    main()
