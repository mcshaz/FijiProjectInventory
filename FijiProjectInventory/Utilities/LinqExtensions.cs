using System;
using System.Collections.Generic;

namespace FijiProjectInventory.Utilities
{
    public static class LinqExtensions
    {
        public static Tout[] Map<Tin, Tout>(this IList<Tin> list, Func<Tin, Tout> mapper)
        {
            Tout[] returnVar = new Tout[list.Count];
            for (int i = 0; i < returnVar.Length;i++)
            {
                returnVar[i] = mapper(list[i]);
            }
            return returnVar;
        }
    }
}