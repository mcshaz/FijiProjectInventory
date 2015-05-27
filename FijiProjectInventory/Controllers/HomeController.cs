using FijiProjectInventory.Models;
using FijiProjectInventory.ServiceLayer;
using System;
using System.Web.Mvc;
using System.Collections.Generic;
using FijiProjectInventory.Helpers;
using FijiProjectInventory.Utilities;
using System.Linq;

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
        public ActionResult Index(List<RequiredItem> data, byte categoryId, byte projectDateId)
        {
            if (ModelState.IsValid)
            {
                PurchaseItemsServices.AddOrUpdateItems(data, categoryId, projectDateId);
                var returnVar = new JsonNetResult { CustomResolver = new DerivedTypeFilterContractResolver<RequiredItemIds>() };
                returnVar.Data = data.Where(r=>!r._destroy);
                return returnVar;
            }
            return ModelState.JsonValidation();
        }
        [HttpPost, ValidateAntiForgeryToken]
        public ActionResult GetPurchases(int categoryId, int projectDateId)
        {
            if (ModelState.IsValid)
            {
                var model = PurchaseItemsServices.GetRequiredItems(categoryId, projectDateId);
                var returnVar = new JsonNetResult();
                returnVar.Data = model;
                return returnVar;
            }
            return ModelState.JsonValidation();
        }
        [HttpGet]
        public ActionResult PlanningPhases()
        {
            return View(PlanningValsService.GetCurrentPhases());
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