using FijiProjectInventory.Helpers;
using System;
using System.Collections.Generic;

namespace FijiProjectInventory.Utilities
{
    public static class KVExtensions
    {
        public static KVEnumerable<TKey, Tin> ToKVEnumerable<Tin, TKey>(this IEnumerable<Tin> list, Func<Tin, TKey> key)
        {
            var returnVar = new KVEnumerable<TKey, Tin>();
            using (IEnumerator<Tin> en = list.GetEnumerator())
            {
                while (en.MoveNext())
                {
                    returnVar.Add(key(en.Current), en.Current);
                }
            }
            return returnVar;
        }

        public static KVEnumerable<TKey, TValue> ToKVEnumerable<Tin, TKey, TValue>(this IEnumerable<Tin> list, Func<Tin, TKey> key, Func<Tin, TValue> value)
        {
            var returnVar = new KVEnumerable<TKey, TValue>();
            using (IEnumerator<Tin> en = list.GetEnumerator())
            {
                while (en.MoveNext())
                {
                    returnVar.Add(key(en.Current), value(en.Current));
                }
            }
            return returnVar;
        }
    }
}