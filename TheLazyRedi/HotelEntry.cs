using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace TheLazyRedi
{
    public class Result
    {
        public string hotel_currency_code { get; set; }
        public double price { get; set; }
        public int hotel_id { get; set; }
    }

    public class HotelEntry
    {
        public List<Result> result { get; set; }
    }
}
