using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using FijiProjectInventory.Models;

namespace FijiProjectInventory.ServiceLayer
{
    public class PlanningValsService
    {
        public static IEnumerable<PlanningPhaseModel> GetCurrentPhases()
        {
            using (var db = new InventoryEntities())
            {
                return (from p in db.PlanningPhases
                        select new PlanningPhaseModel
                        {
                            Description = p.Description,
                            BackgoundColourCode = p.BackgroundColour,
                            TextColourCode = p.TextColour
                        }).ToList();
            }
        }
    }
}