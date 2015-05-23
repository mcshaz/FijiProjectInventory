using Newtonsoft.Json;
using Newtonsoft.Json.Serialization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace FijiProjectInventory.Helpers
{
    //http://stackoverflow.com/questions/7109967/using-json-net-as-the-default-json-serializer-in-asp-net-mvc-3-is-it-possible
    public class JsonNetResult : JsonResult
    {
        JsonSerializerSettings _jsonSet;
        public IContractResolver CustomResolver { set { _jsonSet = new JsonSerializerSettings { ContractResolver = value }; } }
        public override void ExecuteResult(ControllerContext context)
        {
            if (context == null)
            {
                throw new ArgumentNullException("context");
            }
                
            var response = context.HttpContext.Response;

            response.ContentType = !String.IsNullOrEmpty(ContentType)
                ? ContentType
                : "application/json";

            if (ContentEncoding != null)
            {
                response.ContentEncoding = ContentEncoding;
            }
                
            // If you need special handling, you can call another form of SerializeObject below
            string serializedObject;
            if (_jsonSet == null)
            {
                serializedObject = JsonConvert.SerializeObject(Data);
            }
            else
            {
                serializedObject = JsonConvert.SerializeObject(Data,_jsonSet);
            }
            response.Write(serializedObject);
        }
    }
}