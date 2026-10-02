from __future__ import annotations

import importlib.util
import struct
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def planet_record(number, version):
    # BinaryWriter layout, including the three version-19 colonist counts.
    data = struct.pack('<i', number) + b'\x04Test'
    data += struct.pack('<ii', 100, number) + b'\x04Corp'
    data += struct.pack('<i??iiii', 6, True, True, 10, 20, 30, 40)
    if version >= 18:
        data += b'\x00\x00' + struct.pack('<i', -1)
    if version >= 19:
        data += struct.pack('<iii', -1, 12000, 250000)
    return data


class PackagedReaderTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        output = Path(self.temporary.name)
        builder = load_module('portable_builder', ROOT / 'scripts/build_portable.py')
        builder.copy_app(ROOT, output)
        self.reader = load_module(
            'packaged_query_reader', output / 'app/twxdb_assistant/twxdb_query.py'
        )

    def test_consecutive_planets_stay_aligned(self):
        for version in (17, 18, 19):
            with self.subTest(version=version):
                data = planet_record(1, version) + planet_record(2, version)
                reader = self.reader.XdbReader(data)
                planets = [self.reader.read_planet(reader, version) for _ in range(2)]
                self.assertEqual([p['id'] for p in planets], [1, 2])
                self.assertEqual([p['name'] for p in planets], ['Test', 'Test'])
                for planet in planets:
                    self.assertEqual(planet['fuel_colonists'], -1)
                    self.assertEqual(planet['org_colonists'], 12000 if version >= 19 else -1)
                    self.assertEqual(planet['equ_colonists'], 250000 if version >= 19 else -1)
                self.assertEqual(reader.pos, len(data))

    def test_future_version_requests_package_update(self):
        path = Path(self.temporary.name) / 'future.xdb'
        path.write_bytes(b'')
        with patch.object(self.reader, 'read_header', return_value={'version': 20}):
            with self.assertRaisesRegex(ValueError, 'Update the TWXDB Assistant package'):
                self.reader.load_xdb(path)


if __name__ == '__main__':
    unittest.main()
