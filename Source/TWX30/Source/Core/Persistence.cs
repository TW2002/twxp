/*
Copyright (C) 2005  Remco Mulder

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA

For source notes please refer to Notes.txt
For license terms please refer to GPL.txt.

These files should be stored in the root of the compression you 
received this source in.
*/

using System;
using System.Collections.Generic;
using System.IO;
using System.Text;

namespace TWXProxy.Core
{
    public class PersistenceManager : IPersistenceController, IDisposable
    {
        private List<TWXModule> _moduleList;
        private string _outputFile = string.Empty;

        public PersistenceManager()
        {
            _moduleList = new List<TWXModule>();
        }

        public string OutputFile
        {
            get { return _outputFile; }
            set { _outputFile = value; }
        }

        public void RegisterModule(TWXModule module)
        {
            if (!_moduleList.Contains(module))
            {
                _moduleList.Add(module);
            }
        }

        public void UnregisterModule(TWXModule module)
        {
            _moduleList.Remove(module);
        }

        public void SaveStateValues()
        {
            // Stream the state of each module to file
            using (var outputValues = new MemoryStream())
            {
                try
                {
                    for (int i = 0; i < _moduleList.Count; i++)
                    {
                        var module = _moduleList[i];
                        System.Diagnostics.Debug.WriteLine($"Saving Module #{i}");

                        // MB - Skipping mtMenu (index 3) because it is throwing exceptions
                        if (i != 3)
                        {
                            using (var moduleValues = new MemoryStream())
                            {
                                module.GetStateValues(moduleValues);
                                System.Diagnostics.Debug.WriteLine($"Module size: {moduleValues.Length}");

                                if (moduleValues.Length > 0)
                                {
                                    moduleValues.Seek(0, SeekOrigin.Begin);
                                    string classTag = module.GetType().Name;
                                    int dataSize = classTag.Length;

                                    // Write class tag length and class tag
                                    byte[] dataSizeBytes = BitConverter.GetBytes(dataSize);
                                    outputValues.Write(dataSizeBytes, 0, 4);
                                    byte[] classTagBytes = Encoding.UTF8.GetBytes(classTag);
                                    outputValues.Write(classTagBytes, 0, classTagBytes.Length);

                                    // Copy module values
                                    moduleValues.CopyTo(outputValues);
                                }
                            }
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Exception occurred saving module states: {ex.Message}");
                    return;
                }

                // Calculate checksum
                int checksum = CalcChecksum(outputValues);

                // Write to file
                using (var outFile = new FileStream(OutputFile, FileMode.Create, FileAccess.Write))
                {
                    // Write size and checksum
                    int dataSize = (int)outputValues.Length + 8;
                    outFile.Write(BitConverter.GetBytes(dataSize), 0, 4);
                    outFile.Write(BitConverter.GetBytes(checksum), 0, 4);

                    // Write stream to file
                    outputValues.Seek(0, SeekOrigin.Begin);
                    outputValues.CopyTo(outFile);
                }
            }
        }

        public bool LoadStateValues()
        {
            // Load the state of each module from file
            bool result = false;

            if (!File.Exists(OutputFile))
            {
                ReportStateLoaded();
                return false;
            }

            try
            {
                using (var inputFile = new FileStream(OutputFile, FileMode.Open, FileAccess.Read))
                {
                    long size = inputFile.Length;

                    if (size > 8)
                    {
                        // Read recorded size
                        byte[] recordedSizeBytes = new byte[4];
                        inputFile.ReadExactly(recordedSizeBytes, 0, 4);
                        int recordedSize = BitConverter.ToInt32(recordedSizeBytes, 0);

                        if (recordedSize == size)
                        {
                            // Read checksum
                            byte[] checksumBytes = new byte[4];
                            inputFile.ReadExactly(checksumBytes, 0, 4);
                            int checksum = BitConverter.ToInt32(checksumBytes, 0);

                            // Read the rest
                            using (var inStream = new MemoryStream())
                            {
                                inputFile.CopyTo(inStream);

                                if (CalcChecksum(inStream) == checksum)
                                {
                                    // Input OK - extract values from it
                                    ProcessStateValues(inStream);
                                }
                            }
                        }

                        result = true;
                    }
                }
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Error loading state values: {ex.Message}");
            }

            ReportStateLoaded();
            return result;
        }

        private int CalcChecksum(MemoryStream stream)
        {
            stream.Seek(0, SeekOrigin.Begin);
            int result = 0;

            byte[] buffer = new byte[4];
            while (stream.Position < stream.Length)
            {
                int bytesRead = stream.Read(buffer, 0, 4);
                if (bytesRead == 4)
                {
                    int value = BitConverter.ToInt32(buffer, 0);
                    result ^= value;
                }
            }

            return result;
        }

        private void ApplyStateValues(string classTag, Stream stateStream)
        {
            // Find all modules with a matching classname and apply their state to them
            long pos = stateStream.Position;

            foreach (var module in _moduleList)
            {
                if (module.GetType().Name == classTag)
                {
                    if (stateStream.Position != pos)
                    {
                        stateStream.Seek(pos, SeekOrigin.Begin); // return to where we started
                    }

                    // MB - Don't load the TCP saved state (index 4)
                    // if (i != 4)
                    module.SetStateValues(stateStream);
                }
            }
        }

        private void ProcessStateValues(Stream stateStream)
        {
            stateStream.Seek(0, SeekOrigin.Begin);

            while (stateStream.Position < stateStream.Length)
            {
                string classTag = ReadStringFromStream(stateStream);
                ApplyStateValues(classTag, stateStream);
            }
        }

        private void ReportStateLoaded()
        {
            // Iterate through modules and report that their state has been loaded
            foreach (var module in _moduleList)
            {
                module.StateValuesLoaded();
            }
        }

        private string ReadStringFromStream(Stream stream)
        {
            byte[] lenBytes = new byte[4];
            stream.ReadExactly(lenBytes, 0, 4);
            int len = BitConverter.ToInt32(lenBytes, 0);

            byte[] buffer = new byte[len];
            stream.ReadExactly(buffer, 0, len);

            return Encoding.UTF8.GetString(buffer);
        }

        public void Dispose()
        {
            _moduleList?.Clear();
        }
    }
}
