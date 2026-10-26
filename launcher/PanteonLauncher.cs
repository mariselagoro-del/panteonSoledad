using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Threading;
using System.Diagnostics;

namespace PanteonLaSoledad
{
    class Program
    {
        private static TcpListener listener;
        private static string webRoot;
        private static int port = 8080;

        static void Main(string[] args)
        {
            Console.Title = "Panteón La Soledad - Servidor del Sistema";
            Console.ForegroundColor = ConsoleColor.Cyan;
            Console.WriteLine("============================================================");
            Console.WriteLine("     SISTEMA DE GESTION CATASTRAL - PANTEON LA SOLEDAD     ");
            Console.WriteLine("============================================================");
            Console.ResetColor();

            // 1. Localizar la carpeta dist
            string baseDir = AppDomain.CurrentDomain.BaseDirectory;
            if (Directory.Exists(Path.Combine(baseDir, "dist")))
            {
                webRoot = Path.Combine(baseDir, "dist");
            }
            else if (File.Exists(Path.Combine(baseDir, "index.html")))
            {
                webRoot = baseDir;
            }
            else
            {
                // Buscar en directorio actual
                string curDir = Directory.GetCurrentDirectory();
                if (Directory.Exists(Path.Combine(curDir, "dist")))
                {
                    webRoot = Path.Combine(curDir, "dist");
                }
                else
                {
                    webRoot = curDir;
                }
            }

            if (!File.Exists(Path.Combine(webRoot, "index.html")))
            {
                Console.ForegroundColor = ConsoleColor.Red;
                Console.WriteLine("ERROR: No se encontro el archivo index.html ni la carpeta 'dist'.");
                Console.WriteLine("Asegurate de que la carpeta 'dist' este junto a este ejecutable.");
                Console.ResetColor();
                Console.WriteLine("\nPresiona cualquier tecla para salir...");
                Console.ReadKey();
                return;
            }

            Console.WriteLine("Carpeta web cargada: " + webRoot);

            // 2. Iniciar servidor TCP HTTP
            bool iniciado = false;
            int[] puertosPrueba = new int[] { 8080, 8081, 5173, 3000, 8888, 9090 };
            foreach (int p in puertosPrueba)
            {
                try
                {
                    listener = new TcpListener(IPAddress.Loopback, p);
                    listener.Start();
                    port = p;
                    iniciado = true;
                    break;
                }
                catch
                {
                    // Intentar siguiente puerto
                }
            }

            if (!iniciado)
            {
                try
                {
                    listener = new TcpListener(IPAddress.Loopback, 0); // Puerto aleatorio disponible
                    listener.Start();
                    port = ((IPEndPoint)listener.LocalEndpoint).Port;
                    iniciado = true;
                }
                catch (Exception ex)
                {
                    Console.ForegroundColor = ConsoleColor.Red;
                    Console.WriteLine("Error al iniciar el servidor local: " + ex.Message);
                    Console.ResetColor();
                    Console.WriteLine("\nPresiona cualquier tecla para salir...");
                    Console.ReadKey();
                    return;
                }
            }

            string url = "http://127.0.0.1:" + port + "/";
            Console.ForegroundColor = ConsoleColor.Green;
            Console.WriteLine("\nServidor activo en: " + url);
            Console.ResetColor();

            // Iniciar hilo del servidor
            Thread serverThread = new Thread(EscucharPeticiones);
            serverThread.IsBackground = true;
            serverThread.Start();

            // 3. Abrir navegador en modo Aplicación
            AbrirNavegador(url);

            Console.WriteLine("\n------------------------------------------------------------");
            Console.WriteLine("Instrucciones de uso:");
            Console.WriteLine(" - El sistema se ha abierto automaticamente en tu pantalla.");
            Console.WriteLine(" - Si se cerro por error, puedes abrir: " + url);
            Console.WriteLine(" - Para salir y apagar el sistema, cierra esta ventana.");
            Console.WriteLine("------------------------------------------------------------\n");

            // Mantener proceso vivo
            while (true)
            {
                Thread.Sleep(1000);
            }
        }

        private static void AbrirNavegador(string url)
        {
            try
            {
                // Intentar Edge en modo aplicacion (ventana limpia de escritorio)
                ProcessStartInfo psiEdge = new ProcessStartInfo
                {
                    FileName = "msedge.exe",
                    Arguments = "--app=" + url,
                    UseShellExecute = true
                };
                Process.Start(psiEdge);
                return;
            }
            catch { }

            try
            {
                // Intentar Chrome en modo aplicacion
                ProcessStartInfo psiChrome = new ProcessStartInfo
                {
                    FileName = "chrome.exe",
                    Arguments = "--app=" + url,
                    UseShellExecute = true
                };
                Process.Start(psiChrome);
                return;
            }
            catch { }

            try
            {
                // Navegador por defecto
                Process.Start(new ProcessStartInfo
                {
                    FileName = url,
                    UseShellExecute = true
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine("Por favor abre manualmente en tu navegador: " + url);
            }
        }

        private static void EscucharPeticiones()
        {
            while (true)
            {
                try
                {
                    TcpClient client = listener.AcceptTcpClient();
                    ThreadPool.QueueUserWorkItem(ProcesarCliente, client);
                }
                catch
                {
                    break;
                }
            }
        }

        private static void ProcesarCliente(object obj)
        {
            TcpClient client = (TcpClient)obj;
            try
            {
                using (NetworkStream stream = client.GetStream())
                {
                    byte[] buffer = new byte[8192];
                    int bytesRead = stream.Read(buffer, 0, buffer.Length);
                    if (bytesRead <= 0) return;

                    string request = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                    string[] lines = request.Split(new string[] { "\r\n" }, StringSplitOptions.None);
                    if (lines.Length == 0) return;

                    string[] tokens = lines[0].Split(' ');
                    if (tokens.Length < 2) return;

                    string rawPath = tokens[1];
                    string urlPath = rawPath.Split('?')[0];
                    if (urlPath == "/" || string.IsNullOrEmpty(urlPath))
                    {
                        urlPath = "/index.html";
                    }

                    string localPath = Path.Combine(webRoot, urlPath.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));

                    // Soporte SPA: si no existe el archivo fisico, servir index.html
                    if (!File.Exists(localPath))
                    {
                        localPath = Path.Combine(webRoot, "index.html");
                    }

                    if (File.Exists(localPath))
                    {
                        byte[] fileBytes = File.ReadAllBytes(localPath);
                        string contentType = ObtenerContentType(localPath);

                        string header = "HTTP/1.1 200 OK\r\n" +
                                        "Content-Type: " + contentType + "\r\n" +
                                        "Content-Length: " + fileBytes.Length + "\r\n" +
                                        "Access-Control-Allow-Origin: *\r\n" +
                                        "Connection: close\r\n\r\n";
                        byte[] headerBytes = Encoding.UTF8.GetBytes(header);

                        stream.Write(headerBytes, 0, headerBytes.Length);
                        stream.Write(fileBytes, 0, fileBytes.Length);
                    }
                    else
                    {
                        string notFound = "HTTP/1.1 404 Not Found\r\nConnection: close\r\n\r\nArchivo no encontrado";
                        byte[] notFoundBytes = Encoding.UTF8.GetBytes(notFound);
                        stream.Write(notFoundBytes, 0, notFoundBytes.Length);
                    }
                }
            }
            catch { }
            finally
            {
                try { client.Close(); } catch { }
            }
        }

        private static string ObtenerContentType(string filePath)
        {
            string ext = Path.GetExtension(filePath).ToLower();
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".svg": return "image/svg+xml";
                case ".ico": return "image/x-icon";
                case ".woff": return "font/woff";
                case ".woff2": return "font/woff2";
                case ".ttf": return "font/ttf";
                case ".pdf": return "application/pdf";
                default: return "application/octet-stream";
            }
        }
    }
}
