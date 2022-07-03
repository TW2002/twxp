using System;
using System.Collections.Generic;
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
    internal class TelnetClient
    {
        public event EventHandler<EventArgs> Initialized = delegate { };
        public event EventHandler<EventArgs> Receive = delegate { };
        public event EventHandler<EventArgs> Disconnected = delegate { };

        public IPEndPoint RemoteEP { get; private set; }
        public IPEndPoint LocalEP { get; private set; }
        public string ReverseDNS { get; private set; }
        public string Terminal { get; private set; }

        private TcpClient tcpClient;
        private NetworkStream stream;
        private MemoryStream output = new MemoryStream();

        private bool active;
        private bool ansiDetected;

        public TelnetClient(TcpClient tcpclient)
        {
            tcpClient = tcpclient;


            active = true;
            ansiDetected = false;

            // Initialize the connection.
            Initialize();
        }

        private async void Initialize()
        {
            if (tcpClient.Connected)
            {
                // Get the underlying stream from the client.
                //using (stream = tcpClient.GetStream())
                stream = tcpClient.GetStream();
                byte[] buffer = new byte[tcpClient.ReceiveBufferSize];
                //int bytes;

                // Get the local and remote endpoints from the stream.
                PropertyInfo socket = stream.GetType().GetProperty("Socket", BindingFlags.NonPublic | BindingFlags.Instance);
                RemoteEP = (IPEndPoint)((Socket)socket.GetValue(stream, null)).RemoteEndPoint;
                LocalEP = (IPEndPoint)((Socket)socket.GetValue(stream, null)).LocalEndPoint;

                // Start reverse DNS lookup using an asynchronous task.
                Task<IPHostEntry> rdnsTask = Dns.GetHostEntryAsync(IPAddress.Parse(RemoteEP.Address.ToString()));

                // Send ASCII FF + BS and ANSI Clear Screen
                //Write("\u000c\u0008\u001B[2J\r");

                // Send Telnet and ANSI handshake
                byte[] telnet = {
                        12, 5,             // ASCII FF + ENQ
                        27, 91, 62, 112,   // ANSI Clear Screen
                        255, 251, 1,       // Telnet (IAC)(Will)(ECHO) - Will Echo
                        255, 251, 3,       // Telnet (IAC)(Will)(SGA)  - Will Supress Go Ahead
                        255, 251, 31,      // Telnet (IAC)(Will)(NAWS) - Will Negotiate About Window Size
                        27, 91, 54, 110 }; //  ANSI (ESC)[6n - Request Cursor Position
                stream.Write(telnet, 0, telnet.Length);

                // Send Initializing
                //Write("TWX Proxy 3" + "\r\n\u001B[0;32m  Initializing...");
                Write("\rInitializing...");
                await Task.Delay(200);

                try
                {
                    // Read the response.
                    stream.ReadTimeout = 500;
                    stream.Read(buffer, 0, 1024);

                    string response = Encoding.UTF8.GetString(buffer);
                    // Check if response contains an ANSI excape sequence.
                    // ansiDetected = Encoding.UTF8.GetString(readBuffer).Contains("\u001B[");
                    ansiDetected = Regex.IsMatch(response, "\\x1b[[0-9;]*R");

                    if (buffer.Take(6).SequenceEqual(new byte[] { 255, 253, 200, 255, 253, 200 }))
                    {
                        Terminal = "Swath";  // Swath sends (IAC)(DO)(200) response twice on initial connection.
                                             // This response is invalid since options 141 - 254 are Unassigned
                    }
                    else
                    {
                        Terminal = "";
                        foreach (char c in response)
                        {
                            if (c == 27) break;
                            if (c > 63 && c < 128) Terminal += c;
                        }
                    }


                }
                catch (Exception)
                {

                    // TODO: Log ANSI detection error.
                }

                // TODO: skip ReverseDNS if localhost or local interface
                // Get the reverse DNS result.
                //await Task.Delay(2000);
                ReverseDNS = "UNKNOWN";
                try
                {
                    rdnsTask.Wait();
                    ReverseDNS = rdnsTask.Result.HostName;
                }
                catch (Exception)
                {
                    // TODO: Log reverse DNS error.
                }


                // Send initialized event.
                Initialized(this, new EventArgs());

                // 
                stream.BeginRead(buffer, 0, buffer.Length, ReadCallback, buffer);
            }
        }

        private void ReadCallback(IAsyncResult result)
        {
            try
            {
                // Get the response
                int bytes = stream.EndRead(result);
                byte[] buffer = result.AsyncState as byte[];

                // Send receive event with data.
                Receive(ASCIIEncoding.ASCII.GetString(buffer, 0, bytes), new EventArgs());
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
            //StringBuilder output = new StringBuilder();

            if (tcpClient.Connected && stream != null)
            {
                //foreach (char c in text)
                //{
                //    if (c > 31) output.Append(c);
                //}

                //Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                //byte[] buffer = Encoding.GetEncoding("IBM437").GetBytes(text);
                byte[] buffer = Encoding.ASCII.GetBytes(text);
                stream.Write(buffer, 0, buffer.Length);
            }
        }
    }
}
    

