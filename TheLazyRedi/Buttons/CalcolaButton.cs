using Microsoft.VisualBasic.Logging;
using Serilog;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheLazyRedi.Buttons
{
    internal static class CalcolaButton
    {
        public static async Task ClickCalcolaAsync()
        {
            Serilog.Log.Information("Nazione: " + Program.GetForm().GetNazione());
            if (!(Program.GetForm().GetModeLista()))
            {
                Serilog.Log.Information("Stelle: " + Program.GetForm().GetStelle());
                Serilog.Log.Information("Latitudine: " + Program.GetForm().GetLatitudine());
                Serilog.Log.Information("Longitudine: " + Program.GetForm().GetLongitudine());
                Serilog.Log.Information("Raggio: " + Program.GetForm().GetRaggio());
            }
            else
            {
                Serilog.Log.Information("Lista hotel: " + Program.GetForm().GetListaHotel());
                Serilog.Log.Information("Lista hotel formattata: " + ApiManager.HotelListGenerator());
            }
            Serilog.Log.Information("Adulti: " + Program.GetForm().GetAdulti());
            Serilog.Log.Information("Bambini: " + Program.GetForm().GetBambini());
            Serilog.Log.Information("Stringa guest: " + ApiManager.GuestsGenerator());
            Serilog.Log.Information("Arrivo: " + Program.GetForm().GetArrivo());
            Serilog.Log.Information("Partenza: " + Program.GetForm().GetPartenza());
            Serilog.Log.Information("URI: " + ApiManager.UriPicker());

            var media = await ApiManager.Average();
            Program.GetForm().SetRisultato("€" + media.ToString());
            Program.GetForm().SetPrezzoMin("€" + ApiManager.GetPrezzoMin());
            Program.GetForm().SetPrezzoMax("€" + ApiManager.GetPrezzoMax());
        }
    }
}
