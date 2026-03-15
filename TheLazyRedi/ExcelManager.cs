using System;
using System.Collections;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Serialization;
using OfficeOpenXml;
using OfficeOpenXml.Style;
using TheLazyRedi.Buttons;

namespace TheLazyRedi
{
    internal static class ExcelManager
    {
        public static void Export()
        {
            ExcelPackage.LicenseContext = LicenseContext.NonCommercial;
            ExcelPackage package = new();
            {
                var worksheet = package.Workbook.Worksheets.Add("Hotels");

                worksheet.Cells[1, 1].Value = "ID";
                worksheet.Cells[1, 2].Value = "Nome";
                worksheet.Cells[1, 3].Value = "Prezzo";
                worksheet.Cells[1, 4].Value = "Valuta";
                worksheet.Cells["A1:D1"].Style.Font.Size = 15;
                worksheet.Cells["A1:D1"].Style.Font.Name = "Calibri";
                worksheet.Cells["A1:D1"].Style.Font.Bold = true;
                worksheet.Cells["A1:D1"].Style.Fill.PatternType = ExcelFillStyle.DarkHorizontal;
                worksheet.Cells["A1:D1"].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.Orange);
                worksheet.Cells[2, 6].Value = "Data di arrivo";
                worksheet.Cells[2, 7].Value = Program.GetForm().GetArrivo();
                worksheet.Cells[3, 6].Value = "Data di partenza";
                worksheet.Cells[3, 7].Value = Program.GetForm().GetPartenza();
                worksheet.Cells[4, 6].Value = "Adulti";
                worksheet.Cells[4, 7].Value = Program.GetForm().GetAdulti();
                worksheet.Cells[5, 6].Value = "Bambini";
                worksheet.Cells[5, 7].Value = Program.GetForm().GetBambini();

                int row = 2;
                if (!(ApiManager.GetQueryResult() == null))
                {
                    foreach (var hotel in ApiManager.GetQueryResult())
                    {
                        worksheet.Cells[row, 1].Value = hotel.hotel_id;
                        if (ListaButtons.GetFileLista().TryGetValue(hotel.hotel_id, out string hotelName))
                            worksheet.Cells[row, 2].Value = hotelName;
                        else
                            worksheet.Cells[row, 2].Value = "Nome sconosciuto";
                        worksheet.Cells[row, 3].Value = hotel.price;
                        worksheet.Cells[row, 4].Value = hotel.hotel_currency_code;
                        row++;
                    }
                    row++;
                    worksheet.Cells[row, 2].Value = "Media dei prezzi:";
                    worksheet.Cells[row, 3].Value = ApiManager.GetAvg();
                    worksheet.Cells["A" + row + ":D" + row].Style.Font.Name = "Calibri";
                    worksheet.Cells["A" + row + ":D" + row].Style.Font.Bold = true;
                    worksheet.Cells["A" + row + ":D" + row].Style.Fill.PatternType = ExcelFillStyle.DarkHorizontal;
                    worksheet.Cells["A" + row + ":D" + row].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.PeachPuff);

                    row++;
                    worksheet.Cells[row, 2].Value = "Prezzo minimo:";
                    worksheet.Cells[row, 3].Value = ApiManager.GetPrezzoMin();
                    worksheet.Cells["A" + row + ":D" + row].Style.Font.Name = "Calibri";
                    worksheet.Cells["A" + row + ":D" + row].Style.Font.Bold = true;
                    worksheet.Cells["A" + row + ":D" + row].Style.Fill.PatternType = ExcelFillStyle.DarkHorizontal;
                    worksheet.Cells["A" + row + ":D" + row].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.PeachPuff);

                    row++;
                    worksheet.Cells[row, 2].Value = "Prezzo massimo:";
                    worksheet.Cells[row, 3].Value = ApiManager.GetPrezzoMax();
                    worksheet.Cells["A" + row + ":D" + row].Style.Font.Name = "Calibri";
                    worksheet.Cells["A" + row + ":D" + row].Style.Font.Bold = true;
                    worksheet.Cells["A" + row + ":D" + row].Style.Fill.PatternType = ExcelFillStyle.DarkHorizontal;
                    worksheet.Cells["A" + row + ":D" + row].Style.Fill.BackgroundColor.SetColor(System.Drawing.Color.PeachPuff);
                }
                else
                    worksheet.Cells[2, 1].Value = "Errore nell'elaborazione dei dati.";
                worksheet.Column(1).Width = 20;
                worksheet.Column(2).Width = 40;
                worksheet.Column(3).Width = 15;
                worksheet.Column(4).Width = 15;
                worksheet.Column(6).Width = 20;
                worksheet.Column(7).Width = 20;
                // Save the file
                FileInfo fileInfo = new(Environment.GetFolderPath(Environment.SpecialFolder.MyDocuments) + "\\BookingAvg\\output\\risultato_" + 
                    DateTime.Now.ToString("yyyy-MM-dd_FFFFFFF") + ".xlsx");
                package.SaveAs(fileInfo);
            }
        }
    }
}
