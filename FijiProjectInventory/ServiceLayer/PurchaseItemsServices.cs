using System;
using System.Collections.Generic;
using System.Linq;
using FijiProjectInventory.Models;
using FijiProjectInventory.Utilities;
using System.Diagnostics;

namespace FijiProjectInventory.ServiceLayer
{
    public class PurchaseItemsServices
    {
        public static IEnumerable<RequiredItem> GetRequiredItems(int categoryId, DateTime projectDate)
        {
            IList<RequiredItem> returnVar;
            IEnumerable<IGrouping<int, UseByYearVw>> useByYear;
            IList<int> pastYears;
            using (InventoryEntitiesConnect db = new InventoryEntitiesConnect())
            {
                returnVar =
                (from p in db.sp_purchased_items_indate(projectDate)
                 where p.CategoryId == categoryId
                 orderby p.PurchaseId
                 select new RequiredItem
                 {
                     Boxes = p.Boxes,
                     ItemId = p.ItemId,
                     ItemName = p.Name,
                     ItemNotes = p.Notes,
                     ItemRequiresRefridge = p.RequiresRefrig,
                     ItemsPerBox = p.ItemsPerBox,
                     PricePerBox = p.PricePerBox,
                     PurchaseId = p.PurchaseId,
                     SubcategoryDescription = p.Description,
                     SubcategoryId = p.SubcatId,
                     SupplierId = p.SupplierId,
                     SupplierName = p.SupplierName,
                     RemainingItems = p.ItemsRemaining ?? 0
                 }).ToList();
                IEnumerable<int> ids = returnVar.Select(r => r.PurchaseId);
                useByYear = (from u in db.UseByYearVws
                             where ids.Contains(u.PurchaseId)
                             orderby u.PurchaseId
                             group u by u.PurchaseId into g
                             select g).ToList();
                pastYears = GetPastYears(db);
            }
            if (useByYear.Any())
            {
                Debug.Assert(returnVar.Select(r => r.PurchaseId).MembersAreEqual(useByYear.Select(u => u.Key)), "Assertion that used by year and purchases have same id in same order FAILED");
                int i = 0;
                foreach (var u in useByYear)
                {
                    returnVar[i].UsedInYear = MapYears(pastYears, u);
                    ++i;
                }
            }
            return returnVar;
        }
        public static RequiredItemsModel GetRequiredItemsModel()
        {
            var returnVar = new RequiredItemsModel();
            using (InventoryEntitiesConnect db = new InventoryEntitiesConnect())
            {
                returnVar.PastYears = GetPastYears(db);
                returnVar.Suppliers = db.Suppliers.ToKVEnumerable(s => s.Id, s => s.Name);
                returnVar.Categories = db.Categories.ToKVEnumerable(c=>c.Id, c=>c.Name);
                returnVar.ProjectDates = db.ProjectDates.Select(pd=>pd.StartDate).ToList();
            }
            return returnVar;
        }
        static public void AddOrUpdateItems (IEnumerable<RequiredItem> data, byte categoryId)
        {
            using (InventoryEntitiesConnect db = new InventoryEntitiesConnect())
            {
                foreach (var d in data)
                {
                    if (d._destroy)
                    {
                        if (d.PurchaseId != 0)
                        {
                            db.Purchases.Remove(new Purchase { Id = d.PurchaseId });
                        }
                    }
                    Item i;
                    if (d.ItemId == 0)
                    {
                        i = db.Items.FirstOrDefault(it => it.Name == d.ItemName);
                        if (i==null)
                        {
                            i = new Item();
                            db.Items.Add(i);
                        }
                    }
                    else
                    {
                        i = db.Items.Find(d.ItemId);
                    }
                    i.CategoryId = categoryId;
                    i.Name = d.ItemName;
                    i.Notes = d.ItemNotes;
                    i.RequiresRefrig = d.ItemRequiresRefridge;

                    Subcategory s;
                    if (d.SubcategoryId == 0)
                    {
                        s = new Subcategory();
                        db.Subcategories.Add(s);
                    }
                    else
                    {
                        s = db.Subcategories.Find(d.SubcategoryId);
                    }
                    s.Description = d.SubcategoryDescription ?? string.Empty;
                    s.ItemId = d.ItemId;
                    s.Item = i;

                    Purchase p;
                    if (d.PurchaseId == 0)
                    {
                        p = new Purchase();
                        db.Purchases.Add(p);
                    }
                    else
                    {
                        p = db.Purchases.Find(d.PurchaseId);
                    }
                    p.ItemsPerBox = (byte)d.ItemsPerBox;
                    p.PricePerBox = d.PricePerBox;
                    p.SubcategoryId = d.SubcategoryId;
                    p.Subcategory = s;
                    p.SupplierId = d.SupplierId;
                    p.Boxes = d.Boxes;

                    db.SaveChanges(); //todo savechangesasync

                    d.ItemId = i.Id;
                    d.SubcategoryId = s.Id;
                    d.PurchaseId = p.Id;
                }
            }
        }
        public IEnumerable<int> GetPastYears()
        {
            using (InventoryEntitiesConnect db = new InventoryEntitiesConnect())
            {
                return GetPastYears(db);
            }
        }
        private static List<int> GetPastYears(InventoryEntitiesConnect db)
        {
            return (from p in db.Purchases
                    where p.DatePurchased.HasValue
                    group p by p.DatePurchased.Value.Year into yrs
                    orderby yrs.Key descending
                    select yrs.Key).ToList();
        }
        private static IList<int> MapYears(IList<int> years, IEnumerable<UseByYearVw> usedByYear)
        {
            Debug.Assert(years.MembersUniqueDescending());
            Debug.Assert(usedByYear.Select(u => u.YearUsed).MembersUniqueDescending(), "Assertion that years for a given purchase are descending failed");
            var returnVar = new List<int>(years.Count);
            int i = 0;
            foreach (var u in usedByYear)
            {
                while (years[i] != u.YearUsed) { returnVar.Add(0); }
                returnVar.Add(years[i++]);
            }
            return returnVar;
        }
    }
}