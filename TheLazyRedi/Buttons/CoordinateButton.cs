using Serilog;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheLazyRedi.Buttons
{
    internal static class CoordinateButton
    {
        public static void ApriCoordinate()
        {
            string latitudine = "";
            string longitudine = "";
            try
            {
                StreamReader sr = new(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\latitudine.txt");
                latitudine = sr.ReadLine();
                sr.Close();
            }
            catch (Exception ex)
            {
                Log.Error("Errore lettura file latitudine: " + ex.Message);
            }
            finally
            {
                Log.Information("Lettura file latitudine completa.");
                if (!(latitudine == null))
                    if (!(latitudine.Equals("")))
                    {
                        if (double.TryParse(latitudine, System.Globalization.NumberStyles.Any, CultureInfo.GetCultureInfo("en-GB"), out double res1))
                            Program.GetForm().SetLatitudine(res1.ToString());
                    }
                    else
                        Log.Error("Il documento letto è vuoto.");
                else
                    Log.Error("Il documento letto è vuoto.");
            }
            try
            {
                StreamReader sr = new(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\longitudine.txt");
                longitudine = sr.ReadLine();
                sr.Close();
            }
            catch (Exception ex)
            {
                Log.Error("Errore lettura file longitudine: " + ex.Message);
            }
            finally
            {
                Log.Information("Lettura file longitudine completa.");
                if (!(longitudine == null))
                    if (!(longitudine.Equals("")))
                    {
                        if (double.TryParse(longitudine, System.Globalization.NumberStyles.Any, CultureInfo.GetCultureInfo("en-GB"), out double res2))
                            Program.GetForm().SetLongitudine(res2.ToString());
                    }
                    else
                        Log.Error("Il documento letto è vuoto.");
                else
                    Log.Error("Il documento letto è vuoto.");
            }
        }
    }
}
