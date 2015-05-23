using System;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace FijiProjectInventory.Helpers
{
    public class KVEnumerable<TKey,TValue> : IEnumerable, IEnumerable<KeyValuePair<TKey,TValue>> 
    {
        private List<KeyValuePair<TKey, TValue>> pairs;

        public KVEnumerable()
        {
            pairs = new List<KeyValuePair<TKey, TValue>>();
        }

        public void Add(TKey key, TValue value) { pairs.Add(new KeyValuePair<TKey, TValue>(key, value)); }

        public IEnumerator<KeyValuePair<TKey, TValue>> GetEnumerator() { return pairs.GetEnumerator(); }

        IEnumerator IEnumerable.GetEnumerator() { return pairs.GetEnumerator(); }
    }
}