using Serilog;
using Serilog.Formatting.Display;
using Serilog.Sinks.File;
using Serilog.Sinks.WinForms;
using Serilog.Sinks.WinForms.Base;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TheLazyRedi
{
    internal static class Program
    {
        private static Form1 form;
        /// <summary>
        /// Punto di ingresso principale dell'applicazione.
        /// </summary>
        [STAThread]
        static void Main()
        {
            Log.Logger = new LoggerConfiguration()
               .WriteTo.File(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\log\\log.txt")
               .WriteToGridView()
               .CreateLogger();

            Application.EnableVisualStyles();
            Application.SetCompatibleTextRenderingDefault(false);
            form = new Form1();
            Application.Run(form);
        }

        public static Form1 GetForm()
        {
            return form;
        }
    }
}
