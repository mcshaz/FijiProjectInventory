using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Web;
using System.Web.Mvc;

namespace FijiProjectInventory.Helpers
{
    public static partial class CustomHelpers
    {
        public static IHtmlString AsJson<TModel>(this HtmlHelper<TModel> htmlHelper, object o)
        {
            return htmlHelper.Raw(Newtonsoft.Json.JsonConvert.SerializeObject(o));
        }
    }
}