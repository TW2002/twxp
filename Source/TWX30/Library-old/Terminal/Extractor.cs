using System;
using System.Collections.Generic;
using System.Text;
using System.Linq;

namespace TWXP
{
    public static class Extractor
    {
        public enum TriggerType { Event, Text, TextLine };
        public enum TriggerPriorityType { BackGround, Low, Normal, High, RealTime };
        public enum TriggerEvents { None, Connect, Disconnect };

        private static List<Extractor.EventTrigger> eventtriggers = new List<Extractor.EventTrigger>();

        public static void ProcessIn()
        {
        }

        public static void ProcessOut()
        {

        }

        public static void ProcessEvent(TriggerEvents eventtype)
        {
            var events = eventtriggers.Where(e => e.eventtype == eventtype);
            if (events.Count() > 0)
            {
                foreach (EventTrigger e in events)
                {
                    e.Script.Exec(e.Label);
                }
            }
        }

        public static void AddEventTrigger(TWS script, string name, string label, string eventname)
        {
            eventtriggers.Add(new Extractor.EventTrigger(script, name, label, eventname));
        }


        public class EventTrigger : Trigger 
        {
            internal TriggerEvents eventtype;

            public EventTrigger(TWS script, string name, string label, TriggerEvents eventtype)
            {
                Script = script;
                Name = name;
                Label = label;

                this.type = TriggerType.Event;
                this.priority = TriggerPriorityType.Normal;
                this.eventtype = eventtype;
            }

            public EventTrigger(TWS script, string name, string label, string eventname)
            {
                Script = script;
                Name = name;
                Label = label;

                this.type = TriggerType.Event;
                this.priority = TriggerPriorityType.Normal;
                
                switch (eventname.ToUpper())
                {
                    case "CONNECTION ACCEPTED":
                        eventtype = TriggerEvents.Connect;
                        break;

                    case "CONNECTION LOST":
                        eventtype = TriggerEvents.Disconnect;
                        break;

                    default:
                        break;
                }

            }

        }

        public class Trigger
        {
            internal TWS Script { get; set; }
            internal string Name { get; set; }
            //internal string Text { get; set; }
            internal string Label { get; set; }

            internal TriggerType type;
            internal TriggerPriorityType priority;



        }
    }
}
