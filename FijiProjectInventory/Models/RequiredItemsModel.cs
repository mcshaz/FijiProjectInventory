using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Web.Mvc;
using KnockoutDirective;
using FijiProjectInventory.Helpers;
using Newtonsoft.Json;
using System;

namespace FijiProjectInventory.Models
{
    public class RequiredItemsModel
    {
        public RequiredItemsModel()
        {
            RequiredItemDefaults = new RequiredItem();
        }
        public IEnumerable<SelectListItem> ItemClassses { get; set; }
        public IList<DateTime> PastProjectDates { get; set; }
        public RequiredItem RequiredItemDefaults { get; private set; }
        public KVEnumerable<int, string> Suppliers { get; set; }
        public KVEnumerable<int, string> Categories { get; set; }
        public KVEnumerable<int,DateTime> ProjectDates { get; set; }
    }
    public class RequiredItemIds
    {
        [Observable(KODirective.PropertyOnly),Key]
        public int ItemId { get; set; }
        [Observable(KODirective.PropertyOnly),Key]
        public int PurchaseId { get; set; }
        [Observable(KODirective.PropertyOnly),Key]
        public int ItemSubcategoryId { get; set; }
        [Observable(KODirective.PropertyOnly)]
        public byte? SupplierId { get; set; }
    }
    public class RequiredItem : RequiredItemIds
    {
        [Display(Name ="Item"), Required, StringLength(50,MinimumLength =2)]
        public string ItemName { get; set; }
        [Display(Name = "Fridge"), Required]
        public bool ItemRequiresRefridge { get; set; }
        [Display(Name = "Notes"), StringLength(1000)]
        public string ItemNotes { get; set; }
        [Display(Name = "Type"), StringLength(50)]
        public string ItemSubcategoryDescription { get; set; }
        [Display(Name = "Price/Box"), DisplayFormat(DataFormatString = "c"), 
            Range(0.01,20000.0,ErrorMessage = "price must be greater than $0.00 and less than $20,000"),
            Required, DataType(DataType.Currency)]
        public decimal PricePerBox { get; set; }
        [Display(Name = "Supplier"), StringLength(50)]
        public string SupplierName { get; set; }
        //[Display(Name = "% off"), DisplayFormat(DataFormatString = "P")]
        //public decimal DiscountApplied { get; set; }
        [Display(Name = "Items/Box"), Required, Range(1,5000)]
        public short ItemsPerBox { get; set; }
        [Display(Name = "Boxes"), Required, Range(0,200)]
        public short Boxes { get; set; }
        [Display(Name = "In Stock"), Observable(KODirective.OneWayPropertyToClient)]
        public int RemainingItems { get; set; }
        [Observable(KODirective.OneWayPropertyToClient)]
        public IEnumerable<int> UsedInYear { get; set; }
        [Display(Name = "Items"), JsonIgnore]
        public int? ItemsPurchased { get
            {
                return null; // ItemsPerBox * Boxes;
            } }
        [Display(Name = "Total"), DisplayFormat(DataFormatString = "{0:C}"), JsonIgnore, DataType(DataType.Currency)]
        public decimal? Cost { get {
                return null;//PricePerBox * (decimal)Boxes;
            } }
        [Display(Name = "Item Cost"), DisplayFormat(DataFormatString = "{0:C}"), JsonIgnore, DataType(DataType.Currency)]
        public decimal? PerItemCost { get {
                return null;//default(decimal); //PricePerBox / (decimal)ItemsPerBox;
            } }
        [Observable(KODirective.OneWayPropertyFromClient), JsonIgnore]
        public bool _destroy { get; set; }
    }
}