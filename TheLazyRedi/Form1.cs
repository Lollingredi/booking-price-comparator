using GMap.NET;
using GMap.NET.WindowsForms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using System;
using System.Collections;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Security.Policy;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.Windows.Media.TextFormatting;
using System.Windows.Navigation;
using TheLazyRedi.Buttons;
using static OfficeOpenXml.ExcelErrorValue;

namespace TheLazyRedi
{
    public partial class Form1 : Form
    {
        public Form1()
        {
            InitializeComponent();
        }

        private void Form1_Load(object sender, EventArgs e)
        {
            this.raggio.SelectedIndex = 0;
            this.countrycode.SelectedIndex = 109;
            this.stelle.SelectedIndex = 4;
            this.coordinate.Select();
            this.esporta.Enabled = false;
            gmap.MapProvider = GMap.NET.MapProviders.BingMapProvider.Instance;
            GMap.NET.GMaps.Instance.Mode = GMap.NET.AccessMode.ServerOnly;
            gmap.Position = new PointLatLng(44.5414458, 11.4368431);
            gmap.DragButton = System.Windows.Forms.MouseButtons.Left;
            Log.Information("Applicazione avviata");
            CreateFoldersAndFiles();
        }

        private void Esporta_Click(object sender, EventArgs e)
        {
            ExcelManager.Export();
            MessageBox.Show("Un file XLSX è stato esportato nella cartella " + Environment.SpecialFolder.MyDocuments.ToString() + 
                "\\BookingAvg\\output", "Documento esportato", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void ToolStripButton1_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Booking.com average calculator\n\n\n" +
                "Written and directed by Tommaso Mangialardi\n\n" +
                "Booking.com freemium API by LnTechnologies available at rapidapi.com\n\n" +
                "All rights reserved", "About", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private async void Calcola_Click(object sender, EventArgs e)
        {
            await CalcolaButton.ClickCalcolaAsync();
            this.esporta.Enabled = true;

        }

        private void Lista_CheckedChanged(object sender, EventArgs e)
        {
            this.latitudine.Enabled = false;
            this.longitudine.Enabled = false;
            this.raggio.Enabled = false;
            this.stelle.Enabled = false;
            this.listaHotel.Enabled = true;
            this.apriLista.Enabled = true;
            this.gmap.Enabled = false;
            this.apriCoordinate.Enabled = false;

        }

        private void Coordinate_CheckedChanged(object sender, EventArgs e)
        {
            this.latitudine.Enabled = true;
            this.longitudine.Enabled = true;
            this.raggio.Enabled = true;
            this.stelle.Enabled = true;
            this.listaHotel.Enabled = false;
            this.apriLista.Enabled = false;
            this.gmap.Enabled = true;
            this.apriCoordinate.Enabled = true;
        }

        private void Guida_Click(object sender, EventArgs e)
        {
            MessageBox.Show("Il programma può essere usato in 2 modalità: Coordinate e Lista.\n\n\n" +
                "Nella modalità Coordinate è possibile specificare latitudine, " +
                "longitudine e raggio di una location, specificando anche un filtro relativo alle stelle.\n\n" +
                "È possibile inserire le coordinate manualmente, caricandole da un apposito file o " +
                "selezionando una posizione nella mappa.\n\n" +
                "Nella modalità Lista è possibile utilizzare una serie di ID di hotel memorizzata in un documento.\n\n" +
                "Il programma dispone di uno strumento per la ricerca di un ID, attivabile selezionando il pulsante + " +
                "e incollando nell'apposita finestra l'URL della pagina di Booking.com relativa ad un hotel. " +
                "L'ID ottenuto verrà salvato nel file lista.txt insieme al nome dell'hotel e potrà essere utilizzato caricando la lista.\n\n" +
                "In alternativa, per ottenere l'ID dalla pagina di un hotel su Booking.com, è possibile aprire il menù " +
                "Analizza (Firefox) o Visualizza sorgente pagina (Chrome) e cercare il valore numerico al campo hotel_id. " +
                "Si sconsiglia l'inserimento manuale di ID e nomi all'interno del file.\n\n\n" +
                "I file di relativi a latitudine, longitudine e lista di hotel sono contenuti nella cartella Documenti\\BookingAvg\\input, mentre " +
                "i documenti XLSX generati dal pulsante Esporta documento si trovano nella cartella Documenti\\BookingAvg\\output.",
                "Guida", MessageBoxButtons.OK, MessageBoxIcon.Information);
        }

        private void ApriCoordinate_Click(object sender, EventArgs e)
        {
            CoordinateButton.ApriCoordinate();
        }

        private void ApriLista_Click(object sender, EventArgs e)
        {
            ListaButtons.ApriLista();
        }

        private void Latitudine_TextChanged(object sender, EventArgs e)
        {
            if (double.TryParse(latitudine.Text, out double res) && double.TryParse(longitudine.Text, out double res2))
                gmap.Position = new PointLatLng(double.Parse(latitudine.Text), double.Parse(longitudine.Text));
        }

        private void Longitudine_TextChanged(object sender, EventArgs e)
        {
            if (double.TryParse(latitudine.Text, out double res) && double.TryParse(longitudine.Text, out double res2))
                gmap.Position = new PointLatLng(double.Parse(latitudine.Text), double.Parse(longitudine.Text));
        }

        private void Gmap_OnMapDrag()
        {
            this.latitudine.Text = gmap.Position.Lat.ToString(CultureInfo.CreateSpecificCulture("en-GB"));
            this.longitudine.Text = gmap.Position.Lng.ToString(CultureInfo.CreateSpecificCulture("en-GB"));
        }

        private static void CreateFoldersAndFiles()
        {
            if (!(Directory.Exists(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg")))
                Directory.CreateDirectory(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg");

            if (!(Directory.Exists(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\output")))
                Directory.CreateDirectory(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\output");

            if (!(Directory.Exists(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\log")))
                Directory.CreateDirectory(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\log");

            if (!(File.Exists(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\latitudine.txt")))
                File.CreateText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\latitudine.txt");

            if (!(File.Exists(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\longitudine.txt")))
                File.CreateText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\longitudine.txt");

            if (!(File.Exists(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\lista.txt")))
                File.CreateText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\lista.txt");

            if (!(File.Exists(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\log\\log.txt")))
                File.CreateText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\log\\log.txt");

            string testoFileLista = File.ReadAllText(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\input\\lista.txt");
            if (string.IsNullOrEmpty(testoFileLista))
                ListaButtons.SetFileLista([]);
            else
                ListaButtons.SetFileLista(JsonConvert.DeserializeObject<Dictionary<int, string>>(testoFileLista));

        }

        private async void IdDaUrl_ClickAsync(object sender, EventArgs e)
        {
            await ListaButtons.IdDaUrlAsync();
        }

        private void RimuoviDaLista_Click(object sender, EventArgs e)
        {
            ListaButtons.RimuoviDaLista();
        }

        public int GetStelle()
        {
            return int.Parse(this.stelle.SelectedItem.ToString());
        }

        public string GetNazione()
        {
            return this.countrycode.SelectedItem.ToString();
        }

        public double GetLatitudine()
        {
            if (double.TryParse(this.latitudine.Text, out double result))
                return result;
            else return 0;
        }

        public double GetLongitudine()
        {
            if (double.TryParse(this.longitudine.Text, out double result))
                return result;
            else return 0;
        }

        public int GetRaggio()
        {
            return int.Parse(this.raggio.SelectedItem.ToString());
        }

        public int GetAdulti()
        {
            return (int)this.adulti.Value;
        }

        public int GetBambini()
        {
            return (int)this.bambini.Value;
        }
        public string GetArrivo()
        {
            return this.arrivo.Value.ToString("yyyy-MM-dd");
        }

        public string GetPartenza()
        {
            if (DateTime.Compare(this.arrivo.Value, this.partenza.Value) > 0)
                return this.arrivo.Value.AddDays(1).ToString("yyyy-MM-dd");
            else
                return this.partenza.Value.ToString("yyyy-MM-dd");

        }

        public Boolean GetModeLista()
        {
            return this.lista.Checked;
        }

        public string GetListaHotel()
        {
            return this.listaHotel.Text;
        }

        internal void SetRisultato(string v)
        {
            this.risultato.Text = v;
        }

        internal void SetPrezzoMin(string v)
        {
            this.prezzoMin.Text = v;
        }

        internal void SetPrezzoMax(string v)
        {
            this.prezzoMax.Text = v;
        }

        internal void SetLatitudine(string v)
        {
            this.latitudine.Text = v;
        }

        internal void SetLongitudine(string v)
        {
            this.longitudine.Text = v;
        }

        internal void SetFileLista(Dictionary<int, string> dictionary)
        {
            throw new NotImplementedException();
        }

        internal void SetListaHotel(string v)
        {
            this.listaHotel.Text = v;
        }
    }
}
