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
        public static IHtmlString PropertyName<TModel, TProperty>(this HtmlHelper<TModel> htmlHelper, Expression<Func<TModel, TProperty>> expression)
        {
            if (expression == null)
            {
                throw new ArgumentNullException("expression");
            }

            ModelMetadata metadata = ModelMetadata.FromLambdaExpression(expression, htmlHelper.ViewData);

            string expr = ExpressionHelper.GetExpressionText(expression);
            int i = expr.LastIndexOf('.') + 1;

            return htmlHelper.Raw(expr.Substring(i));
        }
    }
}