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
    
    public partial class Subcategory
    {
        public Subcategory()
        {
            this.Purchases = new HashSet<Purchase>();
        }
    
        public int Id { get; set; }
        public string Description { get; set; }
        public int ItemId { get; set; }
    
        public virtual Item Item { get; set; }
        public virtual ICollection<Purchase> Purchases { get; set; }
    }
}
