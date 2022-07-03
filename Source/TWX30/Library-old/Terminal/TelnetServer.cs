using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Sockets;
using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;


namespace TWXP
{
    public class TelnetServer
    {

        public string Address { get; set; }
        public IPAddress IP { get; private set; }
        public int Port { get; set; }

        //public bool Connected { get; private set; }
        //public bool Connecting { get; private set; }
        //public bool Disconnecting { get; private set; }

        private bool active;

        public event EventHandler<EventArgs> Receive = delegate { };
        public event EventHandler<EventArgs> Connected = delegate { };
        public event EventHandler<EventArgs> Disconnected = delegate { };

        public IPEndPoint RemoteEP { get; private set; }
        public IPEndPoint LocalEP { get; private set; }

        private TcpClient tcpClient;
        private NetworkStream stream;
        private MemoryStream output = new MemoryStream();

        public TelnetServer()
        {
            active = false;
            //tcpClient = new TcpClient();
        }

        public void Connect(string address, int port = 2002)
        {
            Address = address;
            Port = port;

            try
            {
                // Set the port if specified in address.
                if (address.Contains(":"))
                {
                    String[] s = address.Split(':');
                    Address = s[0];
                    Port = int.Parse(s[1]);
                }
            }
            catch { }

            Connect();
        }

        public void Connect()
        {
            if (active) return;
            active = true;

            try
            {
                tcpClient = new TcpClient();

                //IPAddress[] remoteHost = Dns.GetHostAddresses("hostaddress");

                //Start the async connect operation          

                tcpClient.BeginConnect(Address, Port, new AsyncCallback(ConnectCallback), tcpClient);

            }
            catch (Exception ex)
            {
                Debug.Write(ex.Message);
            }
        }


        private void ConnectCallback(IAsyncResult result)
        {
            if (!active) return;

            // Send connected event.
            Connected(this, new EventArgs());

            try
            {
                stream = tcpClient.GetStream();

                // Get the local and remote endpoints from the stream.
                PropertyInfo socket = stream.GetType().GetProperty("Socket", BindingFlags.NonPublic | BindingFlags.Instance);
                RemoteEP = (IPEndPoint)((Socket)socket.GetValue(stream, null)).RemoteEndPoint;
                LocalEP = (IPEndPoint)((Socket)socket.GetValue(stream, null)).LocalEndPoint;

                // Send Telnet handshake
                byte[] telnet = {
                    255, 251, 1,    // Telnet (IAC)(Will)(ECHO) - Will Echo
                    255, 251, 3 };  // Telnet (IAC)(Will)(SGA)  - Will Supress Go Ahead
                stream.Write(telnet, 0, telnet.Length);

                ///stream.ReadTimeout = 500;

                //NetworkStream networkStream = tcpClient.GetStream();

                byte[] buffer = new byte[tcpClient.ReceiveBufferSize];
                stream.BeginRead(buffer, 0, buffer.Length, ReadCallback, buffer);
            }
            catch (Exception ex)
            {
                Debug.Write(ex.Message);
            }

            while(active)
            {
                if (!tcpClient.Client.Poll(0, SelectMode.SelectWrite))
                {
                    active = false;
                    Disconnected(this, new EventArgs());
                }
            }
        }

        private void ReadCallback(IAsyncResult result)
        {
            if (!active) return;

            try
            {
                // Get the response
                int bytes = stream.EndRead(result);
                byte[] buffer = (byte[])result.AsyncState;


                StringBuilder control = new StringBuilder();
                StringBuilder text = new StringBuilder();

                foreach (char c in Encoding.ASCII.GetString(buffer, 0, bytes))
                {
                    if (c < 32 && c != 13 && c != 10 && c != 27) control.Append(c);
                    else text.Append(c);
                }

                // Send receive event with data.
                Receive(text.ToString(), new EventArgs());
            }
            catch (Exception)
            {
                active = false;
                Disconnected(this, new EventArgs());
            }

            // Start reading from the network again.
            try
            {
                byte[] buffer = new byte[tcpClient.ReceiveBufferSize];
                stream.BeginRead(buffer, 0, buffer.Length, ReadCallback, buffer);
            }
            catch (Exception)
            {
                active = false;
                Disconnected(this, new EventArgs());
            }
        }


        public void Write(String text)
        {
            if (active)
            {
                //todo: buffer ???  determin if a buffer is needed
                try
                {
                    //Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                    //byte[] buffer = Encoding.GetEncoding("IBM437").GetBytes(text);
                    byte[] buffer = Encoding.ASCII.GetBytes(text);
                    stream.Write(buffer, 0, buffer.Length);
                }
                catch (Exception)
                {

                    //throw;
                }
            }
        }

        public void Disconnect()
        {
            active = false;
            tcpClient.Client.Disconnect(true);
        }
    }
}
