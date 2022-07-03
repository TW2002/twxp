using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Schema;
using System.Xml.Serialization;

namespace TWXP.Database
{
    class TwxV2
    {
    }


    [Serializable]
    [XmlRoot]
    public class DataRoot : XmlBase
    {
        [XmlAttribute("noNamespaceSchemaLocation", Namespace = XmlSchema.InstanceNamespace)]
        public string attr = "http://www.swath.net/TWX.xsd";

        [XmlAttribute]
        public string Version { get; set; }

        [XmlElement]
        public Header Header { get; set; }

        //[XmlArrayItem(ElementName = "TraderData", Type = typeof(Trader))]
        public List<Trader> TraderData { get; set; }
        public List<Ship> ShipData { get; set; }

        public DataRoot()
        {
            //xsd = "http://www.swath.net/TWX.xsd";

            Header = new Header();
            Header.Created = new Created();
            Header.Game = new Game();
            Header.Game.Class0Port = new List<int>();
            TraderData = new List<Trader>();
            ShipData = new List<Ship>();

            Version = "2";
            Header.Created.Date = DateTimeOffset.Now.ToUnixTimeSeconds();
            Header.Created.By = "TWX Proxy v3.0";

            DateTime created = DateTimeOffset.FromUnixTimeSeconds((long)Header.Created.Date).LocalDateTime;


            Header.Game.Name = "Ice 9 - Game A";
            Header.Game.Host = "twgs.MicroBlaster.net";
            Header.Game.Port = 2002;

            Header.Game.Class0Port.Add(1);
            Header.Game.Class0Port.Add(555);

            TraderData.Add(new Trader { Name = "Micro", Updated = DateTimeOffset.Now.ToUnixTimeSeconds() });
            TraderData.Add(new Trader
            {
                Name = "Star Killer",
                Updated = DateTimeOffset.Now.ToUnixTimeSeconds(),
                Experience = 20000,
                Alignment = 1000,
                Corporation = 2,
                Rank = 9
            });

            Owner owner = new Owner { Corp = false, Value = "Micro" };


            ShipData.Add(new Ship { Name = "The Cat's Meow", Updated = DateTimeOffset.Now.ToUnixTimeSeconds(), TransWarpDrive = new TransWarpDrive { Ships = 2, Value = true}, Owner = owner });
            ShipData.Add(new Ship { Name = "Pod One", Updated = DateTimeOffset.Now.ToUnixTimeSeconds() });

        }

    }

    public class Header
    {
        [XmlElement]
        public Created Created { get; set; }

        [XmlElement]
        public Game Game { get; set; }
    }

    public class Created
    {
        [XmlElement]
        public double Date { get; set; }

        [XmlElement]
        public string By { get; set; }
    }

    public class Game
    {
        [XmlElement]
        public string Name { get; set; }
        public string Host { get; set; }
        public int Port { get; set; }
        public string Version { get; set; }
        public bool MBBS { get; set; }
        public bool Gold { get; set; }
        public int Sectors { get; set; }
        public int StarDock { get; set; }

        [XmlElement(ElementName = "Class0Port")]
        public List<int> Class0Port { get; set; }

    }

    public class Trader
    {
        [XmlAttribute]
        public string Name { get; set; }

        [XmlAttribute]
        public double Updated { get; set; }

        [XmlElement]
        public int Experience { get; set; }
        public int Alignment { get; set; }
        public int Corporation { get; set; }
        public int Rank { get; set; }

        public bool ShouldSerializeExperience()
        {
            return Experience > 0;
        }

        public bool ShouldSerializeAlignment()
        {
            return Alignment > 0;
        }

        public bool ShouldSerializeCorporation()
        {
            return Experience > 0;
        }

        public bool ShouldSerializeRank()
        {
            return Rank > 0;
        }

    }

    public class Ship
    {
        [XmlAttribute]
        public string nr { get; set; }

        [XmlAttribute]
        public double Updated { get; set; }

        [XmlElement]
        public string Name { get; set; }
        public string Type { get; set; }
        public string Brand { get; set; }
        public int Fighters { get; set; }
        public int Shields { get; set; }
        public int Holds { get; set; }
        public int FuelOre { get; set; }
        public int Equipment { get; set; }
        public int Organics { get; set; }
        public int Colonists { get; set; }
        public int TurnsPerWarp { get; set; }
        public TransWarpDrive TransWarpDrive { get; set; }
        public bool DensityScanner { get; set; }
        public bool HoloScanner { get; set; }
        public bool PlanetScanner { get; set; }
        public bool PsychProbe { get; set; }
        public Owner Owner { get; set; }
        public int Sector { get; set; }
    }

    public class TransWarpDrive
    {
        [XmlAttribute]
        public int Ships { get; set; }

        [XmlText]
        public bool Value { get; set; }
    }

    public class Owner
    {
        [XmlAttribute]
        public bool Corp { get; set; }

        [XmlText]
        public string Value { get; set; }
    }




}
