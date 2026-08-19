using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace TWXProxy.Core
{
    public static class LegacyScriptEncryption
    {
        private static readonly byte[] EncryptionKey = { 195, 23, 85, 11, 77 };

        public const int Shift = 14;
        public const byte ShiftKey = 78;
        public const int ChunkSize = 25;
        public const byte ChunkSeed = 210;

        public static bool IsEncryptedIncludePath(string filename)
        {
            return string.Equals(Path.GetExtension(filename), ".inc", StringComparison.OrdinalIgnoreCase);
        }

        public static string DecryptToString(byte[] encryptedBytes)
        {
            return Encoding.Latin1.GetString(Decrypt(encryptedBytes));
        }

        public static bool TryDecryptToString(byte[] encryptedBytes, out string text)
        {
            try
            {
                text = DecryptToString(encryptedBytes);
                return true;
            }
            catch
            {
                text = string.Empty;
                return false;
            }
        }

        public static byte[] EncryptFromString(string plainText)
        {
            return Encrypt(Encoding.Latin1.GetBytes(plainText));
        }

        public static string PreprocessSourceForEncryptedInclude(string sourceText)
        {
            var outputLines = new List<string>();
            using var reader = new StringReader(sourceText);

            string? line;
            while ((line = reader.ReadLine()) != null)
            {
                if (line.Length > 0)
                {
                    int trimIndex = 0;
                    // Mirror Pascal's "while (J < Length(Line)) and (Line[J] = ' ')" logic.
                    while (trimIndex < line.Length - 1 && line[trimIndex] == ' ')
                        trimIndex++;

                    if (trimIndex < line.Length - 1)
                        line = line.Substring(trimIndex);
                }

                bool remove = false;
                if (line.Length >= 1)
                {
                    if (line[0] == '#')
                        remove = true;
                }
                else
                {
                    remove = true;
                }

                if (!remove)
                    outputLines.Add(line);
            }

            if (outputLines.Count == 0)
                return string.Empty;

            return string.Join("\r\n", outputLines) + "\r\n";
        }

        public static void WriteEncryptedIncludeFile(string inputFile, string outputFile)
        {
            string plainText = File.ReadAllText(inputFile, Encoding.Latin1);
            string preprocessed = PreprocessSourceForEncryptedInclude(plainText);
            byte[] encrypted = EncryptFromString(preprocessed);
            File.WriteAllBytes(outputFile, encrypted);
        }

        public static bool LooksLikePlainText(byte[] bytes)
        {
            if (bytes.Length == 0)
                return true;

            int printable = 0;
            foreach (byte b in bytes)
            {
                if ((b >= 32 && b < 127) || b == 9 || b == 10 || b == 13)
                    printable++;
            }

            return printable >= (bytes.Length * 85) / 100;
        }

        public static bool LooksLikeScriptText(string text)
        {
            if (string.IsNullOrEmpty(text))
                return false;

            int printable = 0;
            foreach (char c in text)
            {
                if ((c >= 32 && c < 127) || c == '\t' || c == '\r' || c == '\n')
                    printable++;
            }

            if (printable < (text.Length * 85) / 100)
                return false;

            string upper = text.ToUpperInvariant();
            return upper.Contains("SETVAR ")
                || upper.Contains("GOSUB ")
                || upper.Contains("INCLUDE ")
                || upper.Contains("GETWORD ")
                || upper.Contains("WAITFOR ")
                || upper.Contains("\r\n:");
        }

        private static byte[] Encrypt(byte[] plainBytes)
        {
            var encoded = new byte[plainBytes.Length + 1];
            byte last = 0x18;
            byte checksum = 0xF0;

            for (int index = 0; index < plainBytes.Length; index++)
            {
                byte original = plainBytes[index];
                checksum ^= original;

                byte encrypted = original;
                foreach (byte keyByte in EncryptionKey)
                    encrypted ^= keyByte;

                int oneBased = index + 1;
                if (oneBased % Shift == 0)
                    encrypted ^= ShiftKey;

                encrypted ^= last;
                last = original;
                encoded[index] = encrypted;
            }

            encoded[^1] = checksum;

            var result = new List<byte>(encoded.Length + (encoded.Length / ChunkSize + 1) * 4);
            uint randSeed = 0;
            int chunkCount = encoded.Length / ChunkSize;
            if (chunkCount * ChunkSize < encoded.Length)
                chunkCount++;

            for (int chunkIndex = 1; chunkIndex <= chunkCount; chunkIndex++)
            {
                int chunkStart = (chunkIndex - 1) * ChunkSize;
                int chunkLength = Math.Min(ChunkSize, encoded.Length - chunkStart);
                var chunk = new List<byte>(chunkLength + sizeof(int));
                byte chunkKey = encoded[chunkStart];

                int indexValue = chunkIndex;
                byte[] indexBytes = BitConverter.GetBytes(indexValue);
                byte[] encryptedIndexBytes = new byte[sizeof(int)];
                for (int j = 1; j <= sizeof(int); j++)
                {
                    encryptedIndexBytes[sizeof(int) - j] = (byte)(indexBytes[j - 1] ^ ChunkSeed ^ chunkKey ^ j);
                }

                chunk.AddRange(encryptedIndexBytes);
                for (int i = 0; i < chunkLength; i++)
                    chunk.Add(encoded[chunkStart + i]);

                bool append = chunkLength < ChunkSize || NextBoolean(ref randSeed);
                if (append)
                {
                    result.AddRange(chunk);
                }
                else
                {
                    result.InsertRange(0, chunk);
                }
            }

            return result.ToArray();
        }

        private static byte[] Decrypt(byte[] encryptedBytes)
        {
            if (encryptedBytes.Length == 0)
                throw new InvalidDataException("Decryption failure");

            int offset = 0;
            int expectedChunkIndex = 1;
            var unscrambled = new List<byte>(encryptedBytes.Length);

            while (offset < encryptedBytes.Length - 1)
            {
                int chunkLength = Math.Min(ChunkSize + sizeof(int), encryptedBytes.Length - offset);
                if (chunkLength < sizeof(int) + 1)
                    throw new InvalidDataException("Decryption failure");

                byte[] chunk = new byte[chunkLength];
                Buffer.BlockCopy(encryptedBytes, offset, chunk, 0, chunkLength);

                byte chunkKey = chunk[sizeof(int)];
                byte[] indexBytes = new byte[sizeof(int)];
                for (int j = 1; j <= sizeof(int); j++)
                {
                    byte decoded = (byte)(chunk[j - 1] ^ (5 - j) ^ chunkKey ^ ChunkSeed);
                    indexBytes[sizeof(int) - j] = decoded;
                }

                int actualChunkIndex = BitConverter.ToInt32(indexBytes, 0);
                if (actualChunkIndex == expectedChunkIndex)
                {
                    for (int i = sizeof(int); i < chunk.Length; i++)
                        unscrambled.Add(chunk[i]);

                    offset = 0;
                    expectedChunkIndex++;
                }
                else
                {
                    offset += chunkLength;
                }
            }

            if (unscrambled.Count == 0)
                throw new InvalidDataException("Decryption failure");

            byte last = 0x18;
            byte checksum = 0xF0;
            var plain = new byte[unscrambled.Count - 1];

            for (int index = 0; index < plain.Length; index++)
            {
                byte value = (byte)(unscrambled[index] ^ last);
                int oneBased = index + 1;
                if (oneBased % Shift == 0)
                    value ^= ShiftKey;

                for (int keyIndex = EncryptionKey.Length - 1; keyIndex >= 0; keyIndex--)
                    value ^= EncryptionKey[keyIndex];

                plain[index] = value;
                checksum ^= value;
                last = value;
            }

            if (checksum != unscrambled[^1])
                throw new InvalidDataException("Decryption failure");

            return plain;
        }

        private static bool NextBoolean(ref uint randSeed)
        {
            randSeed = unchecked(randSeed * 134775813u + 1u);
            return (randSeed >> 31) == 0;
        }
    }
}
