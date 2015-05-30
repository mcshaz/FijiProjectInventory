using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web;

namespace FijiProjectInventory.Utilities
{
    public static class StringBuilderExtensions
    {
        public static StringBuilder AppendJoin(this StringBuilder sb, string joiner, IEnumerable<string> list)
        {
            foreach (string l in list)
            {
                sb.Append(l).Append(joiner);
            }
            sb.Length -= joiner.Length;
            return sb;
        }
    }
}