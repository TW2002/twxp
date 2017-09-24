using System;
using System.ComponentModel;
using System.Collections;
using System.IO;
using Core;
 // 
 // Copyright (C) 2005  Remco Mulder
 // 
 // This program is free software; you can redistribute it and/or modify
 // it under the terms of the GNU General Public License as published by
 // the Free Software Foundation; either version 2 of the License, or
 // (at your option) any later version.
 // 
 // This program is distributed in the hope that it will be useful,
 // but WITHOUT ANY WARRANTY; without even the implied warranty of
 // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 // GNU General Public License for more details.
 // 
 // You should have received a copy of the GNU General Public License
 // along with this program; if not, write to the Free Software
 // Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 // 
 // For source notes please refer to Notes.txt
 // For license terms please refer to GPL.txt.
 // 
 // These files should be stored in the root of the compression you
 // received this source in.
namespace Persistence
{
    public class TPersistenceManager: Component, IPersistenceController
    {
        public string OutputFile
        {
          get {
            return FOutputFile;
          }
          set {
            FOutputFile = value;
          }
        }
        private ArrayList FModuleList = null;
        private string FOutputFile = String.Empty;
        //Constructor  Create( AOwner)
        public TPersistenceManager(object AOwner) : base(AOwner)
        {
            FModuleList = new ArrayList(false);
        }
        //@ Destructor  Destroy()
        ~TPersistenceManager()
        {
            //@ Unsupported property or method(C): 'Free'
            FModuleList.Free;
            base.Destroy();
        }
        // IPersistenceController
        protected void RegisterModule(object Module)
        {
            FModuleList.Add(Module);
        }

        protected void UnregisterModule(object Module)
        {
            FModuleList.Remove(Module);
        }

        public void SaveStateValues()
        {
            System.IO.File OutFile;
            int I;
            MemoryStream ModuleValues;
            MemoryStream OutputValues;
            TTWXModule Module;
            string ClassTag;
            int Checksum;
            int DataSize;
            // Stream the state of each module to file
            OutputValues = new MemoryStream();
            ModuleValues = new MemoryStream();
            try {
                for (I = 0; I < FModuleList.Count; I ++ )
                {
                    Module = ((TTWXModule)FModuleList[I]);
                    Module.GetStateValues(ModuleValues);
                    if ((ModuleValues.Length > 0))
                    {
                        //@ Undeclared identifier(3): 'soFromBeginning'
                        ModuleValues.Seek(0, soFromBeginning);
                        ClassTag = Module.GetType().FullName;
                        DataSize = ClassTag.Length;
                        OutputValues.WriteByte(DataSize, 4);
                        OutputValues.WriteByte((ClassTag as string), DataSize);
                        //@ Unsupported property or method(A): 'CopyFrom'
                        OutputValues.CopyFrom(ModuleValues, ModuleValues.Length);
                        //@ Unsupported property or method(D): 'Clear'
                        ModuleValues.Clear;
                    }
                }
                // calculate checksum
                Checksum = CalcChecksum(OutputValues);
                OutFile = new FileInfo(OutputFile);
                StreamWriter _W_2 = OutFile.CreateText();
                try {
                    // write size and checksum to file
                    DataSize = OutputValues.Length + 8;
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(OutFile, DataSize, 4);
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(OutFile, Checksum, 4);
                    // write stream to file
                    //@ Undeclared identifier(3): 'soFromBeginning'
                    OutputValues.Seek(0, soFromBeginning);
                    //@ Unsupported function or procedure: 'BlockWrite'
                    BlockWrite(OutFile, OutputValues.GetBuffer(), OutputValues.Length);
                } finally {
                    _W_2.Close();
                }
            } finally {
                //@ Unsupported property or method(C): 'Free'
                OutputValues.Free;
                //@ Unsupported property or method(D): 'Free'
                ModuleValues.Free;
            }
        }

        private int CalcChecksum(MemoryStream Stream)
        {
            int result;
            int I;
            //@ Undeclared identifier(3): 'soFromBeginning'
            Stream.Seek(0, soFromBeginning);
            result = 0;
            while ((Stream.Position < Stream.Length))
            {
                I = 0;
                Stream.ReadByte(I, 4);
                result = result ^ I;
            }
            return result;
        }

        private void ApplyStateValues(string ClassTag, Stream StateStream)
        {
            int I;
            int Pos;
            // find all modules with a matching classname and apply their state to them
            Pos = StateStream.Position;
            for (I = 0; I < FModuleList.Count; I ++ )
            {
                //@ Unsupported property or method(C): 'Classname'
                if ((FModuleList[I].Classname == ClassTag))
                {
                    if ((StateStream.Position != Pos))
                    {
                        //@ Undeclared identifier(3): 'soFromBeginning'
                        StateStream.Seek(Pos, soFromBeginning);
                    }
                    // return to where we started
                    ((TTWXModule)(FModuleList[I])).SetStateValues(StateStream);
                }
            }
        }

        private void ProcessStateValues(Stream StateStream)
        {
            string ClassTag;
            //@ Undeclared identifier(3): 'soFromBeginning'
            StateStream.Seek(0, soFromBeginning);
            while ((StateStream.Position < StateStream.Length))
            {
                ClassTag = ReadStringFromStream(StateStream);
                ApplyStateValues(ClassTag, StateStream);
            }
        }

        private void ReportStateLoaded()
        {
            int I;
            // iterate through modules and report that their state has been loaded
            for (I = 0; I < FModuleList.Count; I ++ )
            {
                ((TTWXModule)(FModuleList[I])).StateValuesLoaded();
            }
        }

        public bool LoadStateValues()
        {
            bool result;
            System.IO.File InputFile;
            int Size;
            int RecordedSize;
            int Checksum;
            MemoryStream InStream;
            object Buf;
            // Load the state of each module from file
            result = false;
            InputFile = new FileInfo(OutputFile);
            StreamReader _R_4 = InputFile.OpenText();
            //@ Unsupported function or procedure: 'IOResult'
            if ((IOResult == 0))
            {
                try {
                    Size = _R_4.BaseStream.Length;
                    if ((Size > 8))
                    {
                        // make sure the file is as big as its supposed to be
                        //@ Unsupported function or procedure: 'BlockRead'
                        BlockRead(InputFile, RecordedSize, 4);
                        if ((RecordedSize == Size))
                        {
                            // get checksum
                            //@ Unsupported function or procedure: 'BlockRead'
                            BlockRead(InputFile, Checksum, 4);
                            // now grab the rest
                            InStream = new MemoryStream();
                            Size -= 8;
                            try {
                                //@ Unsupported function or procedure: 'AllocMem'
                                Buf = AllocMem(Size);
                                try {
                                    //@ Unsupported function or procedure: 'BlockRead'
                                    BlockRead(InputFile, Buf, Size);
                                    InStream.WriteByte(Buf, Size);
                                } finally {
                                    //@ Unsupported function or procedure: 'FreeMem'
                                    FreeMem(Buf, Size);
                                }
                                if ((CalcChecksum(InStream) == Checksum))
                                {
                                    // input OK - extract values from it
                                    ProcessStateValues(InStream);
                                }
                            } finally {
                                //@ Unsupported property or method(C): 'Free'
                                InStream.Free;
                            }
                        }
                        result = true;
                    }
                } finally {
                    _R_4.Close();
                }
            }
            ReportStateLoaded();
            return result;
        }

        private string ReadStringFromStream(Stream Stream)
        {
            string result;
            int Len;
            string Buf;
            Stream.ReadByte(Len, 4);
            //@ Unsupported function or procedure: 'AllocMem'
            Buf = AllocMem(Len + 1);
            Stream.ReadByte(Buf, Len);
            //@ Unsupported function or procedure: 'SetString'
            SetString(result, Buf, Len);
            //@ Unsupported function or procedure: 'FreeMem'
            FreeMem(Buf);
            return result;
        }

    } // end TPersistenceManager

}

