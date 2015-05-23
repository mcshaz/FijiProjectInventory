using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Web;
using System.Web.Mvc;
using System.ComponentModel.DataAnnotations;
using KnockoutDirective;
using System.Text;
using FijiProjectInventory.Utilities;
using Newtonsoft.Json;

namespace FijiProjectInventory.Helpers
{
    public class TwoWayMapping
    {
        public IHtmlString KoMappedObject { get; internal set; }
        public IHtmlString KoUnmappedObject { get; internal set; }
    }
    public static class ToJSValidationAttributeObject
    {
        static Tout ValueOrDefault<Tout>(this IDictionary<Type, Attribute> dict) where Tout:Attribute
        {
            Attribute outParam;
            dict.TryGetValue(typeof(Tout), out outParam);
            return (Tout)outParam;
        }
        public static TwoWayMapping ValidationToJs<TModel>(this HtmlHelper<TModel> htmlHelper, object defaultNew, bool obeyJsonIgnoreAttr = true) //, bool applyCurrency=true)
        {
            List<KOPropertyMap> properties = new List<KOPropertyMap>();
            foreach (PropertyInfo p in defaultNew.GetType().GetProperties())
            {
                if (!p.CanRead) { continue; }
                TypeCode? tc = null;
                Dictionary<Type,Attribute> atts = p.GetCustomAttributes().ToDictionary(a=>a.GetType());
                DisplayAttribute dn = atts.ValueOrDefault<DisplayAttribute>();
                string pname = (dn == null) ? p.Name : dn.Name;
                ObservableAttribute oa = atts.ValueOrDefault<ObservableAttribute>();
                if (oa == null)
                {
                    if (obeyJsonIgnoreAttr)
                    {
                        JsonIgnoreAttribute ji = atts.ValueOrDefault<JsonIgnoreAttribute>();
                        if (ji != null) { continue; }
                    }
                }
                else if(oa.ObservableType == KODirective.Unmapped)
                {
                    continue;
                }
                KOPropertyMap prop;
                bool isEnumerable = p.PropertyType.GetInterfaces().Contains(typeof(Enumerable));
                if (oa != null && (new KODirective[] { KODirective.PropertyOnly, KODirective.OneWayPropertyToClient, KODirective.OneWayPropertyFromClient }).Contains(oa.ObservableType))
                {
                    prop = new KOPropertyMap();
                    if (oa.ObservableType == KODirective.OneWayPropertyFromClient)
                    {
                        prop.InfoFlow = InformationFlow.FromClient;
                    }
                    else if(oa.ObservableType == KODirective.OneWayPropertyToClient)
                    {
                        prop.InfoFlow = InformationFlow.ToClient;
                    }
                }
                else
                {
                    KOObservableMap obs;
                    prop = obs = new KOObservableMap();

                    if (!isEnumerable)
                    {
                        var req = atts.ValueOrDefault<RequiredAttribute>();
                        if (req!=null)
                        {
                            obs.Validations.Add(new KOValidation { Name = "required", Message = req.FormatErrorMessage(pname) });
                        }
                        var m = atts.ValueOrDefault<MinLengthAttribute>();
                        if (m!=null)
                        {
                            obs.Validations.Add(new KOValidation
                            {
                                Name = "minLength",
                                Message = m.FormatErrorMessage(pname),
                                Param = m.Length
                            });
                        }
                        var l = atts.ValueOrDefault <StringLengthAttribute>();
                        if (l!=null)
                        {
                                
                            string msg = l.FormatErrorMessage(pname);
                            obs.Validations.Add(new KOValidation
                            {
                                Name = "maxLength",
                                Message = msg,
                                Param = l.MaximumLength
                            });
                            if (l.MinimumLength > 0)
                            {
                                obs.Validations.Add(new KOValidation
                                {
                                    Name = "minLength",
                                    Message = msg,
                                    Param = l.MinimumLength
                                });
                            }
                        }
                        var r = atts.ValueOrDefault<RangeAttribute>() ;
                        if (r!=null)
                        {
                                
                            string msg = r.FormatErrorMessage(pname);
                            obs.Validations.Add(new KOValidation
                            {
                                Name = "min",
                                Message = msg,
                                Param = r.Minimum
                            });
                            obs.Validations.Add(new KOValidation
                            {
                                Name = "max",
                                Message = msg,
                                Param = r.Maximum
                            });
                        }
                        var x = atts.ValueOrDefault<RegularExpressionAttribute>();
                        if (x!=null)
                        {
                            obs.Validations.Add(new KOValidation
                            {
                                Name = "pattern",
                                Message = x.FormatErrorMessage(pname),
                                Param = x.Pattern
                            });

                        }
                        var e = atts.ValueOrDefault<EmailAddressAttribute>();
                        if (e!=null)
                        {
                            obs.Validations.Add(new KOValidation
                            {
                                Name = "email",
                                Message = e.FormatErrorMessage(pname),
                            });
                        }
                        /*
                        if (applyCurrency)
                        {
                            var dt = atts.ValueOrDefault<DataTypeAttribute>();
                            if (dt != null && dt.DataType == DataType.Currency)
                            {
                                obs.IsCurrency = true;
                            }
                        }
                        */
                        tc = Type.GetTypeCode(p.PropertyType);
                        if (tc == TypeCode.DateTime)
                        {
                            DisplayFormatAttribute df = atts.ValueOrDefault<DisplayFormatAttribute>();
                            if (df!=null && IsISOFormat(df.DataFormatString))
                            {
                                obs.Validations.Add(new KOValidation { Name = "dateIso" });
                            }
                            else
                            {
                                obs.Validations.Add(new KOValidation { Name = "date" });
                            }
                        }
                        else if (TypeCode.SByte<= tc && tc<=TypeCode.Decimal)
                        {
                            obs.Validations.Add(new KOValidation { Name="number" });
                        }
                    }
                }
                prop.Name = p.Name;
                if (isEnumerable)
                {
                    prop.DefaultValue = KOPropertyMap.JSArray;
                }
                else
                {
                    DisplayFormatAttribute df = atts.ValueOrDefault<DisplayFormatAttribute>();
                    object o = p.GetValue(defaultNew);
                    if (o == null)
                    {
                        prop.DefaultValue = '\'' + ((df != null && df.NullDisplayText != null) ? df.NullDisplayText : string.Empty) + '\'';
                    }
                    else if (df == null || !df.ApplyFormatInEditMode)
                    {
                        switch (tc ?? Type.GetTypeCode(p.PropertyType))
                        {
                            case TypeCode.Char:
                            case TypeCode.String:
                            case TypeCode.DateTime:
                                prop.DefaultValue = '\'' + o.ToString() + '\'';
                                break;
                            case TypeCode.Boolean:
                                prop.DefaultValue = true.Equals(o) ? "true" : "false";
                                break;
                            default:
                                prop.DefaultValue = o.ToString();
                                break;
                        }
                    }
                    else
                    {
                        prop.DefaultValue = '\'' + string.Format(df.DataFormatString, o) + '\''; // may format to numeric eg decimal places, but javascript will handle this
                    }
                }
                properties.Add(prop);
            }

            StringBuilder sb = new StringBuilder();

            sb.Append("function KoMappedObject(data) { data = data || { }; return {");
            sb.Append(string.Join(",", properties.Where(p=>(p.InfoFlow & InformationFlow.ToClient)!=0).Select(p=>p.ToMapString())));
            sb.Append("}}");

            var returnVar = new TwoWayMapping { KoMappedObject = htmlHelper.Raw(sb) };
            sb.Clear();

            sb.Append("function KoUnmappedObject(data) { return {");
            sb.Append(string.Join(",", properties.Where(p=>(p.InfoFlow & InformationFlow.FromClient)!=0).Select(p=>p.ToReverseMapString())));
            sb.Append("}}");

            returnVar.KoUnmappedObject = htmlHelper.Raw(sb);
            return returnVar;
        }
        static bool IsISOFormat(string format)
        {
            DateTime dt = new DateTime(2014,6,3);
            string test = string.Format(format, dt);
            return test.Substring(0, 10) == "2014-06-03";
        }
    }
    [Flags]
    internal enum InformationFlow { ToClient=1, FromClient=2, Bidirectional=3}
    internal class KOPropertyMap
    {
        public KOPropertyMap()
        {
            InfoFlow = InformationFlow.Bidirectional;
        }
        public const string JSArray = "[]";
        protected const string fmt = "((typeof data.{0} == 'undefined')?{1}:data.{0})";
        public string Name { get; set; }
        public InformationFlow InfoFlow { get; set; }
        public virtual string DefaultValue { get; set; }
        public virtual string ToReverseMapString()
        {
            return string.Format("{0}:data.{0}", Name);
        }
        public virtual string ToMapString()
        {
            return string.Format("{0}:" + fmt, Name, DefaultValue);
        }
    }
    internal class KOObservableMap : KOPropertyMap
    {
        //public bool IsCurrency { get; set; }
        const string obsfmt = "ko.observable" + fmt;
        public KOObservableMap() : base()
        {
            Validations = new List<KOValidation>();
        }
        public override string DefaultValue
        {
            get
            {
                return base.DefaultValue;
            }

            set
            {
                if (value == JSArray) { base.DefaultValue = "ko.observableArray(" + JSArray + ")"; }
                base.DefaultValue = value;
            }
        }
        public IList<KOValidation> Validations { get; private set; }
        public override string ToReverseMapString()
        {
            return base.ToReverseMapString() + "()";
        }
        public override string ToMapString()
        {
            var returnVar = string.Format("{0}:" + obsfmt, Name, DefaultValue);
            //if (IsCurrency) { returnVar += ".currency().formatted"; }
            if (Validations.Any())
            {
                returnVar += ".extend({" + string.Join(",",Validations.Map(v=>v.ToJSValObject())) +"})";
            }
            return returnVar;
        }
    }
    internal class KOValidation
    {
        public string Message { get; set; }
        public object Param { get; set; }
        public string Name { get; set; }
        public string ToJSValObject()
        {
            if (Message == null) { return string.Format("{0}:{1}", Name, Param ?? "true"); }
            return string.Format("{0}:{{message:'{1}'{2}}}", Name, Message, Param==null?"":",params:" + Param);
        }
    }
}