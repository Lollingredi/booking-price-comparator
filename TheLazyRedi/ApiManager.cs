using Serilog;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace TheLazyRedi
{
    internal static class ApiManager
    {
        private static HotelEntry queryResults;
        private static double avg;
        private static double prezzoMin;
        private static double prezzoMax;
        private static async Task Request()
        {
            
            var client = new HttpClient();
            var request = new HttpRequestMessage
            {
                Method = HttpMethod.Get,
                RequestUri = new Uri(UriPicker()),
                Headers =
                    {
                        { "Accept", "application/json" },
                        { "X-RapidAPI-Key", "[REDACTED]" },
                        { "X-RapidAPI-Host", "booking-com-api3.p.rapidapi.com" },
                    },
            };
            using var response = await client.SendAsync(request);
            try
            {
                response.EnsureSuccessStatusCode();
                Log.Information("Codice risposta: " + response.StatusCode);
                var body = await response.Content.ReadAsStringAsync();
                Log.Information("Richiesta all'API completata. Risultati:\n" + body);
                queryResults = JsonConvert.DeserializeObject<HotelEntry>(body);
            }
            catch (Exception ex)
            {
                Log.Error("Errore di input: " + ex.Message);
                queryResults = new HotelEntry();
            }
        }

        public static async Task<double> Average()
        {
            await Request();
            Log.Information("Calcolo media");
            double sum = 0;
            prezzoMin = 999999;
            prezzoMax = -999999;
            if (queryResults.result != null)
            {
                foreach(var hotel in queryResults.result){
                    sum += hotel.price;
                    if(hotel.price < prezzoMin)
                        prezzoMin = hotel.price;
                    if(hotel.price > prezzoMax)
                        prezzoMax = hotel.price;
                }
                avg = sum / queryResults.result.Count;
                Log.Information("Media calcolata");
                return Math.Round(avg, 2);
            }
            else
            {
                Log.Error("Nessun risultato disponibile");
                prezzoMin = -1;
                prezzoMax = -1;
                return (-1);
            }
        }

        public static string GuestsGenerator()
        {
            string ret = "";
            if(Program.GetForm().GetAdulti() > 0)
            {
                ret += "A";
                for(int i = 1; i < Program.GetForm().GetAdulti(); i++)
                    ret += "%2CA";
                if(Program.GetForm().GetBambini() > 0)
                    for (int i = 1; i <= Program.GetForm().GetBambini(); i++)
                        ret += "%2C10";
            }
            else
            {
                if (Program.GetForm().GetBambini() > 0)
                {

                    ret += "10";
                    for (int i = 1; i < Program.GetForm().GetBambini(); i++)
                        ret += "%2C10";
                }
            }
            return ret;
        }

        public static string UriPicker()
        {
            if(!(Program.GetForm().GetModeLista()))
                return "https://booking-com-api3.p.rapidapi.com/booking/hotelAvailability?currency=EUR" +
                "&stars=" + Program.GetForm().GetStelle() +
                "&room1=" + GuestsGenerator() +
                "&checkin=" + Program.GetForm().GetArrivo() +
                "&order_by=distance" +
                "&checkout=" + Program.GetForm().GetPartenza() +
                "&latitude=" + Program.GetForm().GetLatitudine() +
                "&user_platform=desktop" +
                "&language=it" +
                "&longitude=" + Program.GetForm().GetLongitudine() +
                "&radius=" + Program.GetForm().GetRaggio() +
                "&guest_country=" + Program.GetForm().GetNazione();
            else
                return "https://booking-com-api3.p.rapidapi.com/booking/hotelAvailability?currency=EUR" +
                "&room1=" + GuestsGenerator() +
                "&checkin=" + Program.GetForm().GetArrivo() +
                "&order_by=distance" +
                "&checkout=" + Program.GetForm().GetPartenza() +
                "&user_platform=desktop" +
                "&language=it" +
                "&guest_country=" + Program.GetForm().GetNazione() +
                "&hotel_ids=" + HotelListGenerator();
        }

        public static string HotelListGenerator()
        {
            string res = "";
            if(Program.GetForm().GetListaHotel().Length > 0)
            {
                var hotelArray = Program.GetForm().GetListaHotel().Split(',');
                res += hotelArray[0];
                for(int i = 1; i < hotelArray.Length; i++)
                    res += "%2C" + hotelArray[i];
            }
            return res;
        }

        public static List<Result> GetQueryResult()
        {
            return queryResults.result;
        }

        public static double GetAvg()
        {
            return Math.Round(avg, 2);
        }

        public static double GetPrezzoMin()
        {
            return Math.Round(prezzoMin, 2);
        }

        public static double GetPrezzoMax()
        {
            return Math.Round(prezzoMax, 2);
        }
    }
}
