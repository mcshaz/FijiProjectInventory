using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FijiProjectInventory.Exceptions
{
    public class UnexpectedSessionIdChange : Exception
    {
        public UnexpectedSessionIdChange(string msg) : base(msg) { }
    }
}