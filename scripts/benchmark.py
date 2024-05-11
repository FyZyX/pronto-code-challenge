import os

import zmq
import time

SERVER_URL = os.environ.get("SERVER_URL")


def measure_throughput(subscriber):
    message_count = 0
    start_time = time.time()

    failed = 0
    succeeded = 0
    while True:
        # message = subscriber.recv_string()
        # message_count += 1
        try:
            # Attempt to receive a message with a timeout
            message = subscriber.recv_string(flags=zmq.NOBLOCK)
            message_count += 1
            succeeded += 1
        except zmq.Again:
            # No message was received within the timeout period
            # print("No new messages received. Possible buffering or network delay.")
            # print(succeeded, failed)
            failed += 1
            continue

        print(succeeded, failed, succeeded / (succeeded + failed))
        elapsed_time = time.time() - start_time

        # Print throughput every second
        if elapsed_time >= 1:
            throughput = message_count / elapsed_time
            print(f"Throughput: {throughput:.2f} messages/sec")

            # Reset counter and timer
            message_count = 0
            start_time = time.time()


def main():
    context = zmq.Context()
    subscriber = context.socket(zmq.SUB)

    subscriber.connect(SERVER_URL)
    subscriber.setsockopt_string(zmq.SUBSCRIBE, "")
    subscriber.setsockopt(zmq.RCVHWM, 400)

    try:
        measure_throughput(subscriber)
    except KeyboardInterrupt:
        print("Program interrupted by user.")
    finally:
        # Clean up
        subscriber.close()
        context.term()


if __name__ == "__main__":
    main()
