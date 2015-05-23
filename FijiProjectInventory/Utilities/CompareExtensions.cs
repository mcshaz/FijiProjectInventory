using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FijiProjectInventory.Utilities
{
    public static class CompareExtensions
    {
        public static bool MembersAreEqual<T>(this IEnumerable<T> e1, IEnumerable<T> e2)
        {
            if (ReferenceEquals(e1, e2))
                return true;

            if (e1 == null || e2 == null)
                return false;

            EqualityComparer<T> comparer = EqualityComparer<T>.Default;
            using (var e2e = e2.GetEnumerator())
            {
                foreach (T i1 in e1)
                {
                    if (!(e2e.MoveNext() && comparer.Equals(i1, e2e.Current))) { return false; }
                }
                return !e2e.MoveNext();
            }
        }

        public static bool MembersUniqueDescending<T>(this IEnumerable<T> e) where T : IComparable
        {
            using (var ee = e.GetEnumerator())
            {
                if (!ee.MoveNext()) { return true; }
                T lastVal = ee.Current;
                while (ee.MoveNext())
                {
                    if (lastVal.CompareTo(ee.Current) <= 0) { return false; }
                    lastVal = ee.Current;
                }
                return true;
            }
        }
    }
}