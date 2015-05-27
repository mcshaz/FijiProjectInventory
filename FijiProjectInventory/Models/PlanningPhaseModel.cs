using KnockoutDirective;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Linq;
using System.Web;

namespace FijiProjectInventory.Models
{
    public class PlanningPhaseModel
    {
        [Observable(KODirective.PropertyOnly)]
        public int Id { get; set; }
        [Required, Observable(KODirective.PropertyOnly)]
        public string Description { get; set; }
        [JsonIgnore]
        public int TextColourCode { get; set; }
        [JsonIgnore]
        public int BackgoundColourCode { get; set; }
        public string TextColour {
            get
            {
                return '#' + TextColourCode.ToString("X6");
            }
            set
            {
                TextColourCode = int.Parse(value.Substring(1), NumberStyles.HexNumber);
            }
        }
        public string BackgroundColour {
            get
            {
                return '#' + BackgoundColourCode.ToString("X6");
            }
            set
            {
                BackgoundColourCode = int.Parse(value.Substring(1), NumberStyles.HexNumber);
            }
        }

        static public PlanningPhaseModel GetBWModel()
        {
            return new PlanningPhaseModel { TextColourCode = 0, BackgoundColourCode =  /*#FFFFFF*/ 16777215 };
        }
    }
}