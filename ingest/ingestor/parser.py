from .model import Message


class MessageParser:
    _expected_num_parts = 6

    def __init__(self, message: str):
        self._message = message

    def _get_parts(self) -> list[str]:
        parts = self._message.split(';')

        if len(parts) != self._expected_num_parts:
            raise ValueError(
                f"incorrect number of parts: {len(parts)}"
                f" (expected {self._expected_num_parts})"
            )

        return parts

    def parse(self) -> Message:
        parts = self._get_parts()
        message = Message(
            name=parts[0],
            latitude=float(parts[1]),
            longitude=float(parts[2]),
            heading=float(parts[3]),
            measurement=float(parts[4]),
            verification_id=parts[5],
        )

        return message
