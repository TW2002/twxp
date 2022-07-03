using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;

namespace TWXP
{
    /// <summary>
    /// A class to manage twscripts (.ts) and roslyn scripts (.cs/.vb)
    /// </summary>
    public class Scripts : List<Script>
    {
        // A property to get the root path of the executable from System.Reflection
        public static string AssemblyDirectory
        {
            get
            {
                string codeBase = Assembly.GetExecutingAssembly().CodeBase;
                UriBuilder uri = new UriBuilder(codeBase);
                string path = Uri.UnescapeDataString(uri.Path);
                return Path.GetDirectoryName(path);
            }
        }

        private Proxy proxy;

        public Scripts(Proxy proxy)
        {
            this.proxy = proxy;
            cmd.Load();
        }


        public void Load(string filename)
        {
            //TODO: Single instance scripts

            // Create a new script object and set the filename.
            Script script = new Script($"{AssemblyDirectory}\\{filename}", proxy);

            // Add the script to the list of scripts.
            Add(script);

            // Execute the script (Script will be Loaded and Compiled if necessary).
            script.Execute();

        }
    }

    public class Script
    {
        private enum ScriptType { TWS, CS, VB }

        public string FileName { get; private set; }
        public string Name { get; private set; }
        public Proxy Proxy { get; private set; }

        public bool Active { get; private set; }

        private ScriptType type;
        private TWS tws = null;



        public Script(string filename, Proxy proxy)
        {
            FileName = filename;
            Name = Path.GetFileName(filename).Replace(Path.GetExtension(filename), "");
            Proxy = proxy;
            Active = false;

            switch (Path.GetExtension(filename))
            {
                case ".ts":
                case ".tws":
                case ".cts":
                    type = ScriptType.TWS;
                    tws = new TWS(FileName, Proxy);
                    break;
                case ".cs":
                    type = ScriptType.CS;
                    break;

                case ".vb":
                    type = ScriptType.VB;
                    break;
            }
        }

        public void Execute()
        {
            switch (type)
            {
                case ScriptType.TWS:
                    // TODO: See if the script is already running.
                    Active = true;
                    tws.Execute();
                    break;

                case ScriptType.CS:
                    //Compilation csCompilation = CompileCS();
                    //if (csCompilation != null) Exec(csCompilation);
                    break;

                case ScriptType.VB:
                    //Compilation vbCompilation = CompileVB();
                    //if (vbCompilation != null) Exec(vbCompilation);
                    break;

            }

        }

        public void Exec(string label)
        {
            //TODO:
        }

    }
}
