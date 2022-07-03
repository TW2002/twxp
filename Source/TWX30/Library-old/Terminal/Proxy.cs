using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading.Tasks;
using System.Timers;

namespace TWXP
{
    public class Proxy
    {
        const int DEFAULT_PORT = 2002;
        const int DEFAULT_LISTNER = 2300;

        public event EventHandler<EventArgs> ClientConnected = delegate { };

        public TelnetServer Server { get; private set; }

        public string ListenAddress { get; private set; }
        public IPAddress ListenIP { get; private set; }
        public int ListenPort { get; private set; }

        private bool active, connecting;
        private TcpListener tcpListener;
        private Timer connectTimer;

        internal List<TelnetClient> Clients { get; private set; }
        public Scripts Scripts { get; private set; }


        /// <summary>
        /// Initalize a proxy without any parameters.
        /// </summary>
        public Proxy()
        {
            active = false;

            Server = new TelnetServer();
            Server.Address = "";
            Server.Port = DEFAULT_PORT;
            Server.Connected += ServerConnect;
            Server.Disconnected += ServerDisconnect;
            Server.Receive += InboundReceive;

            ListenAddress = "";
            ListenIP = IPAddress.Any;
            ListenPort = DEFAULT_LISTNER;

            Clients = new List<TelnetClient>();
            Scripts = new Scripts(this);

        }

        public async Task StartAsync()
        {
            if (active == true) return;
            else active = true;

            if (tcpListener != null)
            {
                tcpListener.Start();
                return;
            }

            if (!string.IsNullOrEmpty(ListenAddress))
            {
                try
                {
                    // Set the porrt if specified in ProxyAddress.
                    if (ListenAddress.Contains(":"))
                    {
                        String[] s = ListenAddress.Split(':');
                        ListenAddress = s[0];
                        ListenPort = int.Parse(s[1]);
                    }

                    // Resolve host binding from ProxyAddress
                    IPHostEntry ipHost = await Dns.GetHostEntryAsync(ListenAddress);
                    ListenIP = ipHost.AddressList[1];
                }
                catch { }
            }

            try
            {
                tcpListener = new TcpListener(ListenIP, ListenPort);
                tcpListener.Start();
            }
            catch (Exception e)
            {
                Console.WriteLine("\n \n*** Error *** Unable to open TCP listener. Socket returned error message:\n{0}", e.Message);
                //Environment.Exit(1);

            }

            await HandleConnectionsAsync(tcpListener);

            tcpListener.Stop();
        }

        private async Task HandleConnectionsAsync(TcpListener listener)
        {
            while (active)
            {
                // Wait for connections.
                TelnetClient client = new TelnetClient(await listener.AcceptTcpClientAsync());

                // Add the receive handler.
                client.Initialized += ClientInitialized;
                client.Receive += OutboundReceive;
                client.Disconnected += ClientDisconnect;

                // Add the client to the list of clients
                Clients.Add(client);

                // Raise client connected event.
                ClientConnected(client, new EventArgs());

                //Handle New connection
                //NewClient(client);
            }
        }

        private void ClientInitialized(Object source, EventArgs e)
        {
            TelnetClient client = (TelnetClient)source;

            // Send ASCII FF + BS and ANSI Clear Screen + Banner
            client.Write("\u000c\u0008\u001B[2J\r\u001B[0;33mTWX Proxy 3 - Version 3.1944a Alpha - Please do not distribute.\n\r\n\r");

            // Send Greeting
            BroadCast($"\u001B[1;31mConnection accepted from {client.RemoteEP.Address}({client.ReverseDNS})\n\r\n\r");
        }

        public void Pause()
        {
            tcpListener.Stop();
        }

        public void Resume()
        {
            tcpListener.Start();
        }

        public void Stop()
        {
            active = false;
        }

        public void Connect()
        {
            if (!connecting)
            {
                connecting = true;
                ConnectNow(this, null);
            }
            else
            {
                Echo("Connecting...");


                if (connectTimer != null)
                {
                    connectTimer.Enabled = true;
                    return;
                }

                connectTimer = new System.Timers.Timer();
                connectTimer.Interval = 3000;

                connectTimer.Elapsed += ConnectNow;
                connectTimer.AutoReset = false;
                connectTimer.Enabled = true;
            }
        }
        private void ConnectNow(Object source, System.Timers.ElapsedEventArgs e)
        {
            //if (Server.Connecting || Server.Connected) return;
            Echo($"Connecting to {Server.Address}:{Server.Port}...");

            Server.Connect("MicroBlaster.Net:2002");

            //if (connectTimer != null)
            //{
            //    connectTimer.Enabled = false;
            //}

        }

        private void InboundReceive(Object source, EventArgs e)
        {
            connecting = false;
            string s = (string)source;

            foreach (TelnetClient c in Clients)
            {
                c.Write(s);
            }
        }

        private void OutboundReceive(Object source, EventArgs e)
        {
            string s = (string)source;

            Server.Write(s);
        }

        private void ServerConnect(Object source, EventArgs e)
        {
            TelnetServer server = (TelnetServer)source;
            connecting = false;

            Extractor.ProcessEvent(Extractor.TriggerEvents.Connect);
            //BroadCast($"\u001B[1;31mServer Connected {server.RemoteEP.Address}:{server.RemoteEP.Port}\n\r\n\r");
            BroadCast($"\u001B[1;31mServer Connected\n\r\n\r");
        }

        private void ServerDisconnect(Object source, EventArgs e)
        {
            TelnetServer server = (TelnetServer)source;
            connecting = false;

            Extractor.ProcessEvent(Extractor.TriggerEvents.Disconnect);
            BroadCast($"\u001B[1;31mServer disconnected {server.RemoteEP.Address}:{server.RemoteEP.Port}\n\r\n\r");
        }

        private void ClientDisconnect(Object source, EventArgs e)
        {
            TelnetClient client = (TelnetClient)source;

            BroadCast($"\u001B[1;31mClient disconnected {client.RemoteEP.Address}({client.ReverseDNS})\n\r\n\r");
        }

        public void Disconnect()
        {
            //if (Server.Disconnecting || (!Server.Connected)) return;
            Echo("Disconnecting...");

            if (connectTimer != null)
            {
                connectTimer.Enabled = false;
            }

            Server.Disconnect();
        }

        public void Echo(string s)
        {
            foreach (TelnetClient c in Clients)
            {
                c.Write(s.Replace("*", "\r\n"));
            }
        }

        public void BroadCast(string s)
        {
            foreach (TelnetClient c in Clients)
            {
                c.Write(s.Replace("*", "\r\n"));
            }
        }
    }
}
