using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace KnockoutDirective
{
    public enum KODirective { Observable, PropertyOnly, Unmapped, OneWayPropertyToClient, OneWayPropertyFromClient }
    [AttributeUsage(AttributeTargets.All,AllowMultiple =false)]
    public class ObservableAttribute :Attribute
    {

        public ObservableAttribute(KODirective observableType)
        {
            ObservableType = observableType;
        }
        public KODirective ObservableType { get; private set; }
    }
}