using Newtonsoft.Json;
using Serilog;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Runtime.CompilerServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace TheLazyRedi.Buttons
{
    internal static class ListaButtons
    {
        private static Dictionary<int, string> fileLista;

        public static bool AddToFileLista(int ID, string name)
        {
            string insertedName;
            if (fileLista.ContainsKey(ID))
                return false;
            else
            {
                if (string.IsNullOrEmpty(name))
                    insertedName = "Nome sconosciuto";
                else
                    insertedName = name;
                fileLista.Add(ID, insertedName);
                File.WriteAllText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\lista.txt",
                    JsonConvert.SerializeObject(fileLista, Formatting.Indented));
                return true;
            }
        }

        public static Boolean RemoveFromFileLista(int ID)
        {
            if (fileLista.ContainsKey(ID))
            {
                fileLista.Remove(ID);
                File.WriteAllText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\lista.txt",
                    JsonConvert.SerializeObject(fileLista, Formatting.Indented));
                return true;
            }
            else
                return false;
        }

        public static void ApriLista()
        {
            StringBuilder stringBuilder = new();
            bool first = true;
            string testoFileLista = File.ReadAllText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\lista.txt");
            if (string.IsNullOrEmpty(testoFileLista))
                Program.GetForm().SetFileLista([]);
            else
                fileLista = JsonConvert.DeserializeObject<Dictionary<int, string>>(testoFileLista);
            if (fileLista.Count == 0)
            {
                Program.GetForm().SetListaHotel("");
                Log.Error("Il file lista è vuoto.");
                MessageBox.Show("Il file lista non contiene nessuna informazione.", "File lista vuoto", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            else
            {
                foreach (KeyValuePair<int, string> pair in fileLista)
                {
                    if (!first)
                    {
                        stringBuilder.Append(',');
                    }
                    first = false;

                    stringBuilder.Append(pair.Key);
                }

                Program.GetForm().SetListaHotel(stringBuilder.ToString());
                Log.Information("File lista caricato con successo.");
                MessageBox.Show("Il file lista è stato caricato correttamente.", "File lista caricato", MessageBoxButtons.OK, MessageBoxIcon.Information);
            }
        }

        public static Dictionary<int, string> GetFileLista()
        {
            return fileLista;
        }

        internal static void SetFileLista(Dictionary<int, string> dictionary)
        {
            fileLista = dictionary;
        }

        public static async Task IdDaUrlAsync()
        {
            string urlToElaborate = Microsoft.VisualBasic.Interaction.InputBox("Inserire l'URL della pagina di un hotel su Booking.com. " +
                "Il codice verrà inserito nella lista di ID degli hotel contenuta nel documento lista.txt.", "Aggiungi hotel", "");

            using var client = new HttpClient();
            try
            {
                var response = await client.GetAsync(urlToElaborate);
                if (!response.IsSuccessStatusCode)
                {
                    Log.Error("Errore nell'elaborazione dell'URL.");
                }

                var htmlContent = await response.Content.ReadAsStringAsync();

                Match hotelIDElement = Regex.Match(htmlContent, @"input type=""hidden"" name=""hotel_id"" value=""(\d+)""");
                Match hotelIDName = Regex.Match(htmlContent, @"<h2 class=""d2fee87262 pp-header__title"">(.*)<\/h2>");
                if (String.IsNullOrEmpty(hotelIDElement.Groups[1].Value) || string.IsNullOrEmpty(hotelIDName.Groups[1].Value))
                {
                    Log.Error("Nessun ID trovato.");
                    MessageBox.Show("Nessun ID trovato.", "Risultato", MessageBoxButtons.OK, MessageBoxIcon.Information);

                }
                else
                {
                    Log.Information("Trovato ID: " + hotelIDElement.Groups[1].Value + " Nome: " + hotelIDName.Groups[1].Value);

                    int hotelID = int.Parse(hotelIDElement.Groups[1].Value);
                    string hotelName = hotelIDName.Groups[1].Value;

                    Boolean aggiunto = ListaButtons.AddToFileLista(hotelID, hotelName);
                    if (aggiunto)
                        MessageBox.Show(hotelIDName.Groups[1].Value + " aggiunto al file lista", "Hotel aggiunto", MessageBoxButtons.OK, MessageBoxIcon.Information);
                    else
                        MessageBox.Show("Hotel non aggiunto al file lista", "Hotel non aggiunto", MessageBoxButtons.OK, MessageBoxIcon.Error);

                }
            }
            catch (Exception ex)
            {
                Log.Error("URL non valida: " + ex);
                MessageBox.Show("URL non valida.", "Errore", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public static void RimuoviDaLista()
        {
            string hotelToRemove = Microsoft.VisualBasic.Interaction.InputBox("Inserire l'ID di un hotel da rimuovere dal file lista. " +
               "Il codice verrà rimosso lista di ID degli hotel contenuta nel documento lista.txt.", "Rimuovi hotel", "");
            if (int.TryParse(hotelToRemove, out int hotelIDToRemove))
            {
                Boolean rimosso = ListaButtons.RemoveFromFileLista(hotelIDToRemove);
                if (rimosso)
                    MessageBox.Show("Hotel " + hotelToRemove + " rimosso dal file lista", "Hotel rimosso", MessageBoxButtons.OK, MessageBoxIcon.Information);
                else
                    MessageBox.Show("Hotel " + hotelToRemove + " non rimosso dal file lista", "Hotel non rimosso", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
            else
                MessageBox.Show("Inserire un ID valido", "ID non valido", MessageBoxButtons.OK, MessageBoxIcon.Error);
        }
    }
}
