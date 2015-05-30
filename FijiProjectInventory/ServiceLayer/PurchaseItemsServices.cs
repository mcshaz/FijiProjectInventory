using System;
using System.Collections.Generic;
using System.Linq;
using FijiProjectInventory.Models;
using FijiProjectInventory.Utilities;
using System.Diagnostics;
using System.Web;
using Microsoft.AspNet.Identity;
using FijiProjectInventory.Exceptions;

namespace FijiProjectInventory.ServiceLayer
{
    public class PurchaseItemsServices
    {
        public static IEnumerable<RequiredItem> GetRequiredItems(int categoryId, int projectDateId)
        {
            IList<RequiredItem> returnVar;
            IEnumerable<IGrouping<int, UsedByProjectDate>> useByProjectDate;
            IList<int> pastProjectIds;
            var today = DateTime.Today;
            using (InventoryEntities db = new InventoryEntities())
            {
                returnVar =
                (from p in db.sp_purchased_items_indate(projectDateId)
                 where p.CategoryId == categoryId
                 orderby p.SubcatId
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
                     ItemSubcategoryDescription = p.Description,
                     ItemSubcategoryId = p.SubcatId,
                     SupplierId = p.SupplierId,
                     SupplierName = p.SupplierName,
                     RemainingItems = p.ItemsRemaining ?? 0
                 }).ToList();
                useByProjectDate = (from u in db.UsedByProjectDates
                                     group u by u.ItemSubcategoryId into g
                                     select g).ToList();
                pastProjectIds = (from p in db.ProjectDates
                                  where p.StartDate < today
                                 orderby p.StartDate descending
                                 select p.Id).ToList();

                byte[] sessionId = GetSessionId();
                var ur = db.UserReviews.Find(sessionId);
                if (ur == null)
                {
                    ur = new UserReview
                    {
                        SessionId = sessionId,
                        UserId = GetUserId(),
                        FirstViewTime = DateTime.UtcNow
                    };
                    db.UserReviews.Add(ur);
                    db.SaveChangesAsync();
                }
            }
            if (useByProjectDate.Any())
            {
                Debug.Assert(returnVar.Select(r => r.ItemSubcategoryId).MembersAreEqual(useByProjectDate.Select(u => u.Key)), "Assertion that used by year and purchases have same id in same order FAILED");
                int i = 0;
                foreach (var u in useByProjectDate)
                {
                    returnVar[i].UsedInYear = MapYears(pastProjectIds, u);
                    ++i;
                }
            }
            return returnVar;
        }
        public static RequiredItemsModel GetRequiredItemsModel()
        {
            var returnVar = new RequiredItemsModel();
            using (InventoryEntities db = new InventoryEntities())
            {
                returnVar.PastProjectDates = (from pd in db.ProjectDates
                                              orderby pd.StartDate descending
                                              select pd.StartDate).ToList();
                returnVar.Suppliers = db.Suppliers.ToKVEnumerable(s => s.Id, s => s.Name);
                returnVar.Categories = db.Categories.ToKVEnumerable(c=>c.Id, c=>c.Name);
                returnVar.ProjectDates = db.ProjectDates.ToKVEnumerable(pd=>pd.Id,pd=>pd.StartDate);
            }
            return returnVar;
        }
        static byte[] GetSessionId()
        {
            return Convert.FromBase64String(HttpContext.Current.Session.SessionID);
        }
        static Guid GetUserId()
        {
            return Guid.Parse(HttpContext.Current.User.Identity.GetUserId());
        }
        static public void AddOrUpdateItems (IEnumerable<RequiredItem> data, byte categoryId, byte projectDateId)
        {
            Debug.Assert(data != null && data.Any(), "Assertion that add or update item contains at least 1 entry failed");
            using (InventoryEntities db = new InventoryEntities())
            {
                byte[] sessionId = GetSessionId();
                var rv = db.UserReviews.AsNoTracking().FirstOrDefault(ur=>ur.SessionId == sessionId); //no tracking so it does not update on every call to save
                Guid userId = GetUserId();
                if (rv == null)
                {
                    Elmah.ErrorSignal.FromCurrentContext().Raise(new UnexpectedSessionIdChange("beginning CRUD operation, sessionID has changed from last data view"));
                    rv = (from ur in db.UserReviews
                          where ur.UserId == userId
                          orderby ur.FirstViewTime descending
                          select ur).First();
                }
                
                foreach (var d in data)
                {
                    if (d._destroy)
                    {
                        bool toDelete = false;
                        if (d.PurchaseId != 0 && 
                            !db.Purchases.Any(p => p.StoreMovements.Any() && p.ProjectDate == null))
                        {
                            var p = new Purchase { Id = d.PurchaseId };
                            db.Purchases.Attach(p);
                            db.Purchases.Remove(p);
                            db.SaveChanges();
                            toDelete = true;
                        }
                        if (d.ItemSubcategoryId != 0 && 
                            !db.Purchases.Any(p => p.ItemSubcategoryId==d.ItemSubcategoryId))//p.Id != d.PurchaseId && 
                        {
                            var s = new ItemSubcategory { Id = d.ItemSubcategoryId };
                            db.ItemSubcategories.Attach(s);
                            db.ItemSubcategories.Remove(s);
                            db.SaveChanges();
                            toDelete = true;
                        }
                        if (d.ItemId != 0 && 
                            !db.ItemSubcategories.Any(s =>s.ItemId == d.ItemId)) // s.Id!=d.SubcategoryId && 
                        {
                            var i = new Item { Id = d.ItemId };
                            db.Items.Attach(i);
                            db.Items.Remove(i);
                            db.SaveChanges();
                            toDelete = true;
                        }
                        if (toDelete) { rv.Deletes++; }
                    } else {
                        Item i;
                        if (d.ItemId == 0)
                        {
                            i = db.Items.FirstOrDefault(it => it.Name == d.ItemName);
                            if (i == null)
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

                        ItemSubcategory s;
                        if (d.ItemSubcategoryId == 0)
                        {
                            s = new ItemSubcategory();
                            db.ItemSubcategories.Add(s);
                        }
                        else
                        {
                            s = db.ItemSubcategories.Find(d.ItemSubcategoryId);
                        }
                        s.Description = d.ItemSubcategoryDescription ?? string.Empty;
                        s.ItemId = d.ItemId;
                        s.Item = i;

                        Purchase p;
                        if (d.PurchaseId == 0)
                        {
                            p = new Purchase();
                            db.Purchases.Add(p);
                            rv.Creates++;
                        }
                        else
                        {
                            p = db.Purchases.Find(d.PurchaseId);
                            rv.Updates++;
                        }
                        p.ItemsPerBox = (byte)d.ItemsPerBox;
                        p.PricePerBox = d.PricePerBox;
                        p.ItemSubcategoryId = d.ItemSubcategoryId;
                        p.ItemSubcategory = s;
                        p.SupplierId = d.SupplierId;
                        p.PurchaseForProjectDateId = projectDateId;
                        p.Boxes = d.Boxes;

                        db.SaveChanges(); //todo savechangesasync

                        d.ItemId = i.Id;
                        d.ItemSubcategoryId = s.Id;
                        d.PurchaseId = p.Id;
                    }
                }
                db.UserReviews.Attach(rv);
                db.SaveChangesAsync();
            }
        }

        private static IList<int> MapYears(IList<int> ids, IEnumerable<UsedByProjectDate> usedByProject)
        {
            Debug.Assert(ids.MembersUniqueDescending(), "Assertion that ids of past project dates are unique and descending failed");
            Debug.Assert(usedByProject.Select(u => u.StartDate).MembersUniqueDescending(), "Assertion that years for a given purchase are descending failed");
            var returnVar = new List<int>(ids.Count);
            int i = 0;
            foreach (var u in usedByProject)
            {
                while (ids[i] != u.ItemSubcategoryId) { returnVar.Add(0); }
                returnVar.Add(ids[i++]);
            }
            return returnVar;
        }
    }
}