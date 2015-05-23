using FijiProjectInventory.Models;
using FijiProjectInventory.ServiceLayer;
using System;
using System.Web.Mvc;
using System.Collections.Generic;
using FijiProjectInventory.Helpers;
using FijiProjectInventory.Utilities;

namespace FijiProjectInventory.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            var model = PurchaseItemsServices.GetRequiredItemsModel();
            return View(model);
        }
        [HttpPost, ValidateAntiForgeryToken] //ValidateInput, Authorize
        public ActionResult Index(List<RequiredItem> data, byte categoryId)
        {
            if (ModelState.IsValid)
            {
                PurchaseItemsServices.AddOrUpdateItems(data, categoryId);
                var returnVar = new JsonNetResult { CustomResolver = new DerivedTypeFilterContractResolver<RequiredItemIds>() };
                returnVar.Data = data;
                return returnVar;
            }
            return ModelState.JsonValidation();
        }
        [HttpPost, ValidateAntiForgeryToken]
        public ActionResult GetPurchases(int categoryId, DateTime projectDate)
        {
            if (ModelState.IsValid)
            {
                var model = PurchaseItemsServices.GetRequiredItems(categoryId, projectDate);
                var returnVar = new JsonNetResult();
                returnVar.Data = model;
                return returnVar;
            }
            return ModelState.JsonValidation();
        }
        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
    }
}