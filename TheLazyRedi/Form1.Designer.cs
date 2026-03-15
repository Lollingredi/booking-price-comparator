using System.Drawing;

namespace TheLazyRedi
{
    partial class Form1
    {
        /// <summary>
        /// Variabile di progettazione necessaria.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Pulire le risorse in uso.
        /// </summary>
        /// <param name="disposing">ha valore true se le risorse gestite devono essere eliminate, false in caso contrario.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Codice generato da Progettazione Windows Form

        /// <summary>
        /// Metodo necessario per il supporto della finestra di progettazione. Non modificare
        /// il contenuto del metodo con l'editor di codice.
        /// </summary>
        private void InitializeComponent()
        {
            System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(Form1));
            arrivo = new System.Windows.Forms.DateTimePicker();
            partenza = new System.Windows.Forms.DateTimePicker();
            label1 = new System.Windows.Forms.Label();
            label2 = new System.Windows.Forms.Label();
            label3 = new System.Windows.Forms.Label();
            label4 = new System.Windows.Forms.Label();
            latitudine = new System.Windows.Forms.TextBox();
            longitudine = new System.Windows.Forms.TextBox();
            label5 = new System.Windows.Forms.Label();
            label6 = new System.Windows.Forms.Label();
            risultato = new System.Windows.Forms.TextBox();
            label7 = new System.Windows.Forms.Label();
            esporta = new System.Windows.Forms.Button();
            calcola = new System.Windows.Forms.Button();
            raggio = new System.Windows.Forms.ComboBox();
            label8 = new System.Windows.Forms.Label();
            countrycode = new System.Windows.Forms.ComboBox();
            label9 = new System.Windows.Forms.Label();
            stelle = new System.Windows.Forms.ComboBox();
            label10 = new System.Windows.Forms.Label();
            adulti = new System.Windows.Forms.NumericUpDown();
            bambini = new System.Windows.Forms.NumericUpDown();
            menubar = new System.Windows.Forms.ToolStrip();
            guida = new System.Windows.Forms.ToolStripButton();
            about = new System.Windows.Forms.ToolStripButton();
            pictureBox1 = new System.Windows.Forms.PictureBox();
            label11 = new System.Windows.Forms.Label();
            modalita = new System.Windows.Forms.GroupBox();
            lista = new System.Windows.Forms.RadioButton();
            coordinate = new System.Windows.Forms.RadioButton();
            listaHotel = new System.Windows.Forms.TextBox();
            label12 = new System.Windows.Forms.Label();
            apriCoordinate = new System.Windows.Forms.Button();
            apriLista = new System.Windows.Forms.Button();
            gmap = new GMap.NET.WindowsForms.GMapControl();
            label13 = new System.Windows.Forms.Label();
            idDaUrl = new System.Windows.Forms.Button();
            label14 = new System.Windows.Forms.Label();
            rimuoviDaLista = new System.Windows.Forms.Button();
            prezzoMin = new System.Windows.Forms.TextBox();
            prezzoMax = new System.Windows.Forms.TextBox();
            label15 = new System.Windows.Forms.Label();
            label16 = new System.Windows.Forms.Label();
            gridLog1 = new Serilog.Sinks.WinForms.Core.GridLog();
            ((System.ComponentModel.ISupportInitialize)adulti).BeginInit();
            ((System.ComponentModel.ISupportInitialize)bambini).BeginInit();
            menubar.SuspendLayout();
            ((System.ComponentModel.ISupportInitialize)pictureBox1).BeginInit();
            modalita.SuspendLayout();
            SuspendLayout();
            // 
            // arrivo
            // 
            arrivo.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            arrivo.Location = new Point(103, 433);
            arrivo.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            arrivo.Name = "arrivo";
            arrivo.Size = new Size(261, 23);
            arrivo.TabIndex = 1;
            // 
            // partenza
            // 
            partenza.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            partenza.Location = new Point(520, 434);
            partenza.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            partenza.Name = "partenza";
            partenza.Size = new Size(261, 23);
            partenza.TabIndex = 2;
            // 
            // label1
            // 
            label1.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label1.AutoSize = true;
            label1.Location = new Point(672, 275);
            label1.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label1.Name = "label1";
            label1.Size = new Size(39, 15);
            label1.TabIndex = 5;
            label1.Text = "Adulti";
            // 
            // label2
            // 
            label2.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label2.AutoSize = true;
            label2.Location = new Point(672, 344);
            label2.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label2.Name = "label2";
            label2.Size = new Size(51, 15);
            label2.TabIndex = 6;
            label2.Text = "Bambini";
            // 
            // label3
            // 
            label3.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label3.AutoSize = true;
            label3.Location = new Point(14, 434);
            label3.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label3.Name = "label3";
            label3.Size = new Size(77, 15);
            label3.TabIndex = 7;
            label3.Text = "Data di arrivo";
            // 
            // label4
            // 
            label4.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label4.AutoSize = true;
            label4.Location = new Point(414, 434);
            label4.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label4.Name = "label4";
            label4.Size = new Size(92, 15);
            label4.TabIndex = 8;
            label4.Text = "Data di partenza";
            // 
            // latitudine
            // 
            latitudine.Location = new Point(520, 163);
            latitudine.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            latitudine.Name = "latitudine";
            latitudine.Size = new Size(103, 23);
            latitudine.TabIndex = 9;
            latitudine.TextChanged += Latitudine_TextChanged;
            // 
            // longitudine
            // 
            longitudine.Location = new Point(520, 229);
            longitudine.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            longitudine.Name = "longitudine";
            longitudine.Size = new Size(103, 23);
            longitudine.TabIndex = 10;
            longitudine.TextChanged += Longitudine_TextChanged;
            // 
            // label5
            // 
            label5.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label5.AutoSize = true;
            label5.Location = new Point(520, 144);
            label5.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label5.Name = "label5";
            label5.Size = new Size(60, 15);
            label5.TabIndex = 11;
            label5.Text = "Latitudine";
            // 
            // label6
            // 
            label6.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label6.AutoSize = true;
            label6.Location = new Point(520, 211);
            label6.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label6.Name = "label6";
            label6.Size = new Size(71, 15);
            label6.TabIndex = 12;
            label6.Text = "Longitudine";
            // 
            // risultato
            // 
            risultato.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            risultato.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            risultato.Font = new Font("Microsoft Sans Serif", 28F);
            risultato.Location = new Point(808, 541);
            risultato.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            risultato.Name = "risultato";
            risultato.ReadOnly = true;
            risultato.Size = new Size(226, 50);
            risultato.TabIndex = 13;
            risultato.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            // 
            // label7
            // 
            label7.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label7.AutoSize = true;
            label7.Location = new Point(875, 523);
            label7.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label7.Name = "label7";
            label7.Size = new Size(92, 15);
            label7.TabIndex = 14;
            label7.Text = "Media dei prezzi";
            label7.TextAlign = ContentAlignment.MiddleCenter;
            // 
            // esporta
            // 
            esporta.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            esporta.Cursor = System.Windows.Forms.Cursors.Hand;
            esporta.Location = new Point(808, 597);
            esporta.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            esporta.Name = "esporta";
            esporta.Size = new Size(226, 30);
            esporta.TabIndex = 15;
            esporta.Text = "Esporta documento";
            esporta.UseVisualStyleBackColor = true;
            esporta.Click += Esporta_Click;
            // 
            // calcola
            // 
            calcola.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            calcola.Cursor = System.Windows.Forms.Cursors.Hand;
            calcola.Font = new Font("Segoe UI", 14.25F, FontStyle.Regular, GraphicsUnit.Point, 0);
            calcola.Location = new Point(808, 363);
            calcola.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            calcola.Name = "calcola";
            calcola.Size = new Size(226, 74);
            calcola.TabIndex = 16;
            calcola.Text = "Calcola";
            calcola.UseVisualStyleBackColor = true;
            calcola.Click += Calcola_Click;
            // 
            // raggio
            // 
            raggio.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            raggio.FormattingEnabled = true;
            raggio.Items.AddRange(new object[] { "15", "20", "25", "30", "35", "40", "45", "50", "55", "60", "65", "70", "75", "80", "85", "90", "95", "100" });
            raggio.Location = new Point(517, 293);
            raggio.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            raggio.Name = "raggio";
            raggio.Size = new Size(106, 23);
            raggio.TabIndex = 17;
            // 
            // label8
            // 
            label8.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label8.AutoSize = true;
            label8.Location = new Point(517, 275);
            label8.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label8.Name = "label8";
            label8.Size = new Size(44, 15);
            label8.TabIndex = 18;
            label8.Text = "Raggio";
            // 
            // countrycode
            // 
            countrycode.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            countrycode.FlatStyle = System.Windows.Forms.FlatStyle.System;
            countrycode.FormattingEnabled = true;
            countrycode.Items.AddRange(new object[] { "AD", "AE", "AF", "AG", "AI", "AL", "AM", "AO", "AQ", "AR", "AS", "AT", "AU", "AW", "AX", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BL", "BM", "BN", "BO", "BQ", "BR", "BS", "BT", "BV", "BW", "BY", "BZ", "CA", "CC", "CD", "CF", "CG", "CH", "CI", "CK", "CL", "CM", "CN", "CO", "CR", "CU", "CV", "CW", "CX", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "EH", "ER", "ES", "ET", "FI", "FJ", "FK", "FM", "FO", "FR", "GA", "GB", "GD", "GE", "GF", "GG", "GH", "GI", "GL", "GM", "GN", "GP", "GQ", "GR", "GS", "GT", "GU", "GW", "GY", "HK", "HM", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IM", "IN", "IO", "IQ", "IR", "IS", "IT", "JE", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KP", "KR", "KW", "KY", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MF", "MG", "MH", "MK", "ML", "MM", "MN", "MO", "MP", "MQ", "MR", "MS", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NC", "NE", "NF", "NG", "NI", "NL", "NO", "NP", "NR", "NU", "NZ", "OM", "PA", "PE", "PF", "PG", "PH", "PK", "PL", "PM", "PN", "PR", "PS", "PT", "PW", "PY", "QA", "RE", "RO", "RS", "RU", "RW", "SA", "SB", "SC", "SD", "SE", "SG", "SH", "SI", "SJ", "SK", "SL", "SM", "SN", "SO", "SR", "SS", "ST", "SV", "SX", "SY", "SZ", "TC", "TD", "TF", "TG", "TH", "TJ", "TK", "TL", "TM", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "UM", "US", "UY", "UZ", "VA", "VC", "VE", "VG", "VI", "VN", "VU", "WF", "WS", "YE", "YT", "ZA", "ZM", "ZW" });
            countrycode.Location = new Point(672, 163);
            countrycode.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            countrycode.Name = "countrycode";
            countrycode.Size = new Size(104, 23);
            countrycode.TabIndex = 19;
            // 
            // label9
            // 
            label9.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label9.AutoSize = true;
            label9.Location = new Point(672, 144);
            label9.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label9.Name = "label9";
            label9.Size = new Size(107, 15);
            label9.TabIndex = 20;
            label9.Text = "Nazione del cliente";
            // 
            // stelle
            // 
            stelle.DropDownStyle = System.Windows.Forms.ComboBoxStyle.DropDownList;
            stelle.FlatStyle = System.Windows.Forms.FlatStyle.System;
            stelle.FormattingEnabled = true;
            stelle.Items.AddRange(new object[] { "0", "1", "2", "3", "4", "5" });
            stelle.Location = new Point(517, 363);
            stelle.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            stelle.Name = "stelle";
            stelle.Size = new Size(106, 23);
            stelle.TabIndex = 21;
            // 
            // label10
            // 
            label10.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label10.AutoSize = true;
            label10.Location = new Point(517, 344);
            label10.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label10.Name = "label10";
            label10.Size = new Size(129, 15);
            label10.TabIndex = 22;
            label10.Text = "Stelle (0 per disattivare)";
            // 
            // adulti
            // 
            adulti.Location = new Point(672, 294);
            adulti.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            adulti.Minimum = new decimal(new int[] { 1, 0, 0, 0 });
            adulti.Name = "adulti";
            adulti.Size = new Size(104, 23);
            adulti.TabIndex = 23;
            adulti.Value = new decimal(new int[] { 1, 0, 0, 0 });
            // 
            // bambini
            // 
            bambini.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            bambini.Location = new Point(672, 363);
            bambini.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            bambini.Name = "bambini";
            bambini.Size = new Size(104, 23);
            bambini.TabIndex = 24;
            // 
            // menubar
            // 
            menubar.Items.AddRange(new System.Windows.Forms.ToolStripItem[] { guida, about });
            menubar.Location = new Point(0, 0);
            menubar.Name = "menubar";
            menubar.Size = new Size(1049, 25);
            menubar.TabIndex = 25;
            menubar.Text = "toolStrip1";
            // 
            // guida
            // 
            guida.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            guida.Image = (Image)resources.GetObject("guida.Image");
            guida.ImageTransparentColor = Color.Magenta;
            guida.Name = "guida";
            guida.Size = new Size(42, 22);
            guida.Text = "Guida";
            guida.Click += Guida_Click;
            // 
            // about
            // 
            about.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Text;
            about.ImageTransparentColor = Color.Magenta;
            about.Name = "about";
            about.Size = new Size(44, 22);
            about.Text = "About";
            about.Click += ToolStripButton1_Click;
            // 
            // pictureBox1
            // 
            pictureBox1.Image = Properties.Resources._2560px_Booking_com_Logo_svg;
            pictureBox1.Location = new Point(14, 37);
            pictureBox1.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            pictureBox1.Name = "pictureBox1";
            pictureBox1.Size = new Size(345, 62);
            pictureBox1.SizeMode = System.Windows.Forms.PictureBoxSizeMode.Zoom;
            pictureBox1.TabIndex = 26;
            pictureBox1.TabStop = false;
            // 
            // label11
            // 
            label11.AutoSize = true;
            label11.BackColor = SystemColors.Control;
            label11.Font = new Font("Leelawadee UI", 45F, FontStyle.Bold);
            label11.ForeColor = Color.DarkBlue;
            label11.Location = new Point(367, 18);
            label11.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label11.Name = "label11";
            label11.Size = new Size(549, 81);
            label11.TabIndex = 27;
            label11.Text = "average calculator";
            // 
            // modalita
            // 
            modalita.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            modalita.Controls.Add(lista);
            modalita.Controls.Add(coordinate);
            modalita.FlatStyle = System.Windows.Forms.FlatStyle.System;
            modalita.Location = new Point(808, 125);
            modalita.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            modalita.Name = "modalita";
            modalita.Padding = new System.Windows.Forms.Padding(4, 3, 4, 3);
            modalita.Size = new Size(226, 80);
            modalita.TabIndex = 28;
            modalita.TabStop = false;
            modalita.Text = "Modalità";
            // 
            // lista
            // 
            lista.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            lista.AutoSize = true;
            lista.Location = new Point(8, 51);
            lista.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            lista.Name = "lista";
            lista.Size = new Size(49, 19);
            lista.TabIndex = 1;
            lista.TabStop = true;
            lista.Text = "Lista";
            lista.UseVisualStyleBackColor = true;
            lista.CheckedChanged += Lista_CheckedChanged;
            // 
            // coordinate
            // 
            coordinate.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            coordinate.AutoSize = true;
            coordinate.Location = new Point(8, 23);
            coordinate.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            coordinate.Name = "coordinate";
            coordinate.Size = new Size(84, 19);
            coordinate.TabIndex = 0;
            coordinate.TabStop = true;
            coordinate.Text = "Coordinate";
            coordinate.UseVisualStyleBackColor = true;
            coordinate.CheckedChanged += Coordinate_CheckedChanged;
            // 
            // listaHotel
            // 
            listaHotel.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            listaHotel.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            listaHotel.Location = new Point(808, 320);
            listaHotel.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            listaHotel.Name = "listaHotel";
            listaHotel.ReadOnly = true;
            listaHotel.Size = new Size(226, 23);
            listaHotel.TabIndex = 29;
            // 
            // label12
            // 
            label12.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label12.AutoSize = true;
            label12.Location = new Point(848, 302);
            label12.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label12.Name = "label12";
            label12.Size = new Size(186, 15);
            label12.TabIndex = 30;
            label12.Text = "Lista di ID di hotel (modalità Lista)";
            // 
            // apriCoordinate
            // 
            apriCoordinate.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            apriCoordinate.Location = new Point(808, 229);
            apriCoordinate.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            apriCoordinate.Name = "apriCoordinate";
            apriCoordinate.Size = new Size(226, 24);
            apriCoordinate.TabIndex = 31;
            apriCoordinate.Text = "Apri coordinate da file";
            apriCoordinate.UseVisualStyleBackColor = true;
            apriCoordinate.Click += ApriCoordinate_Click;
            // 
            // apriLista
            // 
            apriLista.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            apriLista.Location = new Point(808, 266);
            apriLista.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            apriLista.Name = "apriLista";
            apriLista.Size = new Size(226, 24);
            apriLista.TabIndex = 32;
            apriLista.Text = "Apri lista da file";
            apriLista.UseVisualStyleBackColor = true;
            apriLista.Click += ApriLista_Click;
            // 
            // gmap
            // 
            gmap.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            gmap.Bearing = 0F;
            gmap.CanDragMap = true;
            gmap.EmptyTileColor = Color.Navy;
            gmap.GrayScaleMode = false;
            gmap.HelperLineOption = GMap.NET.WindowsForms.HelperLineOptions.DontShow;
            gmap.LevelsKeepInMemory = 5;
            gmap.Location = new Point(18, 144);
            gmap.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            gmap.MarkersEnabled = true;
            gmap.MaxZoom = 18;
            gmap.MinZoom = 1;
            gmap.MouseWheelZoomEnabled = true;
            gmap.MouseWheelZoomType = GMap.NET.MouseWheelZoomType.MousePositionAndCenter;
            gmap.Name = "gmap";
            gmap.NegativeMode = false;
            gmap.PolygonsEnabled = true;
            gmap.RetryLoadTile = 0;
            gmap.RoutesEnabled = true;
            gmap.ScaleMode = GMap.NET.WindowsForms.ScaleModes.Integer;
            gmap.SelectedAreaFillColor = Color.FromArgb(33, 65, 105, 225);
            gmap.ShowTileGridLines = false;
            gmap.Size = new Size(492, 243);
            gmap.TabIndex = 33;
            gmap.Zoom = 15D;
            gmap.OnMapDrag += Gmap_OnMapDrag;
            // 
            // label13
            // 
            label13.Anchor = System.Windows.Forms.AnchorStyles.None;
            label13.AutoSize = true;
            label13.Location = new Point(18, 396);
            label13.Margin = new System.Windows.Forms.Padding(4, 0, 4, 0);
            label13.Name = "label13";
            label13.Size = new Size(332, 15);
            label13.TabIndex = 34;
            label13.Text = "Spostare la mappa con il mouse per selezionare una posizione";
            // 
            // idDaUrl
            // 
            idDaUrl.Location = new Point(671, 229);
            idDaUrl.Name = "idDaUrl";
            idDaUrl.Size = new Size(52, 23);
            idDaUrl.TabIndex = 35;
            idDaUrl.Text = "+";
            idDaUrl.UseVisualStyleBackColor = true;
            idDaUrl.Click += IdDaUrl_ClickAsync;
            // 
            // label14
            // 
            label14.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            label14.AutoSize = true;
            label14.Location = new Point(672, 211);
            label14.Name = "label14";
            label14.Size = new Size(78, 15);
            label14.TabIndex = 36;
            label14.Text = "Modifica lista";
            // 
            // rimuoviDaLista
            // 
            rimuoviDaLista.Location = new Point(725, 228);
            rimuoviDaLista.Name = "rimuoviDaLista";
            rimuoviDaLista.Size = new Size(51, 24);
            rimuoviDaLista.TabIndex = 37;
            rimuoviDaLista.Text = "-";
            rimuoviDaLista.UseVisualStyleBackColor = true;
            rimuoviDaLista.Click += RimuoviDaLista_Click;
            // 
            // prezzoMin
            // 
            prezzoMin.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            prezzoMin.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            prezzoMin.Font = new Font("Segoe UI", 15.75F, FontStyle.Regular, GraphicsUnit.Point, 0);
            prezzoMin.Location = new Point(808, 473);
            prezzoMin.Name = "prezzoMin";
            prezzoMin.ReadOnly = true;
            prezzoMin.Size = new Size(108, 35);
            prezzoMin.TabIndex = 38;
            prezzoMin.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            // 
            // prezzoMax
            // 
            prezzoMax.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
            prezzoMax.BorderStyle = System.Windows.Forms.BorderStyle.FixedSingle;
            prezzoMax.Font = new Font("Segoe UI", 15.75F, FontStyle.Regular, GraphicsUnit.Point, 0);
            prezzoMax.Location = new Point(926, 473);
            prezzoMax.Name = "prezzoMax";
            prezzoMax.ReadOnly = true;
            prezzoMax.Size = new Size(108, 35);
            prezzoMax.TabIndex = 39;
            prezzoMax.TextAlign = System.Windows.Forms.HorizontalAlignment.Center;
            // 
            // label15
            // 
            label15.AutoSize = true;
            label15.Location = new Point(808, 455);
            label15.Name = "label15";
            label15.Size = new Size(65, 15);
            label15.TabIndex = 40;
            label15.Text = "Prezzo min";
            // 
            // label16
            // 
            label16.AutoSize = true;
            label16.Location = new Point(967, 455);
            label16.Name = "label16";
            label16.Size = new Size(67, 15);
            label16.TabIndex = 41;
            label16.Text = "Prezzo max";
            // 
            // gridLog1
            // 
            gridLog1.Location = new Point(18, 473);
            gridLog1.Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            gridLog1.Name = "gridLog1";
            gridLog1.Size = new Size(763, 153);
            gridLog1.TabIndex = 43;
            // 
            // Form1
            // 
            AutoScaleDimensions = new SizeF(7F, 15F);
            AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
            BackColor = SystemColors.Control;
            ClientSize = new Size(1049, 640);
            Controls.Add(gridLog1);
            Controls.Add(label16);
            Controls.Add(label15);
            Controls.Add(prezzoMax);
            Controls.Add(prezzoMin);
            Controls.Add(rimuoviDaLista);
            Controls.Add(label14);
            Controls.Add(idDaUrl);
            Controls.Add(label13);
            Controls.Add(gmap);
            Controls.Add(apriLista);
            Controls.Add(apriCoordinate);
            Controls.Add(label12);
            Controls.Add(listaHotel);
            Controls.Add(modalita);
            Controls.Add(label11);
            Controls.Add(pictureBox1);
            Controls.Add(menubar);
            Controls.Add(bambini);
            Controls.Add(adulti);
            Controls.Add(label10);
            Controls.Add(stelle);
            Controls.Add(label9);
            Controls.Add(countrycode);
            Controls.Add(label8);
            Controls.Add(raggio);
            Controls.Add(calcola);
            Controls.Add(esporta);
            Controls.Add(label7);
            Controls.Add(risultato);
            Controls.Add(label6);
            Controls.Add(label5);
            Controls.Add(longitudine);
            Controls.Add(latitudine);
            Controls.Add(label4);
            Controls.Add(label3);
            Controls.Add(label2);
            Controls.Add(label1);
            Controls.Add(partenza);
            Controls.Add(arrivo);
            FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedSingle;
            Icon = (Icon)resources.GetObject("$this.Icon");
            Margin = new System.Windows.Forms.Padding(4, 3, 4, 3);
            MaximizeBox = false;
            MinimumSize = new Size(1065, 679);
            Name = "Form1";
            StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            Text = "Booking.com average calculator";
            Load += Form1_Load;
            ((System.ComponentModel.ISupportInitialize)adulti).EndInit();
            ((System.ComponentModel.ISupportInitialize)bambini).EndInit();
            menubar.ResumeLayout(false);
            menubar.PerformLayout();
            ((System.ComponentModel.ISupportInitialize)pictureBox1).EndInit();
            modalita.ResumeLayout(false);
            modalita.PerformLayout();
            ResumeLayout(false);
            PerformLayout();
        }

        #endregion
        private System.Windows.Forms.DateTimePicker arrivo;
        private System.Windows.Forms.DateTimePicker partenza;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.Label label4;
        private System.Windows.Forms.TextBox latitudine;
        private System.Windows.Forms.TextBox longitudine;
        private System.Windows.Forms.Label label5;
        private System.Windows.Forms.Label label6;
        private System.Windows.Forms.TextBox risultato;
        private System.Windows.Forms.Label label7;
        private System.Windows.Forms.Button esporta;
        private System.Windows.Forms.Button calcola;
        private System.Windows.Forms.ComboBox raggio;
        private System.Windows.Forms.Label label8;
        private System.Windows.Forms.ComboBox countrycode;
        private System.Windows.Forms.Label label9;
        private System.Windows.Forms.ComboBox stelle;
        private System.Windows.Forms.Label label10;
        private System.Windows.Forms.NumericUpDown adulti;
        private System.Windows.Forms.NumericUpDown bambini;
        private System.Windows.Forms.ToolStrip menubar;
        private System.Windows.Forms.ToolStripButton about;
        private System.Windows.Forms.PictureBox pictureBox1;
        private System.Windows.Forms.Label label11;
        private System.Windows.Forms.GroupBox modalita;
        private System.Windows.Forms.RadioButton lista;
        private System.Windows.Forms.RadioButton coordinate;
        private System.Windows.Forms.TextBox listaHotel;
        private System.Windows.Forms.Label label12;
        private System.Windows.Forms.ToolStripButton guida;
        private System.Windows.Forms.Button apriCoordinate;
        private System.Windows.Forms.Button apriLista;
        private GMap.NET.WindowsForms.GMapControl gmap;
        private System.Windows.Forms.Label label13;
        private System.Windows.Forms.Button idDaUrl;
        private System.Windows.Forms.Label label14;
        private System.Windows.Forms.Button rimuoviDaLista;
        private System.Windows.Forms.TextBox prezzoMin;
        private System.Windows.Forms.TextBox prezzoMax;
        private System.Windows.Forms.Label label15;
        private System.Windows.Forms.Label label16;
        private Serilog.Sinks.WinForms.Core.GridLog gridLog1;
    }
}

