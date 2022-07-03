using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Xml;
using System.Xml.Serialization;

namespace TWXP.Database
{
    public class XmlBase
    {
        protected string xsd = "";

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

        //public void Serialize(object sender, string filename)
        public void Serialize(string filename)
        {
            if (!Directory.Exists($"{AssemblyDirectory}\\Data"))
            {
                Directory.CreateDirectory($"{AssemblyDirectory}\\Data");
            }

            //string configFile = @"c:\ProgramData\MailLink\config.xml";

            using (FileStream fs = new FileStream($"{AssemblyDirectory}\\Data\\{filename}", FileMode.Create))
            {

                XmlSerializerNamespaces xmlns = new XmlSerializerNamespaces();
                xmlns.Add("xsi", "http://www.w3.org/2001/XMLSchema-instance");
                //xmlns.Add("noNamespaceSchemaLocation", xsd);
                //XmlSerializer xml = new XmlSerializer(this.GetType(),);
                XmlWriterSettings xmlWriterSettings = new System.Xml.XmlWriterSettings()
                {
                    // If set to true XmlWriter would close MemoryStream automatically and using would then do double dispose
                    // Code analysis does not understand that. That's why there is a suppress message.
                    CloseOutput = false,
                    Encoding = Encoding.UTF8,
                    OmitXmlDeclaration = false,
                    Indent = true
                };
                using (System.Xml.XmlWriter xw = System.Xml.XmlWriter.Create(fs, xmlWriterSettings))
                {
                    XmlSerializer s = new XmlSerializer(this.GetType());
                    s.Serialize(xw, this, xmlns);
                }
                //xml.Serialize(fs, this, xmlns);
                fs.Close();
            }
        }

        public static void Deserialize()
        {
            string configFile = @"c:\ProgramData\MailLink\config.xml";

            if (!File.Exists(configFile))
            {
                //Config c = new Config();
                //c.Create();
                //c.Serialize();
                //return c;
            }
            else
            {
                using (FileStream fs = new FileStream(configFile, FileMode.Open))
                {
                    //XmlSerializer xml = new XmlSerializer(typeof(this));

                    // Config config = (Config)xml.Deserialize(fs);

                    fs.Close();
                    //return config;
                }
            }
        }
    }

}

