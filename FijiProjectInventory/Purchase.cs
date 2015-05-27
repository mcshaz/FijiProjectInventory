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
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2214:DoNotCallOverridableMethodsInConstructors")]
        public Purchase()
        {
            this.StoreMovements = new HashSet<StoreMovement>();
        }
    
        public int Id { get; set; }
        public int ItemSubcategoryId { get; set; }
        public decimal PricePerBox { get; set; }
        public Nullable<int> SupplierId { get; set; }
        public byte ItemsPerBox { get; set; }
        public short Boxes { get; set; }
        public Nullable<System.DateTime> DatePurchased { get; set; }
        public Nullable<System.DateTime> ExpiryDate { get; set; }
        public int PurchaseForProjectDateId { get; set; }
        public int PlanningPhaseId { get; set; }
    
        public virtual ItemSubcategory ItemSubcategory { get; set; }
        public virtual ProjectDate ProjectDate { get; set; }
        [System.Diagnostics.CodeAnalysis.SuppressMessage("Microsoft.Usage", "CA2227:CollectionPropertiesShouldBeReadOnly")]
        public virtual ICollection<StoreMovement> StoreMovements { get; set; }
        public virtual Supplier Supplier { get; set; }
        public virtual PlanningPhase PlanningPhas { get; set; }
    }
}
