import os
import socket
import time


IAC = 255
DONT = 254
DO = 253
WONT = 252
WILL = 251
SB = 250
SE = 240


class MtcConnection:
    def __init__(self, host=None, port=None, timeout=1.0):
        self.host = host or os.environ.get("MTC_HOST", "127.0.0.1")
        self.port = int(port or os.environ["MTC_PORT"])
        self.socket = socket.create_connection((self.host, self.port), timeout=timeout)
        self.socket.settimeout(timeout)

    def close(self):
        try:
            self.socket.close()
        except OSError:
            pass

    def send(self, text):
        if isinstance(text, str):
            data = text.encode("latin-1", errors="replace")
        else:
            data = bytes(text)
        self.socket.sendall(data)

    def send_line(self, text):
        self.send(str(text) + "\r")

    def read_some(self, timeout=1.0):
        self.socket.settimeout(timeout)
        try:
            data = self.socket.recv(8192)
        except TimeoutError:
            return ""
        except socket.timeout:
            return ""

        if not data:
            return ""
        clean = self._process_telnet(data)
        return clean.decode("latin-1", errors="replace")

    def read_until(self, marker, timeout=10.0):
        marker = str(marker)
        end = time.monotonic() + timeout
        chunks = []
        while time.monotonic() < end:
            chunk = self.read_some(timeout=max(0.1, min(1.0, end - time.monotonic())))
            if chunk:
                chunks.append(chunk)
                text = "".join(chunks)
                if marker in text:
                    return text
        return "".join(chunks)

    def _process_telnet(self, data):
        clean = bytearray()
        i = 0
        while i < len(data):
            value = data[i]
            if value != IAC:
                clean.append(value)
                i += 1
                continue

            if i + 1 >= len(data):
                break

            command = data[i + 1]
            if command == IAC:
                clean.append(IAC)
                i += 2
            elif command in (DO, DONT, WILL, WONT) and i + 2 < len(data):
                option = data[i + 2]
                response = bytes([IAC, WONT if command in (DO, DONT) else DONT, option])
                try:
                    self.socket.sendall(response)
                except OSError:
                    pass
                i += 3
            elif command == SB:
                i += 2
                while i + 1 < len(data):
                    if data[i] == IAC and data[i + 1] == SE:
                        i += 2
                        break
                    i += 1
            else:
                i += 2
        return bytes(clean)


def connect(host=None, port=None, timeout=1.0):
    return MtcConnection(host=host, port=port, timeout=timeout)
