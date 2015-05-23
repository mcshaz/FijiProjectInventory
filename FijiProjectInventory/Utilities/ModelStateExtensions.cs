using FijiProjectInventory.Helpers;
using System.Linq;
using System.Web.Mvc;

namespace FijiProjectInventory.Utilities
{
    public static class ModelStateExtensions
    {
        //jsonNetResult rather than jsonresult because zangit was serving 400 response header OR JSON, but not both???
        public static JsonNetResult JsonValidation(this ModelStateDictionary state)
        {
            return new JsonNetResult
            {
                Data = new
                {
                    Tag = "ValidationError",
                    State = (from e in state
                            where e.Value.Errors.Any()
                            select new 
                            {
                                Name = e.Key,
                                Errors = e.Value.Errors.Select(x => x.ErrorMessage)
                                                  .Concat(e.Value.Errors.Where(x => x.Exception != null).Select(x => x.Exception.Message))
                            })
                }
            };
        }
    }
}