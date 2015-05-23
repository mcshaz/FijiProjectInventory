//------------------------------------------------------------------------------
// <auto-generated>
//     This code was generated from a template.
//
//     Manual changes to this file may cause unexpected behavior in your application.
//     Manual changes to this file will be overwritten if the code is regenerated.
// </auto-generated>
//------------------------------------------------------------------------------

namespace FijiProjectInventory
{
    using System;
    using System.Collections.Generic;
    
    public partial class Purchase
    {
        public Purchase()
        {
            this.StoreMovements = new HashSet<StoreMovement>();
        }
    
        public int Id { get; set; }
        public int SubcategoryId { get; set; }
        public decimal PricePerBox { get; set; }
        public Nullable<byte> SupplierId { get; set; }
        public byte ItemsPerBox { get; set; }
        public short Boxes { get; set; }
        public Nullable<System.DateTime> DatePurchased { get; set; }
        public Nullable<System.DateTime> ExpiryDate { get; set; }
    
        public virtual Subcategory Subcategory { get; set; }
        public virtual Supplier Supplier { get; set; }
        public virtual ICollection<StoreMovement> StoreMovements { get; set; }
    }
}